import { object, record, string, number } from 'zod';

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
});