import { HumanitecClient } from './humanitec';

export async function fetchAppInfo({ client }: { client: HumanitecClient; }, appId: string) {
  const environments = await client.getEnvironments(appId);

  return await Promise.all(environments.map(async (env) => {
    const [runtime, resources] = await Promise.all([
      client.getRuntimeInfo(appId, env.id),
      client.getActiveEnvironmentResources(appId, env.id),
    ]);

    return {
      ...env,
      runtime,
      resources
    };
  }));
}

export type FetchAppInfoResponse = Awaited<ReturnType<typeof fetchAppInfo>>
export type FetchAppInfoEnvironment = FetchAppInfoResponse[0]