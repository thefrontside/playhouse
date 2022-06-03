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
    env_id: string()
  }),
  modules: record(object({
    externals: record(object({})).optional(),
    profile: string(),
    spec: object({
      containers: record(object({
        id: string(),
        image: string(),
        resources: object({
          limits: Resource.optional(),
          memory: Resource.optional(),
        }).optional()
      })).optional(),
      ingress: object({
        rules: record(object({
          http: record(IngressRule).optional()
        }))
      }).optional()
    })
  }))
});

export type EnvironmentType = inferZ<typeof Environment>

const SetupDocument = object({
  id: string(),
  name: string(),
  environments: record(Environment).optional(),
  automations: record(array(object({
    active: boolean(),
    exclude_images_filter: boolean(),
    images_filter: array(string()),
    match: string(),
    update_to: string()
  }))).optional()
});

export const SetupFileSchema = array(SetupDocument)