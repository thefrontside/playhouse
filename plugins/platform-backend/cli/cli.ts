import { path, yaml, Entity, Command, EventSource, red, blue, green, parseDate } from "./deps.ts";

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
  name = 'Mainerror';
}

const logTextColors: Record<SSEMessage['type'], (s: string) => string> = {
  'log': blue,
  'completion': green,
  'error': red
}

function logSSEMessage(raw: string) {
  const message: SSEMessage = JSON.parse(raw)
  const color = logTextColors[message.type];
  const timestamp = message.createdAt;// parseDate(message.createdAt, 'dd.MM.yyyy');
  const logType = color(`[${message.type} - ${timestamp}]`);

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

export async function cli(options: CLIOptions) {
  let { apiURL, description, args, name, target } = options;
  let get = (endpoint: string) => fetch(`${apiURL}/${endpoint}`);

  const cmd = new Command()
    .name(name)
    .version(() => `${name}\n${Array(name.length).fill("=").join('')}\narchitecture: ${target}\nbackstage: ${apiURL}`)
    .description(description)
    .command('info', 'display info about a backstage component entity.')
    .option('-c --component <component:string>', 'The backstage component entity')
    .action(async ({ component }) => {
      let ref = await findEntityContext(component);
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
          repoUrl: 'github.com?owner=dagda1&repo=dd',
          componentName: 'AAAA',
        })
      });

      if (response.status !== 200) {
        throw new MainError(`create failed with ${response.status} - ${response.statusText}`)
      }

      const { taskId } = await response.json();

      const eventStreamUrl = `${apiURL}/tasks/${taskId}/eventstream`;

      const eventSource = new EventSource(eventStreamUrl, { withCredentials: true });

      eventSource.addEventListener('log', sseMessageHandler.bind(null));

      eventSource.addEventListener('completion', sseMessageHandler.bind(null));

      eventSource.addEventListener('error', sseMessageHandler.bind(null));
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
  let catalogInfoYaml = await findAndRead("catalog-info.yml", "catalog-info.yaml");
  if (catalogInfoYaml.found) {
    let [info] = yaml.parseAll(catalogInfoYaml.content) as Iterable<Entity>;
    if (info && info.metadata?.name) {
      return info.metadata.name;
    }
  } else {
    throw new MainError('unable to determine the component. You can set it explicitly by passing the `--component` flag');
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
