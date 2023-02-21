import {
  MockAnalyticsApi,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';
import { act, fireEvent } from '@testing-library/react';
import React from 'react';
import { EmbeddedScaffolderWorkflow } from './EmbeddedScaffolderWorkflow';
import {
  createScaffolderFieldExtension,
  scaffolderApiRef,
  ScaffolderFieldExtensions,
  SecretsContextProvider,
  type ScaffolderApi,
} from '@backstage/plugin-scaffolder-react';
import { analyticsApiRef } from '@backstage/core-plugin-api';
import { nextRouteRef, rootRouteRef, scaffolderPlugin } from '@backstage/plugin-scaffolder/alpha';

const scaffolderApiMock: jest.Mocked<ScaffolderApi> = {
  scaffold: jest.fn(),
  getTemplateParameterSchema: jest.fn(),
  getIntegrationsList: jest.fn(),
  getTask: jest.fn(),
  streamLogs: jest.fn(),
  listActions: jest.fn(),
  listTasks: jest.fn(),
};

const analyticsMock = new MockAnalyticsApi();


describe('<EmbeddedScaffolderWorkflow />', () => {
  it('should embed workflow inside another component', async () => {
    const onComplete = jest.fn();
    const onError = jest.fn();
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

    const { getByRole, getByText } = await renderInTestApp(
      <TestApiProvider apis={[
        [scaffolderApiRef, scaffolderApiMock],
        [analyticsApiRef, analyticsMock]
        ]}>
        <SecretsContextProvider>
          <EmbeddedScaffolderWorkflow
            title="Different title than template"
            description={`
        ## This is markdown
        - overriding the template description
            `}
            onCreate={onComplete}
            onError={onError}
            namespace="default"
            templateName="docs-template"
            initialState={{
              name: 'prefilled-name',
            }}
            frontPage={
              <>
                <h1>Front Page to workflow</h1>
                <p>
                  Introduction page text.
                </p>
              </>
            }
            finishPage={
              <>
                <h1>Congratulations, this application is complete!</h1>
              </>
            }
            components={{
              ReviewStateComponent: () => (
                <h1>This is a different wrapper for the review page</h1>
              ),
              reviewButtonText: "Changed Review",
              createButtonText: "Changed Create",
            }
            }
          />
        </SecretsContextProvider>
      </TestApiProvider>,
      {
        mountedRoutes: {
          '/create': nextRouteRef,
          '/create-legacy': rootRouteRef,
        },
      }
    );

    // frontPage is rendered
    expect(getByRole('heading', { level: 1 }).innerHTML).toBe('Front Page to workflow');

    // move to workflow
    await act(async () => {
      fireEvent.click(getByRole('button'));
    });

    // Test template title is overriden
    expect(getByRole('heading', { level: 2 }).innerHTML).toBe(
      'Different title than template',
    );

    expect(getByRole('textbox').innerHTML).toBeDefined();

    const input = getByRole('textbox') as HTMLInputElement;

    // The initial state of the form can be set
    expect(input.value).toBe('prefilled-name');

    const reviewButton = getByRole('button', { name: "Changed Review" }) as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(reviewButton);
    });

    const createButton = getByRole('button', { name: "Changed Create" }) as HTMLButtonElement;

    // Can supply a different Review wrapper
    expect(
      getByText('This is a different wrapper for the review page') as HTMLButtonElement,
    ).toBeDefined();

    await act(async () => {
      fireEvent.click(createButton);
    });

    expect(scaffolderApiMock.scaffold).toHaveBeenCalled()

    // // the final page is inserted after the workflow
    // expect(
    //   getByText('Congratulations, this application is complete!'),
    // ).toBeDefined();

  });

  it('should extract the fieldExtensions and pass them through', async () => {
    scaffolderApiMock.scaffold.mockResolvedValue({ taskId: 'xyz' });

    scaffolderApiMock.getTemplateParameterSchema.mockResolvedValue({
      steps: [
        {
          title: 'Step 1',
          schema: {
            properties: {
              name: {
                type: 'string',
                'ui:field': 'custom'
              },
            },
          },
        },
      ],
      title: 'React JSON Schema Form Test',
    });

    const CustomFieldExtension = scaffolderPlugin.provide(
      createScaffolderFieldExtension({
        name: 'custom',
        component: () => <h5>Custom Extension</h5>,
      }),
    );

    const {getByRole} = await renderInTestApp(
      <TestApiProvider apis={[
        [scaffolderApiRef, scaffolderApiMock],
        [analyticsApiRef, analyticsMock]
        ]}>
        <SecretsContextProvider>
          <EmbeddedScaffolderWorkflow
            onCreate={jest.fn()}
            onError={jest.fn()}
            namespace="default"
            templateName="docs-template"
          >
           <ScaffolderFieldExtensions>
              <CustomFieldExtension />
            </ScaffolderFieldExtensions>
          </EmbeddedScaffolderWorkflow>
        </SecretsContextProvider>
      </TestApiProvider>,
      {
        mountedRoutes: {
          '/create': nextRouteRef,
          '/create-legacy': rootRouteRef,
        },
      }
    );

    expect(getByRole('heading', { level: 5 }).innerHTML).toBe(
      'Custom Extension',
    );
  });
});


