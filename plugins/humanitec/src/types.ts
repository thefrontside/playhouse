import { Entity } from '@backstage/catalog-model';

export type HumanitecAnnotationedEntity = {
  metadata: {
    annotations: {
      "humanitec.com/appId": string
      "humanitec.com/orgId": string;
    }
  }
} & Entity;