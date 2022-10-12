import { parse, path, yaml, Entity } from "./deps.ts";

const usage = (name: string, description: string) => `
${name}: ${description}

USAGE:
${name} COMMAND [OPTIONS]
`;

export interface CLIOptions {
  name: string;
  description: string;
  apiURL: string;
  args: string[];
  target: string;
}

class MainError extends Error {
  name = 'Mainerror';
}

export async function cli(options: CLIOptions) {
  let { apiURL, description, args, name, target } = options;
  let get = (endpoint: string) => fetch(`${apiURL}/${endpoint}`);
  let flags = parse(args);
  let [command] = flags._;

  try {
    switch (command) {
      case "info": {
        let ref = await findEntityContext(flags);
        let response = await get(`components/${ref}/info`);
        if (response.ok) {
          await Deno.stdout.write(new TextEncoder().encode(await response.text()));
        } else {
          if (response.status === 404) {
            throw new MainError(`unknown component '${ref}'`);
          } else {
            throw new MainError(`communication error with backstage server: ${response.status} ${response.statusText}`);
          }
        }
        break;
      }
      case "version":
        console.log(`${name}\n${Array(name.length).fill("=").join('')}\narchitecture: ${target}\nbackstage: ${apiURL}`);
        break;
      case "help":
      default:
        console.log(usage(name, description))
        break;
    }
  } catch (error) {
    if (error instanceof MainError) {
      console.log(error.message);
    } else {
      throw error;
    }
  }
}

async function findEntityContext(flags: ReturnType<typeof parse>): Promise<string> {
  if (flags.component) {
    return flags.component;
  } else {
    let catalogInfoYaml = await findAndRead("catalog-info.yml", "catalog-info.yaml");
    if (catalogInfoYaml.found) {
      let [info] = yaml.parseAll(catalogInfoYaml.content) as Iterable<Entity>;
      if (info && info.metadata?.name) {
        return info.metadata.name;
      }
    } else {
      throw new MainError('unable to determine the component. You can set it explicitly by passing the `--component` flag');
    }
  }
  return '';
}

type Find = {
  found: false,
} | {
  found: true,
  content: string;
}
async function findAndRead(...paths: string[]): Promise<Find> {
  for (let cwd = Deno.cwd(); cwd !== '/'; cwd = path.join(cwd, '..')) {
    for (let path of paths) {
      try {
        let content = new TextDecoder().decode(await Deno.readFile(`${cwd}/${path}`));
        return { found: true, content };
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }
      }
    }
  }
  return { found: false };
}
