import { stringifyEntityRef } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import {
  scaffolderApiRef,
  useCustomFieldExtensions,
  useCustomLayouts,
  useTemplateSecrets
} from '@backstage/plugin-scaffolder-react';
import {
  EmbeddableWorkflow,
  type NextFieldExtensionOptions,
  type WorkflowProps
} from '@backstage/plugin-scaffolder-react/alpha';
import {
  NextScaffolderPage
} from '@backstage/plugin-scaffolder/alpha';
import { JsonValue } from '@backstage/types';
import { Box, Button, withStyles } from '@material-ui/core';
import '@reach/dialog/styles.css';
import type { ReactNode } from 'react';
import React, { useCallback } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

export type EmbeddedScaffolderWorkflowProps = Omit<
  WorkflowProps,
  'onCreate' | 'extensions' | 'layouts'
> & {
  onError(error: Error | undefined): JSX.Element | null;
  frontPage?: ReactNode;
  finishPage?: ReactNode;
  onCreate?: (values: Record<string, JsonValue>) => Promise<void>;
  children?: ReactNode;
};

type Display = 'front' | 'form' | 'workflow' | 'finish';

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
  const { secrets } = useTemplateSecrets();
  const scaffolderApi = useApi(scaffolderApiRef);
  const navigate = useNavigate();
  const location = useLocation();
  const isTaskPage =
    /tasks\/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(
      location.pathname,
    );

  const customFieldExtensions =
    useCustomFieldExtensions<NextFieldExtensionOptions>(children);

  const GlobalCss = withStyles({
    "@global": {
      "main main header": {
        // display: "none !important"
      }
    }
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

  const DisplayElements: DisplayComponents = {
    front: (
      <Box display="flex" alignItems="center" flexDirection="column">
        {frontPage}
        <Button variant="contained" onClick={() => navigate('form')}>
          SETUP
        </Button>
      </Box>
    ),
    form: (
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
    workflow: <></>,
  };

  return (
    <>
      <Routes>
        <Route index element={DisplayElements.front} />
        <Route path="form" element={DisplayElements.form} />
      </Routes>
      {isTaskPage && <>
        <GlobalCss />
        <NextScaffolderPage FormProps={{ noHtml5Validate: true }} />
      </>
      }
    </>
  );
}
