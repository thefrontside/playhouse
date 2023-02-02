import fs from 'fs/promises';
import path from 'path';
import { findPaths } from '@backstage/cli-common';
import { Command } from 'commander';
import { loadConfig, loadConfigSchema } from '@backstage/config-loader';
import { getPackages } from '@manypkg/get-packages';
import { ConfigReader } from '@backstage/config';

/*
 * This function is a small CLI using packages relied upon within backstage.
 * It injects the config into the frontend. It is valuable for when it is
 *  deployed separately from the backend (removal of `app-backend`).
 * The `app-backend` may also pass `disableConfigInjection: true` for use
 *  in read only containers which files cannot be created in the container
 *  to allow the runtime config injection.
 *
 * This script needs to be run _after_ the frontend build, but _before_ backend build.
 * The backend build copies the frontend dist and bundles it in the tar zip.
 * In this repo, we modified the frontend package.json build script to call the injection script.
 * This means that the root `yarn build` process skips the frontend build as it has
 *  a different build script. A separate step is included in the CI workflow to build the frontend first.
 * Note that the config variables and env vars for use in the frontend need to be available when
 *  the frontend is built.
 *
 * Use with
 * ```
 * node ../../.scripts/inject-config.mjs --config ../../app-config.yaml --config ../../app-config.production.yaml
 * ```
 *
 * or by updating the frontend package.json scripts with
 * ```
 * - "build":  "backstage-cli package build",
 * + "build": "yarn backstage-build && yarn inject-config",
 * + "backstage-build": "backstage-cli package build",
 * + "inject-config": "node ../../.scripts/inject-config.mjs --config ../../app-config.yaml --config ../../app-config.production.yaml",
 * ```
 */
async function inject() {
  const config = await readConfig(process.argv);
  await injectConfig({
    staticDir: './dist/static',
    logger: console,
    appConfigs: config.frontendAppConfigs,
  });
}

async function readConfig(argv) {
  const program = new Command();
  program.option(
    '--config <path...>',
    'Config files to load instead of app-config.yaml',
    [],
  );

  program.parse(argv);

  const opts = program.opts();

  const paths = findPaths(import.meta.url);

  const { packages } = await getPackages(paths.targetDir);

  const schema = await loadConfigSchema({
    dependencies: packages.map(p => p.packageJson.name),
    // Include the package.json in the project root if it exists
    packagePaths: [paths.resolveTargetRoot('package.json')],
  });

  const configTargets = opts.config.map(arg => ({
    path: paths.resolveTarget(arg),
  }));

  const { appConfigs } = await loadConfig({
    configRoot: paths.targetRoot,
    configTargets: configTargets,
  });

  const frontendAppConfigs = schema.process(appConfigs, {
    visibility: ['frontend'],
    withFilteredKeys: true,
    withDeprecatedKeys: true,
  });

  const frontendConfig = ConfigReader.fromConfigs(frontendAppConfigs);

  const url = resolveBaseUrl(frontendConfig);

  const host =
    frontendConfig.getOptionalString('app.listen.host') || url.hostname;
  const port =
    frontendConfig.getOptionalNumber('app.listen.port') ||
    Number(url.port) ||
    (url.protocol === 'https:' ? 443 : 80);

  return {
    host,
    port,
    base: url.pathname,
    frontendConfig,
    frontendAppConfigs,
  };
}

function resolveBaseUrl(config) {
  const baseUrl = config.getString('app.baseUrl');
  try {
    return new URL(baseUrl);
  } catch (error) {
    throw new Error(`Invalid app.baseUrl, ${error}`);
  }
}

async function injectConfig({ staticDir, logger, appConfigs }) {
  const files = await fs.readdir(staticDir);
  const jsFiles = files.filter(file => file.endsWith('.js'));

  const escapedData = JSON.stringify(appConfigs).replace(/("|'|\\)/g, '\\$1');
  const injected = `/*__APP_INJECTED_CONFIG_MARKER__*/"${escapedData}"/*__INJECTED_END__*/`;

  for (const jsFile of jsFiles) {
    const filePath = path.join(staticDir, jsFile);

    const content = await fs.readFile(filePath, 'utf8');
    if (content.includes('__APP_INJECTED_RUNTIME_CONFIG__')) {
      logger.info(`Injecting env config into ${jsFile}`);

      const newContent = content.replace(
        '"__APP_INJECTED_RUNTIME_CONFIG__"',
        injected,
      );
      await fs.writeFile(filePath, newContent, 'utf8');
      return;
    } else if (content.includes('__APP_INJECTED_CONFIG_MARKER__')) {
      logger.info(`Replacing injected env config in ${jsFile}`);

      const newContent = content.replace(
        /\/\*__APP_INJECTED_CONFIG_MARKER__\*\/.*\/\*__INJECTED_END__\*\//,
        injected,
      );
      await fs.writeFile(filePath, newContent, 'utf8');
      return;
    }
  }
  logger.info('Env config not injected');
}

inject();
