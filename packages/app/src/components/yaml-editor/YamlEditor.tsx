import React from 'react';
import Editor, { OnChange } from "@monaco-editor/react";
import type { EditorProps, OnMount, BeforeMount } from "@monaco-editor/react";

export type YAMLEditorProps = Pick<EditorProps, 'onMount' | 'onChange' | 'beforeMount' | 'defaultValue'>;
export type MonacoEditor = Parameters<OnMount>[0];
export type OnChangeArgs = Parameters<OnChange>;
export type Monaco = Parameters<BeforeMount>;

export function YAMLEditor({ onMount, onChange, beforeMount, defaultValue }: YAMLEditorProps): JSX.Element {
  return (
      <Editor
      height="50vh"
      defaultLanguage="yml"
      defaultValue={defaultValue}
      onMount={onMount}
      onChange={onChange}
      beforeMount={beforeMount}
    />
  );
}