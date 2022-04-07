import { ComponentEntity, Entity } from "@backstage/catalog-model";

export const id = (entity: Entity) => Buffer.from(
  JSON.stringify({
    kind: entity.kind,
    name: entity.metadata.name,
    namespace: entity.metadata.namespace,
  }),
).toString('base64')

export const kind = (entity: Entity) => entity.kind

export const name = (entity: Entity) => entity.metadata.name
export const namespace = (entity: Entity) => entity.metadata.namespace
export const title = (entity: Entity) => entity.metadata.title
export const description = (entity: Entity) => entity.metadata.description
export const tags = (entity: Entity) => entity.metadata.tags
export const links = (entity: Entity) => entity.metadata.links


export const type = (entity: ComponentEntity) => entity.spec.type
export const lifecycle = (entity: ComponentEntity) => entity.spec.lifecycle
// export const owner = (entity: ComponentEntity) => {
//   const ownerName = entity.relations?.find(({ type, target }) => type === 'ownedBy' && target.name === entity.spec.owner)
//   return

// }
