import { CatalogApi } from "@backstage/catalog-client";
import { Loader } from "./loaders";

export interface ResolverContext {
  loader: Loader
  catalog: CatalogApi
}
