import type { ResolverContext } from "./types";

export async function resolveType({ id }: { id: string }, { loader }: ResolverContext): Promise<string | null> {
  const entity = await loader.load(id);
  if (!entity) return null;
  return entity.kind
}
