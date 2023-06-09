import React from 'react';
import { FormControl, FormLabel, Input, makeStyles } from '@material-ui/core';
import { FieldValidation } from '@rjsf/utils';
import {
  NextFieldExtensionOptions,
  NextFieldExtensionComponentProps,
} from '@backstage/plugin-scaffolder-react/alpha';
import { MarkdownContent } from '@backstage/core-components';

const useStyles = makeStyles(theme => ({
  markdownDescription: {
    fontSize: theme.typography.caption.fontSize,
    margin: 0,
    color: theme.palette.text.secondary,
    '& :first-child': {
      margin: 0,
      marginTop: '3px', // to keep the standard browser padding
    },
  },
}));

const CharacterField = (
  props: NextFieldExtensionComponentProps<string, any>,
) => {
  const {
    displayLabel = true,
    rawErrors = [],
    errors,
    help,
    schema,
    required,
    disabled,
  } = props;
  const classes = useStyles();

  return (
    <FormControl
      fullWidth
      error={rawErrors.length ? true : false}
      required={required}
      disabled={disabled}
    >
      {schema?.title ? <FormLabel>{schema.title}</FormLabel> : null}
      <Input
        aria-label="character-text"
        type="text"
        onChange={e => props.onChange(e.target?.value)}
      />
      {displayLabel && schema?.description ? (
        <MarkdownContent
          content={schema.description}
          className={classes.markdownDescription}
        />
      ) : null}
      {errors}
      {help}
    </FormControl>
  );
};

export const validateAsync = async (
  character: string,
  validation: FieldValidation,
) => {
  try {
    const response = await fetch('https://swapi.dev/api/people');
    const { results } = (await response.json()) as unknown as {
      results: { name: string }[];
    };

    const characterMatch = results.find(r =>
      r.name.toLowerCase().includes(character.toLowerCase()),
    );
    if (!characterMatch) validation.addError('Did not find this character.');
  } catch (e: any) {
    validation.addError(e.message);
    throw Error;
  }
};

export const characterTextField: NextFieldExtensionOptions<string, any> = {
  name: 'CharacterText',
  component: CharacterField,
  validation: validateAsync,
};
