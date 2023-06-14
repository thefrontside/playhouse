import { withTheme, FormProps } from '@rjsf/core-v5';

export const RJSFForm = withTheme(require('@rjsf/material-ui-v5').Theme);

export type RJSFFormProps = Pick<FormProps, 'transformErrors' | 'extraErrors' | 'className' | 'ref'>;