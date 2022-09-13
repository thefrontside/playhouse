import { object, record, string, array, boolean, number, infer as inferZ } from 'zod';

const Resource = object({
  cpu: number(),
  memory: string()
});

const IngressRule = object({
  port: number(),
  type: string()
});

export const Module = object({
  externals: record(object({
    type: string()
  })).optional(),
  profile: string(),
  spec: object({
    containers: record(object({
      id: string(),
      image: string(),
      resources: object({
        limits: Resource.optional(),
        requests: Resource.optional(),
      }).optional(),
      variables: record(string()).optional(),
      volume_mounts: object({}),
      files: object({})
    })).optional(),
    ingress: object({
      rules: record(object({
        http: record(IngressRule).optional()
      }))
    }).optional()
  })
});

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

export const SetupFileSchema = array(SetupDocument);

