import {
  MockAnalyticsApi,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';
import { act, fireEvent, RenderResult } from '@testing-library/react';
import React from 'react';
import {
  scaffolderApiRef,
  SecretsContextProvider,
} from '@backstage/plugin-scaffolder-react';
import { analyticsApiRef } from '@backstage/core-plugin-api';
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { ScaffolderWorkflow } from '../../test.components';
import { scaffolderApiMock } from '../../test.utils';

const analyticsMock = new MockAnalyticsApi();

describe('<Workflow />', () => {
  let rendered: RenderResult;
  beforeEach(async () => {
    scaffolderApiMock.scaffold.mockResolvedValue({ taskId: 'xyz' });

    scaffolderApiMock.getTemplateParameterSchema.mockResolvedValue({
      steps: [
        {
          title: 'Step 1',
          schema: {
            properties: {
              name: {
                type: 'string',
              },
            },
          },
        },
      ],
      title: 'React JSON Schema Form Test',
    });

    rendered = await renderInTestApp(
      <TestApiProvider
        apis={[
          [scaffolderApiRef, scaffolderApiMock],
          [analyticsApiRef, analyticsMock],
        ]}
      >
        <SecretsContextProvider>
          <ScaffolderWorkflow
            templateName="docs-template"
            namespace="default"
          />
        </SecretsContextProvider>
      </TestApiProvider>,
      {
        mountedRoutes: {
          '/create': scaffolderPlugin.routes.root,
          '/create-legacy': scaffolderPlugin.routes.root,
        },
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('advances through form and submits', async () => {
    const { getByRole, getByText } = rendered;
    expect(getByRole('textbox').innerHTML).toBeDefined();

    // const input = getByRole('textbox') as HTMLInputElement;

    // // The initial state of the form can be set
    // expect(input.value).toBe('prefilled-name');

    expect(getByText('Step 1')).toBeDefined();

    const reviewButton = getByRole('button', {
      name: 'Review',
    }) as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(reviewButton);
    });

    expect(getByText('Review Page') as HTMLButtonElement).toBeDefined();

    const createButton = getByRole('button', {
      name: 'Create',
    }) as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(createButton);
    });

    expect(scaffolderApiMock.scaffold).toHaveBeenCalled();
  });

  it('goes back from review state and has form data', async () => {
    const { getByRole, getByText } = rendered;
    expect(getByRole('textbox').innerHTML).toBeDefined();

    const input = getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'boop' } });

    // // The initial state of the form can be set
    // expect(input.value).toBe('prefilled-name');

    expect(getByText('Step 1')).toBeDefined();

    const reviewButton = getByRole('button', {
      name: 'Review',
    }) as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(reviewButton);
    });

    expect(getByText('Review Page') as HTMLButtonElement).toBeDefined();

    const backButton = getByRole('button', {
      name: 'Back',
    }) as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(backButton);
    });

    expect(scaffolderApiMock.scaffold).not.toHaveBeenCalled();

    const inputSame = getByRole('textbox') as HTMLInputElement;
    expect(inputSame.value).toBe('boop');
  });
});
