import { path, yaml, Entity, Command, EventSource, red, blue, green, format } from "./deps.ts";

export interface CLIOptions {
  name: string;
  description: string;
  apiURL: string;
  args: string[];
  target: string;
}

interface SSEMessage {
  type: 'log' | 'completion' | 'error';
  createdAt: string;
  body: {
    message: string;
    error?: {
      name: string;
      message: string;
    }
  };
}

class MainError extends Error {
  name = "Mainerror";
}

const logTextColors: Record<SSEMessage['type'], (s: string) => string> = {
  'log': blue,
  'completion': green,
  'error': red
}

function logSSEMessage(raw: string) {
  const message: SSEMessage = JSON.parse(raw)
  const color = logTextColors[message.type];
  const timestamp = format(new Date(message.createdAt), 'dd-MM-yyyy:hh:mm');
  const logType = color(`[${message.type.toLocaleUpperCase()} - ${timestamp}]`);

  console.log(`${logType} - ${message.body.message})`);

  if (message.body.error) {
    logSSEMessage(JSON.stringify({
      type: "error",
      body: {
        message: message.body.error.message
      },
      createdAt: message.createdAt
    }))
  }
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
    })
    .command('scaffold', 'scaffold something new')
    .option('-t --template <template:string>', 'the scaffolder template', {
      default: 'standard-microservice'
    })
    .action(async ({ template }) => {
      const response = await fetch(`${apiURL}/create/${template}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl: 'github.com?owner=dagda1&repo=yy',
          componentName: 'yyy',
        })
      });

      if (response.status !== 200) {
        throw new MainError(`create failed with ${response.status} - ${response.statusText}`)
      }

      // deno-lint-ignore no-explicit-any
      function sseMessageHandler(event: any) {
        if (event.data) {
          try {
            logSSEMessage(event.data);
          } catch (ex) {
            console.error(ex);
          }
        }
      }

      const { taskId } = await response.json();

      const eventSourceUrl = `${apiURL}/tasks/${taskId}/eventstream`;

      const eventSource = new EventSource(eventSourceUrl, { withCredentials: true });

      eventSource.addEventListener('log', sseMessageHandler);
      eventSource.addEventListener('completion', (event: any) => {
        sseMessageHandler(event);
        
        try {
          eventSource.close();
        } catch (err) {
          console.dir(err);

          throw err;
        }
      });
      eventSource.addEventListener('error', sseMessageHandler);
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
