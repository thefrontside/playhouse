import React from 'react';
import { useRunWorkflow } from './useRunWorkflow';
import { TestApiProvider } from '@backstage/test-utils';
import { renderHook, act } from '@testing-library/react-hooks';
import {
  scaffolderApiRef,
  SecretsContextProvider,
} from '@backstage/plugin-scaffolder-react';
import { scaffolderApiMock } from '../test.utils';

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
