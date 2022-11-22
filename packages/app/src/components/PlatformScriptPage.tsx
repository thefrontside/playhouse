import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as ps from 'platformscript';
import { Button } from '@material-ui/core';
import { MonacoEditor, YAMLEditor } from './yaml-editor/YamlEditor';
import { useAsync } from 'react-use';
import type { PSMap, PSValue } from 'platformscript';
import { assert } from 'assert-ts';

const DefultYaml = `$Button:
  text: 'Press Me'
  onClick:
    $():
      $alert: "Pressed!"
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
    alert: ps.fn(function * ({arg, env}) {
      const $arg = yield* env.eval(arg);

      const message = String($arg.value);

      // eslint-disable-next-line no-alert
      window.alert(message);

      return ps.boolean(true);
    }),
    Button: ps.fn(function* ({ arg, env }) {
      const $arg = yield* env.eval(arg);
      let children = '';
      // TODO: fix return type
      let clickHandler = (): any => void 0;
      switch($arg.type) {
        case 'string':
          children = $arg.value;
          break;
        case 'map':{
          children = lookup('text', $arg)?.value ?? '';

          const psClickHandler = lookup('onClick', $arg);

          if(psClickHandler) {
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
    },
    ),
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
        {result.error && <h2>{result.error.message}</h2>}
        {result.value}
        <YAMLEditor
          key="one"
          defaultValue={DefultYaml}
          onMount={handleEditorMount}
          onChange={(value) => setYaml(value)}
          value={yaml}
        />
      </div>
    </>
  );
}
