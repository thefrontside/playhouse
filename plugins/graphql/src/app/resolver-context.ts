import type { Catalog } from "../app/catalog";
import { Loader } from "./loaders";
import { Resolver } from "./resolver";

export interface ResolverContext {
  loader: Loader
  catalog: Catalog
  resolver: Resolver
}
