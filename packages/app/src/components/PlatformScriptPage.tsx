import React, { useCallback, useRef, useState } from 'react';
import * as ps from 'platformscript';
import { MonacoEditor, YAMLEditor } from './yaml-editor/YamlEditor';
import { useAsync } from 'react-use';
import type { PSValue } from 'platformscript';
import { globals } from './globals';

const DefultYaml = `$<>:
  - $Typography:
      variant: 'body1'
      children:
        "No links defined for this entity. You can add links to your entity YAML as shown in the highlighted example below:"
  - $div:
      className: 'whatever'
      children:
        "children"    
`;

export function PlatformScriptPage() {
  const editorRef = useRef<MonacoEditor>(null);

  const platformscript = ps.createPlatformScript(globals);

  const [yaml, setYaml] = useState<string | undefined>(DefultYaml);

  const handleEditorMount = useCallback((editor: MonacoEditor) => {
    editorRef.current = editor;
  }, []);

  const result = useAsync(async (): Promise<PSValue | undefined> => {
    const program = ps.parse(yaml as string);

    const mod = await platformscript.eval(program);

    return mod.value;
  }, [yaml]);

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  // result.error && console.log(result.error);
  
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
