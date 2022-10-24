import fetch from "cross-fetch";
import { AutomationType } from '../types/create-app';
import { CreateEnvironmentType } from '../types/create-app';
import { EnvironmentsResponsePayload } from "../types/environment";
import { ResourcesResponsePayload } from "../types/resources";
import { RuntimeResponsePayload } from '../types/runtime';
import { backOff } from "exponential-backoff";

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

class FetchError extends Error {
  status: number;
  statusText: string;
  constructor(message: string, { status, statusText }: { status: number; statusText: string }) {
    super(message);
    this.status = status;
    this.statusText = statusText;
  }
}

export function createHumanitecClient({ orgId, token }: { token: string; orgId: string; }) {
  const api = `https://api.humanitec.io`;

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
      const result = await _fetch('GET', `apps/${appId}/envs`);
      return EnvironmentsResponsePayload.parse(result);
    },
    async getRuntimeInfo(appId: string, envId: string) {
      const result = await _fetch('GET', `apps/${appId}/envs/${envId}/runtime`);
      return RuntimeResponsePayload.parse(result);
    },
    async getActiveEnvironmentResources(appId: string, envId: string) {
      const result = await _fetch('GET', `apps/${appId}/envs/${envId}/resources`);
      return ResourcesResponsePayload.parse(result);
    },

    async getEnvironmentLogsSnapshot(appId: string, envId: string) {
      type Message = {
        workload_id: string;
        container_id: string;
        payload: string;
        level: string
      };

      return await _fetch<Message[]>('GET', `apps/${appId}/envs/${envId.toLowerCase()}/logs?limit=100&invert=true`);

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

  async function _fetch<R = unknown>(method: 'POST' | 'GET', url: string, payload: unknown = undefined): Promise<R> {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    if (payload) {
      options.body = JSON.stringify(payload);
    }

    return await backOff<R>(async () => {
      const r = await fetch(`${api}/orgs/${orgId}/${url}`, options)

      if (r.ok) {
        return await r.json() as R;
      } else {
        console.dir({ error: r.statusText });
      }

      throw new FetchError(`Fetch ${method} to ${url} failed.`, r);
    }, {
      numOfAttempts: 3,
      // 403 may mean we encountered bug in Humanitec API
      retry: async (e: FetchError) => e.status === 403
    });
  }
}
