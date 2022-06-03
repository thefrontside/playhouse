import fetch from "cross-fetch";
import { AutomationType } from '../schemas/create-app';
import { CreateEnvironmentType } from '../schemas/create-app';
import { EnvironmentsResponsePayload } from "../schemas/environment";
import { ResourcesResponsePayload } from "../schemas/resources";
import { RuntimeResponsePayload } from '../schemas/runtime';

export interface CreateDeltaPayload {
  metadata: CreateEnvironmentType['metadata'],
  modules: {
    add: CreateEnvironmentType['modules'],
    update: CreateEnvironmentType['modules'],
    remove: string[]
  }
}

export type URLs = { resource: 'DELTA', env_id: string, delta_id: string, app_id: string }

export type HumanitecClient = ReturnType<typeof createHumanitecClient>

export function createHumanitecClient({ api, orgId }: { api: string; orgId: string; }) {
  return {
    createApplication(payload: { id: string; name: string; }) {
      return _fetch<{ id: string; name: string; }>('POST', 'apps', payload);
    },
    createDelta(appId: string, payload: CreateDeltaPayload) {
      return _fetch<{ id: string; metadata: { env_id: string; }; }>('POST', `apps/${appId}/deltas`, payload);
    },
    notifyOfImage(image: string, payload: { image: string; }) {
      return _fetch<unknown>('POST', `images/${image}/builds`, payload);
    },
    deployDelta(appId: string, environment: string, payload: { delta_id: string; comment: string; }) {
      return _fetch<{ id: string; }>('POST', `apps/${appId}/envs/${environment}/deploys`, payload);
    },
    createAutomation(appId: string, envId: string, payload: AutomationType) {
      return _fetch<{ id: string; createdAt: string; update_to: string; } & AutomationType>('POST', `apps/${appId}/envs/${envId}/rules`, payload);
    },
    async getEnvironments(appId: string) {
      const result = await _fetch('GET', `apps/${appId}/envs`, {});
      return EnvironmentsResponsePayload.parse(result);
    },
    async getRuntimeInfo(appId: string, envId: string) {
      const result = await _fetch('GET', `apps/${appId}/envs/${envId}/runtime`, {});
      return RuntimeResponsePayload.parse(result);
    },
    async getActiveEnvironmentResources(appId: string, envId: string) {
      const result = await _fetch('GET', `apps/${appId}/envs/${envId}/resources`, {});
      return ResourcesResponsePayload.parse(result);
    },
    buildUrl(params: URLs) {
      const baseUrl = `https://app.humanitec.io/orgs/${orgId}`;
      switch (params.resource) {
        case 'DELTA':
          return `${baseUrl}/apps/${params.app_id}/envs/${params.env_id}/draft/${params.delta_id}/workloads`;
        default:
          return '';
      }
    }
  };

  async function _fetch<R = unknown, P = unknown>(method: 'POST' | 'GET', url: string, payload: P): Promise<R> {
    const response = await fetch(`${api}/orgs/${orgId}/${url}`, {
      method,
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      return await response.json();
    }

    throw new Error(`${method}: ${url} - failed due to ${response.status}: ${response.statusText}`);
  }
}
