import { Command, Entity, path, yaml } from "./deps.ts";

export interface CLIOptions {
  name: string;
  description: string;
  apiURL: string;
  args: string[];
  target: string;
}

class MainError extends Error {
  name = "Mainerror";
}

export async function cli(options: CLIOptions) {
  let { apiURL, description, args, name, target } = options;
  let get = (endpoint: string) => fetch(`${apiURL}/${endpoint}`);

  const cmd = new Command()
    .name(name)
    .version(() => `\narchitecture: ${target}\nbackstage: ${apiURL}`)
    .description(description)
    .command("info", "display info about a backstage component entity.")
    .option(
      "-c --component <component:string>",
      "The backstage component entity",
    )
    .action(async ({ component }) => {
      let ref = await findEntityContext(component);
      let response: Response;
      try {
        response = await get(`components/${ref}/info`);
      } catch (error) {
        throw new MainError(error.message);
      }
      if (!response) {
        throw new MainError(`no response from server`);
      } else if (response.ok) {
        await Deno.stdout.write(
          new TextEncoder().encode(await response.text()),
        );
      } else {
        if (response.status === 404) {
          throw new MainError(`unknown component '${ref}'`);
        } else {
          throw new MainError(
            `communication error with backstage server: ${response.status} ${response.statusText}`,
          );
        }
      }
    })
    .command(
      "environments",
      "list enviroments in which a component is deployed",
    )
    .option("-c --component <component:string>", "the component to query")
    .action(async ({ component }) => {
      let ref = await findEntityContext(component);
      let response: Response;
      try {
        response = await get(`components/${ref}/environments`);
      } catch (error) {
        throw new MainError(error.message);
      }
      if (!response) {
        throw new MainError(`no response from server`);
      } else if (response.ok) {
        await Deno.stdout.write(
          new TextEncoder().encode(await response.text()),
        );
      } else {
        if (response.status === 404) {
          throw new MainError(`unknown component '${ref}'`);
        } else {
          throw new MainError(
            `communication error with backstage server: ${response.status} ${response.statusText}`,
          );
        }
      }
    });

  try {
    await cmd.parse(args);
  } catch (error) {
    if (error instanceof MainError) {
      console.log(error.message);
    } else {
      throw error;
    }
  }
}

async function findEntityContext(component?: string): Promise<string> {
  if (component) {
    return component;
  }
  let catalogInfoYaml = await findAndRead(
    "catalog-info.yml",
    "catalog-info.yaml",
  );
  if (catalogInfoYaml.found) {
    let [info] = yaml.parseAll(catalogInfoYaml.content) as Iterable<Entity>;
    if (info && info.metadata?.name) {
      return info.metadata.name;
    }
  } else {
    throw new MainError(
      "unable to determine the component. You can set it explicitly by passing the `--component` flag",
    );
  }

  return "";
}

type Find = {
  found: false;
} | {
  found: true;
  content: string;
};
async function findAndRead(...paths: string[]): Promise<Find> {
  for (let cwd = Deno.cwd(); cwd !== "/"; cwd = path.join(cwd, "..")) {
    for (let path of paths) {
      try {
        let content = new TextDecoder().decode(
          await Deno.readFile(`${cwd}/${path}`),
        );
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
