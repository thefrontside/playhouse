import { assert } from "./deps.ts";
import { cli } from "./cli.ts";

let [name, apiURL, description, ...args] = Deno.args;

assert(name, "compiled incorrectly -  executable name is not defined");
assert(apiURL, "compiled incorrectly -  backstage platform url is not found");
assert(description, "compiled incorrectly -  no platform description defined");

await cli({
  name,
  description,
  apiURL,
  args,
  target: Deno.build.target,
}).catch((error) => console.error(error));
