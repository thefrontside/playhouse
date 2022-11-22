import React from 'react';
import { assert } from 'assert-ts';
import type { ComponentType } from 'react';
import type { PlatformScript, PSMap, PSValue } from 'platformscript';
import * as ps from 'platformscript';
import { Button, Typography } from '@material-ui/core';


type TypographyProps = typeof Typography extends ComponentType<infer P>
  ? P
  : never;

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


export function globals(interpreter: PlatformScript) {
  return ps.map({
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
    div: ps.fn(function* ({ arg, env }) {
      const $arg = yield* env.eval(arg);

      let children: any = '';

      switch ($arg.type) {
        case 'map':
          children = lookup('children', $arg);

          break;
        default:
          children = String($arg.type);
      }

      return ps.external(<div>{children.value}</div>)
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

      switch ($arg.type) {
        case 'string':
          children = $arg.value;
          break;
        case 'map': {
          children = lookup('text', $arg)?.value ?? '';

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

      return ps.external(<Button onClick={clickHandler}>{children}</Button>);
    },)
  })
}