import { object, record, string, array, boolean, infer as inferZ } from 'zod';
import { Module } from './module';

const CreateEnvironment = object({
  metadata: object({
    env_id: string(),
    name: string()
  }),
  modules: record(Module)
});

export type CreateEnvironmentType = inferZ<typeof CreateEnvironment>;

const Automation = object({
  images_filter: array(string()),
  type: string(),
  update_to: string(),
  active: boolean().optional(),
  exclude_images_filter: boolean().optional(),
  match: string().optional(),
});

export type AutomationType = inferZ<typeof Automation>;

const SetupDocument = object({
  id: string(),
  name: string(),
  environments: record(CreateEnvironment).optional(),
  automations: record(array(Automation)).optional()
});

export const SetupFileSchema = array(SetupDocument)