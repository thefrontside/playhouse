import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as ps from 'platformscript';
import { Button } from '@material-ui/core';
import { MonacoEditor, YAMLEditor } from './yaml-editor/YamlEditor';
import { useAsync } from 'react-use';
import type { PSMap, PSValue } from 'platformscript';

const DefultYaml = `$Button:
  text: 'Press Me'`;

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
    Button: ps.fn(function* ({ arg, env }) {
      const $arg = yield* env.eval(arg);
      let children = '';
      switch($arg.type) {
        case 'string':
          children = $arg.value;
          break;
        case 'map':
          children = lookup('text', $arg)?.value ?? '';
          break;
        default:
          children = String($arg.type);
      }

      return ps.external(<Button >{children}</Button>);
    },
    ),
  }), []);

  const [yaml, setYaml] = useState<string | undefined>(DefultYaml);

  const handleEditorMount = useCallback((editor: MonacoEditor) => {
    editorRef.current = editor;
  }, []);

  const platformscript = useMemo(() => ps.createPlatformScript(globals), [globals]);

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
