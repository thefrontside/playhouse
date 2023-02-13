import React, { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { EmbeddableWorkflow, type NextFieldExtensionOptions, type WorkflowProps } from '@backstage/plugin-scaffolder-react/alpha';
import { Box, Button } from '@material-ui/core';
import {
  scaffolderApiRef,
  useCustomFieldExtensions,
  useCustomLayouts,
  useTemplateSecrets,
} from '@backstage/plugin-scaffolder-react';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { useNavigate } from 'react-router-dom';
import { nextScaffolderTaskRouteRef } from '@backstage/plugin-scaffolder/alpha';
import { JsonValue } from '@backstage/types';

export type EmbeddedScaffolderWorkflowProps = Omit<WorkflowProps, 'onCreate' | 'extensions' | 'layouts'> & {
  onError(error: Error | undefined): JSX.Element | null;
  frontPage?: ReactNode;
  finishPage?: ReactNode;
  onCreate?: (values: Record<string, JsonValue>) => Promise<void>;
  children?: ReactNode;
};

type Display = 'front' | 'workflow' | 'finish';

type DisplayComponents = Record<Display, JSX.Element>;

type OnCompleteArgs = Parameters<WorkflowProps['onCreate']>[0];

/**
 * Allows the EmbeddableWorkflow to be called from outside of a normal scaffolder workflow
 */
export function EmbeddedScaffolderWorkflow({
  frontPage,
  finishPage,
  onCreate = async (_values: OnCompleteArgs) => void 0,
  onError,
  children = <></>,
  ...props
}: EmbeddedScaffolderWorkflowProps): JSX.Element {
  const [display, setDisplay] = useState<Display>(frontPage ? 'front' : 'workflow');
  const { secrets } = useTemplateSecrets();
  const scaffolderApi = useApi(scaffolderApiRef);
  const taskRoute = useRouteRef(nextScaffolderTaskRouteRef);

  const navigate = useNavigate();
  const customFieldExtensions =
    useCustomFieldExtensions<NextFieldExtensionOptions>(children);

  const customLayouts = useCustomLayouts(children);

  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: props.namespace,
    name: props.templateName,
  });

  const startTemplate = useCallback(() => setDisplay('workflow'), []);

  const onWorkFlowCreate = useCallback(
    async (values: OnCompleteArgs) => {
      setDisplay('finish');

      const { taskId } = await scaffolderApi.scaffold({
        templateRef,
        values,
        secrets,
      });

      navigate(taskRoute({ taskId }));

      await onCreate({ ...values, taskId });
    },
    [navigate, onCreate, scaffolderApi, secrets, taskRoute, templateRef],
  );

  const DisplayElements: DisplayComponents = {
    front: (
      <Box display="flex" alignItems="center" flexDirection="column">
        {frontPage}
        <Button variant="contained" onClick={startTemplate}>
          SETUP
        </Button>
      </Box>
    ),
    workflow: (
      <EmbeddableWorkflow
        onCreate={onWorkFlowCreate}
        onError={onError}
        extensions={customFieldExtensions}
        layouts={customLayouts}
        {...props}
      />
    ),
    finish: (
      <Box display="flex" alignItems="center" flexDirection="column">
        {finishPage}
      </Box>
    ),
  };

  return <>{DisplayElements[display]}</>;
}
