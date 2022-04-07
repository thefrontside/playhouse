import type { Catalog } from "../app/catalog";
import { Loader } from "./loaders";

export interface ResolverContext {
  loader: Loader
  catalog: Catalog
}
