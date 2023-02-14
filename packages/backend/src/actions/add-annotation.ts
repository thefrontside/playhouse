import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import fs from 'fs';
import * as yaml from 'yaml';
import { Entity } from '@backstage/catalog-model';
import { type ScmIntegrations } from '@backstage/integration';
import { Octokit } from 'octokit';
import { resolveSafeChildPath } from '@backstage/backend-common';
import path from 'path';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { assert } from 'assert-ts';

const getOctokit = ({
  integrations,
}: {
  integrations: ScmIntegrations;
}) => {
  const gitHubConfig = integrations.github.byUrl(
    'github.com',
  )?.config;
  return new Octokit({
    baseUrl: gitHubConfig?.apiBaseUrl,
    auth: gitHubConfig?.token,
  });
};

interface AddAnnotationOptions {
  integrations: ScmIntegrations;
}

const GitUrlRegex = /(?<host>(git@|https:\/\/)([\w\.@]+)(\/|:))(?<owner>[\w,\-,\_]+)\/(?<repo>[\w,\-,\_]+)\/blob\/(?<branch>[\w,\-,\_]+)\/(?<filePath>.*$)/g;

export function createAddAnnotation({
  integrations,
}: AddAnnotationOptions) {
  return createTemplateAction<{ url: string; entityRef: string }>({
    id: 'backend:add-annotation',
    description: 'Add annotation to catalog-info.yaml.',
    schema: {
      input: {
        type: 'object',
        required: ['url', 'entityRef'],
        properties: {
          url: {
            title: 'url',
            description: 'Url to catalog-info.yaml file to add annotation.',
            type: 'string',
          },
          entityRef: {
            title: 'entityRef',
            description: 'entityRef',
            type: 'string'
          }
        },
      },
      output: {
        type: 'object',
        properties: {
          url: {
            title: 'url',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      const githubClient = getOctokit({ integrations });

      const url = ctx.input.url;

      const matches = url.matchAll(GitUrlRegex);

      const { owner, repo, filePath } = [...matches][0].groups as { owner: string, repo: string; filePath: string };

      const { data } = await githubClient.rest.repos.getContent({
        owner,
        repo,
        path: filePath,
        headers: {
          accept: "application/vnd.github.v3.raw",
        }
      });

      const documents = yaml.parseAllDocuments(data as unknown as string);

      for (const document of documents) {
        assert(yaml.isMap(document.contents));

        const documentEntityRef = stringifyEntityRef(document.contents.toJSON());

        if (documentEntityRef !== ctx.input.entityRef) {
          continue;
        }

        const metadata = document.contents.get('metadata') as yaml.YAMLMap;

        assert(yaml.isMap(metadata));

        let annotations = metadata.get('annotations');

        if (!annotations) {
          annotations = new yaml.YAMLMap();
          metadata.set(document.createNode('annotations'), annotations);
        }

        assert(yaml.isMap(annotations));

        annotations.set(document.createNode("backstage.io/techdocs-ref"), document.createNode("file:./docs"));
      }

      const sourceFilepath = resolveSafeChildPath(
        ctx.workspacePath,
        filePath,
      );

      fs.writeFileSync(sourceFilepath, documents.map(document => document.toString()).join(''));

      ctx.output('path', path.dirname(sourceFilepath));
    },
  });
}