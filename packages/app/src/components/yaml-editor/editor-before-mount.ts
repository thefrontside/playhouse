import type { Monaco } from '@monaco-editor/react';

export const LanguageId = 'yaml';

export function handleEditorWillMount(monaco: Monaco) {
  monaco.languages.setLanguageConfiguration(LanguageId, {
    comments: {
      lineComment: '#',
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  
    onEnterRules: [
      {
        beforeText: /:\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
    ],
  });

  monaco.languages.register({
    id: LanguageId,
    extensions: ['.yaml', '.yml'],
    aliases: ['YAML', 'yaml', 'YML', 'yml'],
    mimetypes: ['application/x-yaml'],
  });
}
