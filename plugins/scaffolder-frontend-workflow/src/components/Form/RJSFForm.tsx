import { withTheme, FormProps } from '@rjsf/core';

export const RJSFForm = withTheme(require('@rjsf/material-ui').Theme);

export type RJSFFormProps = Pick<
  FormProps,
  'transformErrors' | 'extraErrors' | 'formContext' | 'className' | 'ref'
>;
