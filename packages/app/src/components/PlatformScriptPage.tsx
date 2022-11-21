import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as ps from 'platformscript';
import { Button } from '@material-ui/core';
import { YAMLEditor } from './yaml-editor/YamlEditor';
import type { MonacoEditor } from './yaml-editor/YamlEditor';
import { useAsync } from 'react-use';

export function PlatformScriptPage() {
  const globals = useMemo(() => ps.map({
    Button: ps.fn(function*({ arg }) {
      return ps.external(<Button>{String(arg.value)}</Button>);
    },
    ),
  }), []);

  const [yaml, setYaml] = useState<string | undefined>(`$Button: "Press Me"`);

  const editorRef = useRef<MonacoEditor>(null);
  
  const handleEditorMount = useCallback((editor: MonacoEditor) => {
    editorRef.current = editor;
  }, []);

  function handleEditorChange(value?: string) {
    if(!yaml) {
      return;
    }
    
    setYaml(value);
  };
  
  const platformscript = useMemo(() => ps.createPlatformScript(globals), [globals]);

  const result = useAsync(async () => {
    const program = platformscript.parse(yaml as string);

    const mod = await platformscript.eval(program);

    return mod.value;
  }, [yaml]);

  if (result.loading) {
    return <h1>...loading</h1>
  } else if (result.error) {
    return <h1>{result.error.message}</h1>
  }   

  return (
  <>
      <div>
        {result.value}
        <YAMLEditor
          onMount={handleEditorMount}
          onChange={handleEditorChange}
          defaultValue={yaml}
        />
      </div>
    </>
  );
}
