import { World } from '@frontside/graphgen-backstage';
import { z } from 'zod';

export type Entities = keyof World;

const componentSchema = z.object({
  kind: z.literal("Component"),
  metadata: z.object({
    name: z.string(),
    description: z.string(),
    tags: z.optional(z.array(z.string())),
    links: z.optional(z.array(z.object({
      title: z.string(),
      url: z.string()
    })))
  }),
  spec: z.object({
    type: z.string(),
    lifecycle: z.string(),
    owner: z.string(),
    providesApis: z.optional(z.string().array()),
    consumesApis: z.optional(z.string().array()),
    subcomponentOf: z.optional(z.string()),
    dependsOn: z.optional(z.array(z.string())),
    system: z.optional(z.string())
  })
}).transform(entity => {
  const { metadata, spec: { consumesApis, providesApis, ...rest } } = entity;

  const node = {
    __typename: entity.kind,
    ...metadata,
    consumes: consumesApis,
    provides: providesApis,
    ...rest
  };

  return node;
});

const systemSchema = z.object({
  kind: z.literal("System"),
  metadata: z.object({
    name: z.string(),
    description: z.string()
  })
}).transform(entity => {
  return {
    __typename: entity.kind,
    ...entity.metadata
  }
});

const apiSchema = z.object({
  kind: z.literal("API"),
  metadata: z.object({
    name: z.string(),
    description: z.string(),
  }),
  spec: z.object({
    type: z.string(),
    lifecycle: z.string(),
    owner: z.string(),
    providesApis: z.optional(z.string().array()),
    consumesApis: z.optional(z.string().array()),
    subcomponentOf: z.optional(z.string())
  })
}).transform(entity => ({
  __typename: entity.kind,
  ...entity.metadata,
  consumes: entity.spec.consumesApis,
  provides: entity.spec.providesApis
}));

const groupSchema = z.object({
  kind: z.literal("Group"),
  metadata: z.object({
    name: z.string(),
    description: z.string()
  })
}).transform(o => {
  return {
    __typename: o.kind,
    ...o.metadata
  }
});

const resourceSchema = z.object({
  kind: z.literal("Resource"),
  metadata: z.object({
    name: z.string(),
    description: z.string()
  })
}).transform(entity => {
  return {
    __typename: entity.kind,
    ...entity.metadata
  }
});

const userSchema = z.object({
  kind: z.literal("User"),
  metadata: z.object({
    name: z.string(),
  })
}).transform(entity => {
  return {
    __typename: entity.kind,
    ...entity.metadata
  }
});

const domainSchmea = z.object({
  kind: z.literal("Domain"),
  metadata: z.object({
    name: z.string(),
    decription: z.optional(z.string()),
    tags: z.optional(z.array(z.string())),
    links: z.optional(z.array(z.object({
      title: z.string(),
      url: z.string()
    })))
  }),
  spec: z.object({
    owner: z.string()
  })
}).transform(entity => ({
  __typename: entity.kind,
  ...entity.metadata,
  ...entity.spec
}));


// I would have used zod's z.discriminatedUnion but there is a bug with discriminatedUnion and transform
// there is an open PR about this https://github.com/colinhacks/zod/pull/1290 or I would have done this
/* 
export const entitySchema = z
  .discriminatedUnion("kind", [
    z.object({
      kind: z.literal("Component")
      etc.
    }),
    z.object({
      kind: z.literal("System")
*/
// until then exporting a Record<kind, schema>
export const entities: Record<Entities, typeof componentSchema | typeof systemSchema | typeof apiSchema | typeof groupSchema | typeof resourceSchema | typeof userSchema | typeof domainSchmea> = {
  Component: componentSchema,
  System: systemSchema,
  API: apiSchema,
  Group: groupSchema,
  Resource: resourceSchema,
  User: userSchema,
  Domain: domainSchmea
};