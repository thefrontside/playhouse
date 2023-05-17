/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { JsonValue } from '@backstage/types';
import { makeStyles } from '@material-ui/core';
import { type IChangeEvent } from '@rjsf/core-v5';
import React, { useCallback, useMemo, type ReactNode } from 'react';
import validator from '@rjsf/validator-ajv8';
import { RJSFForm } from './RJSFForm';
import {
  type FormProps,
  type NextFieldExtensionOptions,
  useFormDataFromQuery,
  ParsedTemplateSchema,
} from '@backstage/plugin-scaffolder-react/alpha';

const useStyles = makeStyles(theme => ({
  backButton: {
    marginRight: theme.spacing(1),
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'right',
    marginTop: theme.spacing(2),
  },
  formWrapper: {
    padding: theme.spacing(2),
  },
}));

interface Props {
  extensions: NextFieldExtensionOptions<any, any>[];
  templateName?: string;
  FormProps?: FormProps;
  initialState?: Record<string, JsonValue>;
  onCreate: (values: Record<string, JsonValue>) => Promise<void>;
  step: ParsedTemplateSchema;
  handleNext: ({
    formData,
  }: {
    formData?: Record<string, JsonValue> | undefined;
  }) => Promise<void>;
  children: ReactNode;
}

export const Form = (props: Props) => {
  const [formState, setFormState] = useFormDataFromQuery(props.initialState);

  const styles = useStyles();

  const extensions = useMemo(() => {
    return Object.fromEntries(
      props.extensions.map(({ name, component }) => [name, component]),
    );
  }, [props.extensions]);

  const handleChange = useCallback(
    (e: IChangeEvent) =>
      setFormState(current => ({ ...current, ...e.formData })),
    [setFormState],
  );

  const handleNext = async ({
    formData = {},
  }: {
    formData?: Record<string, JsonValue>;
  }) => {
    props.handleNext(formData);

    setFormState(current => ({ ...current, ...formData }));
  };

  return (
    <>
      <div className={styles.formWrapper}>
        <RJSFForm
          validator={validator}
          formData={formState}
          formContext={{ formData: formState }}
          schema={props.step.schema}
          uiSchema={props.step.uiSchema}
          onSubmit={handleNext}
          fields={{ ...extensions }}
          showErrorList={false}
          onChange={handleChange}
          {...(props.FormProps ?? {})}
        >
          <div className={styles.footer}>{props.children}</div>
        </RJSFForm>
      </div>
    </>
  );
};