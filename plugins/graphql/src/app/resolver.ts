import type { ResolverContext } from "./types";

// TODO This is default resolver, but for types with `@resolve` directive, it should be replaced with the one from the directive.
export async function resolveType({ id }: { id: string }, { loader }: ResolverContext): Promise<string | null> {
  const entity = await loader.load(id);
  if (!entity) return null;
  return entity.kind
}
