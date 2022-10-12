import { cli } from './cli.ts';

await cli({
  name: 'idp',
  description: 'internal developer platform ',
  apiURL: 'http://localhost:7007/api/idp',
  args: Deno.args,
  target: Deno.build.target,
}).catch((error) => console.error(error));
