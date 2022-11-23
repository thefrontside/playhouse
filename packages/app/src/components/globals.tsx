import React from 'react';
import { assert } from 'assert-ts';
import type { ComponentType } from 'react';
import type { PlatformScript, PSMap, PSValue } from 'platformscript';
import * as ps from 'platformscript';
import { Button, Grid, Typography } from '@material-ui/core';
import { CodeSnippet } from '@backstage/core-components';
import { EntityAboutCard, EntityLinksCard } from '@backstage/plugin-catalog';
import { HumanitecCardComponent } from '@frontside/backstage-plugin-humanitec';

type ComponentProps<C extends ComponentType> = C extends ComponentType<infer P>
? P
: never;

type TypographyProps = ComponentProps<typeof Typography>;
type ButtonProps = ComponentProps<typeof Button>;

type Variant = TypographyProps['variant'];

export function lookup(key: string, map: PSMap): PSValue | void {
  for (const entry of map.value.entries()) {
    const [k, value] = entry;
    if (k.value.toString() === key) {
      return value;
    }
  }
  return void 0;
}

function createReactComponent(type: any) {
  return ps.fn(function* ({ arg, env, rest }) {

    const $arg: PSValue = yield* env.eval(arg);
    if (rest.type === "map") {
      // add key prop to each item in children array 
      for (const [key, value] of rest.value.entries()) {
        if (key.type === "string" && key.value === "children" && value.type === "list") {
          let index = 0;
          for (const item of value.value) {
            if (item.type === "map") {
              let found;
              for (const [propKey] of item.value.entries()) {
                if (propKey.value === "key") {
                  found = true;
                  break;
                }
              }
              if (!found) {
                item.value.set(
                  { type: "string", value: "key" }, 
                  { type: "string", value: String(index) }
                )
              }
            }
            index++;
          }
        }
      }
    }
    const $options = yield* env.eval(rest);

    const props: Record<string, any> = {};
    let children = [];

    switch ($arg.type) {
      case "map": 
        for (const [key, value] of $arg.value.entries()) {
          props[String(key.value)] = value.value
        }        
        if ($options.type === "map") {
          const key = lookup('key', $options);
          if (!!key) {
            props.key = key.value
          }
          const _children = lookup('children', $options);
          if (!!_children) {
            if (_children.type === "list") {
              children = _children.value.map(value => value.value)
            } else {
              children = _children.value;
            }
          }
        }
        break;
      case "list":
        children = $arg.value.map(value => value.value);
        break;
      default:
        children = $arg.value;

    }

    return ps.external(React.createElement(type, props, children))
  });
};

export function globals(interpreter: PlatformScript) {
  return ps.map({
    div: createReactComponent('div'),
    Grid: createReactComponent(Grid),
    EntityAboutCard: createReactComponent(EntityAboutCard),
    HumanitecCardComponent: createReactComponent(HumanitecCardComponent),
    EntityLinksCard: createReactComponent(EntityLinksCard),
    alert: ps.fn(function* ({ arg, env }) {
      const $arg = yield* env.eval(arg);

      const message = String($arg.value);

      // eslint-disable-next-line no-alert
      window.alert(message);

      return ps.boolean(true);
    }),
    '<>': ps.fn(function* ({ arg, env }) {
      const $arg = yield* env.eval(arg);

      assert($arg.type === 'list', `a fragment must contain a list, found ${$arg.type}`);

      // TODO: investigate types
      // A JSX element has a `key` field which defaults to null
      const elements = $arg.value.map((psValue: { value: any }, i: number) => ({ ...psValue.value, key: psValue.value.key !== null ? psValue.value.key : i }));

      return ps.external(<>{elements}</>);
    }),
    CodeSnippet: ps.fn(function* ({ arg, env }) {
      const $arg = yield* env.eval(arg);
      let text = '';
      let showLineNumbers: boolean | undefined = undefined;
      let highlightedNumbers: number[] = [];
      let language = ''

      if ($arg.type === 'map') {
        text = lookup('text', $arg)?.value;
        showLineNumbers = lookup('showLineNumbers', $arg)?.value;
        highlightedNumbers = lookup('highlightedNumbers', $arg)?.value.map((v: any) => v.value);
        language = lookup('language', $arg)?.value;
      }

      return ps.external(
        <CodeSnippet
          text={text}
          language={language}
          showLineNumbers={showLineNumbers}
          highlightedNumbers={highlightedNumbers}
          customStyle={{ background: 'inherit', fontSize: '115%' }}
        />
      )
    }),
    Typography: ps.fn(function* ({ arg, env }) {
      const $arg = yield* env.eval(arg);
      let variant = '';
      let children: any = '';

      switch ($arg.type) {
        case 'map':
          children = lookup('children', $arg);

          variant = lookup('variant', $arg)?.value;

          break;
        default:
          children = String($arg.type);
      }

      return ps.external(<Typography variant={variant as Variant}>{children.value}</Typography>);
    },),
    Button: ps.fn(function* ({ arg, env }) {
      const $arg = yield* env.eval(arg);

      let children = '';
      let clickHandler = (): void => void 0;
      let variant: Variant = undefined;
      let color = '';
      let href: string | undefined = undefined;

      switch ($arg.type) {
        case 'string':
          children = $arg.value;
          break;
        case 'map': {
          children = lookup('text', $arg)?.value ?? '';
          variant = lookup('variant', $arg)?.value ?? '';
          color = lookup('color', $arg)?.value ?? '';
          href = lookup('href', $arg)?.value ?? '';

          const psClickHandler = lookup('onClick', $arg);

          if (psClickHandler) {
            assert(psClickHandler.type === 'fn', `onClick must be a function but is ${psClickHandler.type}`);

            clickHandler = () => {
              interpreter.run(() => env.call(psClickHandler, ps.boolean(true)));
            };
          }

          break;
        }
        default:
          children = String($arg.type);
      }

      return ps.external(
        <Button
          href={href}
          color={color as ButtonProps['color']}
          variant={variant as ButtonProps['variant']}
          onClick={clickHandler}>{children}
        </Button>);
    },)
  })
}