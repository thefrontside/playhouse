import { stringifyEntityRef } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import {
  scaffolderApiRef,
  useCustomFieldExtensions,
  useCustomLayouts,
  useTemplateSecrets,
} from '@backstage/plugin-scaffolder-react';
import {
  EmbeddableWorkflow,
  ScaffolderTaskOutput,
  type NextFieldExtensionOptions,
  type WorkflowProps,
} from '@backstage/plugin-scaffolder-react/alpha';
import { NextScaffolderPage } from '@backstage/plugin-scaffolder/alpha';
import { JsonValue } from '@backstage/types';
import { Button, withStyles } from '@material-ui/core';
import '@reach/dialog/styles.css';
import type { ComponentType, ReactNode } from 'react';
import React, { useCallback } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

type FrontPageType = ComponentType<{
  goToForm: () => void;
}>;

export type EmbeddedScaffolderWorkflowProps = Omit<
  WorkflowProps,
  'onCreate' | 'extensions' | 'layouts'
> & {
  onError(error: Error | undefined): JSX.Element | null;
  frontPage?: FrontPageType;
  finishPage?: ComponentType<{
    output?: ScaffolderTaskOutput;
  }>;
  onCreate?: (values: Record<string, JsonValue>) => Promise<void>;
  children?: ReactNode;
};

type OnCompleteArgs = Parameters<WorkflowProps['onCreate']>[0];

const DefaultFrontPage: FrontPageType = ({ goToForm }) => {
  return <Button onClick={goToForm}>Setup</Button>;
};

const TASK_REGEX =
  /tasks\/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;

/**
 * Allows the EmbeddableWorkflow to be called from outside of a normal scaffolder workflow
 */
export function EmbeddedScaffolderWorkflow({
  frontPage: FrontPage = DefaultFrontPage,
  finishPage,
  onCreate = async (_values: OnCompleteArgs) => void 0,
  onError,
  children = <></>,
  ...props
}: EmbeddedScaffolderWorkflowProps): JSX.Element {
  const { secrets } = useTemplateSecrets();
  const scaffolderApi = useApi(scaffolderApiRef);
  const navigate = useNavigate();
  const location = useLocation();
  const isTaskPage = TASK_REGEX.test(location.pathname);

  const customFieldExtensions =
    useCustomFieldExtensions<NextFieldExtensionOptions>(children);

  const GlobalCss = withStyles({
    '@global': {
      'main main header': {
        // display: "none !important"
      },
    },
  })(() => null);

  const customLayouts = useCustomLayouts(children);

  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: props.namespace,
    name: props.templateName,
  });

  const onWorkFlowCreate = useCallback(
    async (values: OnCompleteArgs) => {
      const { taskId: _taskId } = await scaffolderApi.scaffold({
        templateRef,
        values,
        secrets,
      });

      setTimeout(() => {
        navigate(`tasks/${_taskId}`);

        onCreate({ ...values, taskId: _taskId });
      });
    },
    [navigate, onCreate, scaffolderApi, secrets, templateRef],
  );

  const goToForm = useCallback(() => navigate('form'), [navigate])

  return (
    <>
      <Routes>
        <Route index element={<FrontPage goToForm={goToForm}/>} />
        <Route
          path="form"
          element={
            <EmbeddableWorkflow
              onCreate={onWorkFlowCreate}
              onError={onError}
              extensions={customFieldExtensions}
              layouts={customLayouts}
              {...props}
            />
          }
        />
      </Routes>
      {isTaskPage && (
        <>
          <GlobalCss />
          <NextScaffolderPage
            {...props}
            components={{
              TemplateOutputsComponent: finishPage,
            }}
          />
        </>
      )}
    </>
  );
}
