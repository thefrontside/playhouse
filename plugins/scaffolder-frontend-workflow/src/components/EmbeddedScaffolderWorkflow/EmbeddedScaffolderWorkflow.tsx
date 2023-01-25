import React, { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { EmbeddableWorkflow, type WorkflowProps } from '@backstage/plugin-scaffolder-react/alpha';
import { Box, Button } from '@material-ui/core';

export type EmbeddedScaffolderWorkflowProps = WorkflowProps & {
  onError(error: Error | undefined): JSX.Element | null;
  frontPage: ReactNode;
  finishPage: ReactNode;
} & Partial<Pick<WorkflowProps, 'onCreate'>>;

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
  ...props
}: EmbeddedScaffolderWorkflowProps): JSX.Element {
  const [display, setDisplay] = useState<Display>('front');

  const startTemplate = useCallback(() => setDisplay('workflow'), []);

  const onWorkFlowCreacte = useCallback(
    async (values: OnCompleteArgs) => {
      setDisplay('finish');

      await onCreate(values);
    },
    [onCreate],
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
        onCreate={onWorkFlowCreacte}
        onError={onError}
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
