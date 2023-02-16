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
import { withStyles } from '@material-ui/core';
import type { ComponentType, ReactNode } from 'react';
import React, { useCallback } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

export type EmbeddedScaffolderWorkflowProps = Omit<
  WorkflowProps,
  'onCreate' | 'extensions' | 'layouts'
> & {
  components?: {
    TemplateOutputsComponent?: ComponentType<{
      output?: ScaffolderTaskOutput;
    }>;
  };
  onError(error: Error | undefined): JSX.Element | null;
  onCreate?: (values: Record<string, JsonValue>) => Promise<void>;
  children?: ReactNode;
};

type OnCompleteArgs = Parameters<WorkflowProps['onCreate']>[0];

const TASK_REGEX =
  /tasks\/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;

/**
 * Allows the EmbeddableWorkflow to be called from outside of a normal scaffolder workflow
 */
export function EmbeddedScaffolderWorkflow({
  components,
  onCreate = async (_values: OnCompleteArgs) => void 0,
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

  return (
    <>
      <Routes>
        <Route
          index
          element={
            <EmbeddableWorkflow
              onCreate={onWorkFlowCreate}
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
          <NextScaffolderPage {...props} components={components} />
        </>
      )}
    </>
  );
}
