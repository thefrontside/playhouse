import { CatalogApi } from "@backstage/catalog-client";
import { Loader } from "./loaders";

export interface ResolverContext {
  loader: Loader
  catalog: CatalogApi
}

export async function resolveType({ id }: { id: string }, { loader }: ResolverContext): Promise<string | null> {
  const entity = await loader.load(id);
  if (!entity) return null;
  return entity.kind
}
