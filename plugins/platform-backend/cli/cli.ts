import { parse } from "./deps.ts";

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

export async function cli(options: CLIOptions) {
  let { apiURL, description, args, name, target } = options;
  let flags = parse(args);
  let [command] = flags._;

  switch (command) {
    case "help":
      console.log(usage(name, description))
      break;
    default:
      console.log(`${name}\n${Array(name.length).fill("=").join('')}\narchitecture: ${target}\nbackstage: ${apiURL}`)
      break;
  }
}
