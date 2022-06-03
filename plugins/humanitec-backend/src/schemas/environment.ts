import { array, object, string, infer as inferZ } from 'zod';
import { Deployment } from './deployment';

export const Environment = object({
  created_at: string().optional(),
  created_by: string().optional(),
  from_deploy: Deployment.optional(),
  id: string(),
  last_deploy: Deployment.optional(),
  name: string(),
  namespace: string().optional(),
  type: string()
});

export const EnvironmentsPayload = array(Environment);

export type EnvironmentsPayloadType = inferZ<typeof EnvironmentsPayload>;