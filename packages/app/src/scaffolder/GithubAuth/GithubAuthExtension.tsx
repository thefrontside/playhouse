/* eslint-disable import/no-extraneous-dependencies */
import React, { useMemo } from 'react';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import { FieldExtensionComponentProps } from '@backstage/plugin-scaffolder-react';

import { useAuth, RequestUserCredentials } from 'scaffolder-frontend-auth';

export const GithubAuth = (props: FieldExtensionComponentProps<string>) => {
  const { uiSchema, onChange, rawErrors } = props;
  const uiOptions = useMemo(() => uiSchema?.['ui:options'] ?? {}, [uiSchema]);

  const requestUserCredentials =
    uiOptions?.requestUserCredentials &&
    typeof uiOptions?.requestUserCredentials === 'object'
      ? (uiOptions?.requestUserCredentials as RequestUserCredentials)
      : undefined;

  const token = useAuth({
    url: 'https://github.com',
    requestUserCredentials,
  });

  return (
    <FormControl margin="normal" required error={rawErrors?.length > 0}>
      <InputLabel htmlFor="ownerWithRepo">owner/repo</InputLabel>
      <Input
        id="ownerWithRepo"
        aria-describedby="ownerRepoField"
        onChange={e => onChange(e.target?.value)}
      />
      <FormHelperText id="ownerRepoField">
        {`The owner/repo combination to read metadata, e.g. thefrontside/playhouse${
          token ? `, using the token ending with ${token?.slice(-5)}` : ''
        }`}
      </FormHelperText>
    </FormControl>
  );
};

export const validateOwnerRepoCombination = (
  value: string,
  validation: { addError: (arg0: string) => void },
) => {
  const parts = value?.split('/');

  if (parts?.length !== 2) {
    validation.addError(`Needs an owner/project format.`);
  }
};
