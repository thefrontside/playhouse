import React, { useCallback, useMemo, useRef, useState } from 'react';
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
        $CodeSnippet:
          language: 'yaml'
          text: >-
            metadata:
              name: example
              links:
                - url: https://dashboard.example.com
                  title: My Dashboard
                  icon: dashboard
          showLineNumbers: true
          highlightedNumbers: [3, 4, 5, 6]
  - $Button:
      text: "Read More"
      variant: "contained"
      color: "primary"
      target: "_blank"
      href: "https://backstage.io/docs/features/software-catalog/descriptor-format#links-optional"
`;

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

export function PlatformScriptPage() {
  const editorRef = useRef<MonacoEditor>(null);

  const [yaml, setYaml] = useState<string | undefined>(DefultYaml);

  const handleEditorMount = useCallback((editor: MonacoEditor) => {
    editorRef.current = editor;
  }, []);


  const result = usePlatformScript(yaml ?? 'false');

  return (
    <>
      <div>
        {result.loading && (<h2>...loading</h2>)}
        {result.value}
        <YAMLEditor
          defaultValue={DefultYaml}
          onMount={handleEditorMount}
          onChange={(value) => setYaml(value)}
          value={yaml}
        />
      </div>
    </>
  );
}
