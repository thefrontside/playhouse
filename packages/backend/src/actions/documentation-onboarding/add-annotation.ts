import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import fs from 'fs-extra';
import * as yaml from 'yaml';
import { type ScmIntegrations } from '@backstage/integration';
import { Octokit } from 'octokit';
import { resolveSafeChildPath } from '@backstage/backend-common';
import path from 'path';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { assert } from 'assert-ts';
import { Logger } from 'winston';

export const TemplateDirectory = "documentation-onboarding";

const getOctokit = ({
  integrations,
  host
}: {
  integrations: ScmIntegrations;
  host: string;
}) => {
  const gitHubConfig = integrations.github.byUrl(
    host,
  )?.config;
  return new Octokit({
    baseUrl: gitHubConfig?.apiBaseUrl,
    auth: gitHubConfig?.token,
  });
};

interface AddAnnotationOptions {
  integrations: ScmIntegrations;
  logger: Logger;
}

const GitUrlRegex = /(git@|https:\/\/)(?<host>([\w\.@]+))(\/|:)(?<owner>[\w,\-,\_]+)\/(?<repo>[\w,\-,\_]+)\/blob\/(?<branch>[\w,\-,\_]+)\/(?<filePath>.*$)/g;

export function createAddAnnotation({
  integrations,
  logger
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
            title: 'path',
            type: 'string',
          },
          repoUrl: {
            title: 'repoUrl',
            type: 'string'
          }
        },
      },
    },
    async handler(ctx) {

      const url = ctx.input.url;

      const matches = url.matchAll(GitUrlRegex);

      const { host, owner, repo, filePath } = [...matches][0].groups as { host: string; owner: string, repo: string; filePath: string };

      const gitClient = getOctokit({ integrations, host });

      const { data } = await gitClient.rest.repos.getContent({
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

      const docsDirectory = resolveSafeChildPath(
        ctx.workspacePath,
        'docs',
      );
      
      fs.mkdirSync(docsDirectory, { mode: 0o744 });

      const templateDirectory = resolveSafeChildPath("../..", path.join("templates", TemplateDirectory, "template"));

      try {
        await fs.copy(templateDirectory, ctx.workspacePath, { overwrite: true });
      } catch (e) {
        logger.error(e);

        throw e;
      }

      const repoUrl = `${host}?repo=${repo}&owner=${owner}`;
      
      logger.info(`saved files to = ${ctx.workspacePath}`);
      logger.info(`repoUrl = ${repoUrl}`)

      ctx.output('repoUrl', repoUrl);
      ctx.output('path', path.dirname(sourceFilepath));
    },
  });
}