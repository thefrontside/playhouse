import React, { useCallback, useMemo, useState } from 'react';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import { FieldExtensionComponentProps } from '@backstage/plugin-scaffolder-react';
// eslint-disable-next-line import/no-extraneous-dependencies
import Autocomplete from '@material-ui/lab/Autocomplete';
// eslint-disable-next-line import/no-extraneous-dependencies
import { TextField } from '@material-ui/core';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  useFetchWithAuth,
  RequestUserCredentials,
} from 'scaffolder-frontend-auth';

export const GithubQuery = (props: FieldExtensionComponentProps<string>) => {
  const { uiSchema, onChange, rawErrors, formData, required } = props;
  const [ownerInput, setOwnerInput] = useState<string>('thefrontside');
  const [owner, setOwner] = useState<string>('thefrontside');
  const uiOptions = useMemo(() => uiSchema?.['ui:options'] ?? {}, [uiSchema]);

  const requestUserCredentials =
    uiOptions?.requestUserCredentials &&
    typeof uiOptions?.requestUserCredentials === 'object'
      ? (uiOptions?.requestUserCredentials as RequestUserCredentials)
      : undefined;

  const { value, loading, error } = useFetchWithAuth({
    url: 'https://github.com',
    requestUserCredentials,
    fetchOpts: {
      url: `https://api.github.com/orgs/${owner}/repos`,
      options: {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer ',
          // this isn't allowed so *shrugs*
          // per_page: '100',
        },
      },
      headersRequiringToken: ['Authorization'],
    },
  });

  const onSelect = useCallback(
    (_: any, selectValue: string | null) => {
      onChange(selectValue ?? undefined);
    },
    [onChange],
  );

  return (
    <>
      <FormControl margin="normal" required error={rawErrors?.length > 0}>
        <InputLabel htmlFor="owner">organization</InputLabel>
        <Input
          id="owner"
          aria-describedby="ownerField"
          value={ownerInput}
          onChange={e => setOwnerInput(e.target?.value)}
          onBlur={() => setOwner(ownerInput)}
        />
        <FormHelperText id="ownerField">
          The owner to query a list of repositories
        </FormHelperText>
      </FormControl>
      <FormControl margin="normal" error={rawErrors?.length > 0 && !formData}>
        <Autocomplete
          value={(formData as string) || ''}
          loading={loading}
          onChange={onSelect}
          options={value?.map((repo: { name: string }) => repo.name) ?? []}
          autoSelect
          renderInput={params => (
            <TextField
              {...params}
              margin="dense"
              FormHelperTextProps={{
                margin: 'dense',
                style: { marginLeft: 0 },
              }}
              variant="outlined"
              required={required}
              InputProps={params.InputProps}
            />
          )}
        />
      </FormControl>
    </>
  );
};
