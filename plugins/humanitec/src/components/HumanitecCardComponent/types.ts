import { Entity } from '@backstage/catalog-model';

export type HumanitecAnnotationedEntity = {
  metadata: {
    annotations: {
      "humanitec.com/appId": string
      "humanitec.com/orgId": string;
    }
  }
} & Entity;

export type HumanitecEnvironmentAndRunTime = HumanitecEnvironment & {
  module: Record<string, HumanitecControllerResponse>;
  resources: HumanitecEnvironmentResources[];
}

export interface HumanitecEnvironment {
  id: string;
  name: string;
  namespace: string;
  type: string;
}

export interface HumanitecControllerPods {
  containerStatuses: Record<string, any>[];
  phase: string;
  podName: string;
  revision: number;
  status: string;
}

export interface HumanitecControllerResponse {
  kind: string;
  replicas: number;
  status: string;
  pods: HumanitecControllerPods[]
}

export type HumanitecRuntimeInfoModules = Record<string, Record<string, HumanitecControllerResponse>>;

export interface HumanitecRuntimeInfo {
  modules: HumanitecRuntimeInfoModules;
  namespace: string;
}

export interface HumanitecEnvironmentResources {
  app_id: string;
  def_id: string;
  env_id: string;
  env_type: string;
  org_id: string;
  resource: Record<string, string>;
  data: Record<string, string>;
  res_id: string;
  type: string;
  status: string;
  updated_at: string;
}
