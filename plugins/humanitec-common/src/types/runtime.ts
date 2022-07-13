import { object, record, string, number, array, unknown } from 'zod';

export const Pod = object({
  containerStatuses: array(record(unknown())),
  phase: string(),
  podName: string(),
  revision: number(),
  status: string(),
});

export const ControllerResponse = object({
  kind: string(),
  replicas: number(),
  status: string(),
  pods: array(Pod)
})

export const RuntimeResponsePayload = object({
  modules: record(record(ControllerResponse)),
  namespace: string()
});

