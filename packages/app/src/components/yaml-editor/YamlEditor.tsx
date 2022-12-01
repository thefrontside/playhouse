import React from 'react';
import Editor from "@monaco-editor/react";
import type { EditorProps, OnMount, BeforeMount, OnChange } from "@monaco-editor/react";
import { handleEditorWillMount, LanguageId } from './editor-before-mount';

export type YAMLEditorProps = Pick<EditorProps, 'onMount' | 'onChange' | 'beforeMount' | 'defaultValue' | 'value'>;
export type MonacoEditor = Parameters<OnMount>[0];
export type OnChangeArgs = Parameters<OnChange>;
export type Monaco = Parameters<BeforeMount>[0];

export function YAMLEditor({ onMount, onChange, defaultValue, value }: YAMLEditorProps): JSX.Element {
  return (
    <Editor
      height="50vh"
      defaultLanguage={LanguageId}
      defaultValue={defaultValue}
      onMount={onMount}
      onChange={onChange}
      beforeMount={handleEditorWillMount}
      value={value}
    />
  );
}