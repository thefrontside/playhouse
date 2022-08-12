import type { ResolverContext } from "./types";

export async function resolveType({ id }: { id: string }, { entityLoader }: ResolverContext): Promise<string | null> {
  const entity = await entityLoader.load(id);
  if (!entity) return null;
  return entity.kind
}
