import { object, record, string, number, array, boolean, infer as inferZ } from 'zod';

const Resource = object({
  cpu: number(),
  memory: string()
});

const IngressRule = object({
  port: number(),
  type: string()
})

const Environment = object({
  metadata: object({
    env_id: string(),
    name: string()
  }),
  modules: record(object({
    externals: record(object({
      type: string()
    })).optional(),
    profile: string(),
    spec: object({
      containers: record(object({
        id: string().optional(),
        image: string().optional(),
        resources: object({
          limits: Resource.optional(),
          requests: Resource.optional(),
        }).optional(),
        variables: object({}),
        volume_mounts: object({}),
        files: object({})
      })).optional(),
      ingress: object({
        rules: record(object({
          http: record(IngressRule).optional()
        }))
      }).optional()
    })
  }))
});

export type EnvironmentType = inferZ<typeof Environment>;

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
  environments: record(Environment).optional(),
  automations: record(array(Automation)).optional()
});

export const SetupFileSchema = array(SetupDocument)