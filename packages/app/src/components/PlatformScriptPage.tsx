import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as ps from 'platformscript';
import { MonacoEditor, YAMLEditor } from './yaml-editor/YamlEditor';
import { useAsync } from 'react-use';
import type { PSValue } from 'platformscript';
import { globals } from './globals';

export function usePlatformScript(yaml: string) {
  const platformscript = useMemo(() => {
    return ps.createPlatformScript(globals);
  }, []);

  const result = useAsync(async (): Promise<PSValue | undefined> => {
    const program = ps.parse(yaml as string);

    const mod = await platformscript.eval(program);

  return mod.value;
  }, [yaml]);

  return result;
}

interface PlatformScriptOptions {
  yaml: string;
  initialYaml: string
  onChange: (value: string) => void 
}

export function PlatformScriptEditor({ yaml, initialYaml, onChange }: PlatformScriptOptions) {
  const editorRef = useRef<MonacoEditor>(null);


  const handleEditorMount = useCallback((editor: MonacoEditor) => {
    editorRef.current = editor;
  }, []);

  const result = usePlatformScript(yaml);

  return (
    <>
      <div>
        {result.loading && (<h2>...loading</h2>)}
        <YAMLEditor
          defaultValue={initialYaml}
          onMount={handleEditorMount}
          onChange={(value = '"false"') => onChange(value)}
          value={yaml}
        />
      </div>
    </>
  );
}
