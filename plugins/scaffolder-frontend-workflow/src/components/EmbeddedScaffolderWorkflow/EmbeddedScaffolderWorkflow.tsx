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

import React, { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { EmbeddableWorkflow, type WorkflowProps } from '@backstage/plugin-scaffolder-react/alpha';
import { Box, Button } from '@material-ui/core';

/**
 * @alpha
 */
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
 * @alpha
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
