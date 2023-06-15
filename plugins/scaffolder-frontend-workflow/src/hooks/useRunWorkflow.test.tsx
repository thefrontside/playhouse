import React from 'react';
import { useRunWorkflow } from './useRunWorkflow';
import { TestApiProvider } from '@backstage/test-utils';
import { renderHook, act } from '@testing-library/react-hooks';
import {
  scaffolderApiRef,
  SecretsContextProvider,
  type ScaffolderApi,
} from '@backstage/plugin-scaffolder-react';

const scaffolderApiMock: jest.Mocked<ScaffolderApi> = {
  scaffold: jest
    .fn()
    .mockImplementationOnce(() => Promise.resolve({ taskId: 'boop' })),
  getTemplateParameterSchema: jest.fn(),
  getIntegrationsList: jest.fn(),
  getTask: jest.fn().mockImplementationOnce(() =>
    Promise.resolve({
      id: 'blam',
      spec: { steps: [] },
      status: 'processing',
      lastHeartbeatAt: '',
      createdAt: '',
    }),
  ),
  streamLogs: jest.fn().mockImplementationOnce(() => ({
    subscribe: () => {},
    next: () => ({
      type: 'log',
      body: {},
      createdAt: '',
      id: 'blam',
      taskId: 'boop',
    }),
  })),
  listActions: jest.fn(),
  listTasks: jest.fn(),
  cancelTask: jest.fn(),
};

describe('useRunWorkflow', () => {
  it('should reset', async () => {
    const { result } = renderHook(
      () => ({
        hook: useRunWorkflow({ templateRef: 'test' }),
      }),
      {
        wrapper: ({ children }) => (
          <TestApiProvider apis={[[scaffolderApiRef, scaffolderApiMock]]}>
            <SecretsContextProvider>{children}</SecretsContextProvider>
          </TestApiProvider>
        ),
      },
    );
    expect(result.current.hook?.taskId).toEqual(undefined);
    expect(result.current.hook?.taskStatus).toEqual('idle');

    await act(() => result.current.hook.execute({ foo: 'bar' }));

    expect(result.current.hook?.taskId).toEqual('boop');
    expect(result.current.hook?.taskStatus).toEqual('pending');

    act(() => result.current.hook.reset());

    expect(result.current.hook?.taskId).toEqual(undefined);
    expect(result.current.hook?.taskStatus).toEqual('idle');
  });
});
