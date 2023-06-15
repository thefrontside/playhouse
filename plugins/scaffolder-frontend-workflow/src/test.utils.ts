import { type ScaffolderApi } from '@backstage/plugin-scaffolder-react';

export const scaffolderApiMock: jest.Mocked<ScaffolderApi> = {
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
