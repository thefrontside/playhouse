
import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import * as ps from 'platformscript';
import { Button, Typography } from '@material-ui/core';
import { MonacoEditor, YAMLEditor } from './yaml-editor/YamlEditor';
import { useAsync } from 'react-use';
import type { PSMap, PSValue } from 'platformscript';
import { assert } from 'assert-ts';

type TypographyProps = typeof Typography extends ComponentType<infer P>
  ? P
  : never;

type Variant = TypographyProps['variant'];

const DefultYaml = `$Typography:
  variant: 'body1'
  children:
    "No links defined for this entity. You can add links to your entity YAML
    as shown in the highlighted example below:"
  div:
    className: 'whatever'
`;

export function lookup(key: string, map: PSMap): PSValue | void {
  for (const entry of map.value.entries()) {
    const [k, value] = entry;
    if (k.value.toString() === key) {
      return value;
    }
  }
  return void 0;
}

export function PlatformScriptPage() {
  const editorRef = useRef<MonacoEditor>(null);

  const globals = useMemo(() => ps.map({
    alert: ps.fn(function* ({ arg, env }) {
      const $arg = yield* env.eval(arg);

      const message = String($arg.value);

      // eslint-disable-next-line no-alert
      window.alert(message);

      return ps.boolean(true);
    }),
    Typography: ps.fn(function* ({ arg, env }) {
      const $arg = yield* env.eval(arg);
      let variant = '';
      let children: any = '';

      switch ($arg.type) {
        case 'string':
          variant = $arg.value;
          break;
        case 'map':
          children = lookup('children', $arg);

          if (children) {
            children = yield* env.eval(children);
          }

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
              ps.run(() => env.call(psClickHandler, {
                arg: ps.boolean(true),
                rest: ps.map({}),
                env
              }));
            }
          }

          break;
        }
        default:
          children = String($arg.type);
      }


      return ps.external(<Button onClick={clickHandler}>{children}</Button>);
    },)
  }), []);

  const platformscript = useMemo(() => ps.createPlatformScript(globals), [globals]);

  const [yaml, setYaml] = useState<string | undefined>(DefultYaml);

  const handleEditorMount = useCallback((editor: MonacoEditor) => {
    editorRef.current = editor;
  }, []);

  const result = useAsync(async (): Promise<PSValue | undefined> => {
    const program = platformscript.parse(yaml as string);

    const mod = await platformscript.eval(program);

    return mod.value;
  }, [yaml]);


  return (
    <>
      <div>
        {result.loading && (<h2>...loading</h2>)}
        <YAMLEditor
          defaultValue={DefultYaml}
          onMount={handleEditorMount}
          onChange={(value) => setYaml(value)}
          value={yaml}
        />
        {result.value}
      </div>
    </>
  );
}
