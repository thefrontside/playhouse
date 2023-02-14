import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import fs from 'fs';
import yaml from 'js-yaml';
import { Entity } from '@backstage/catalog-model';
import { type ScmIntegrations } from '@backstage/integration';
import { Octokit } from 'octokit';
import { resolveSafeChildPath } from '@backstage/backend-common';
import path from 'path';

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
  return createTemplateAction<{ url: string; }>({
    id: 'backend:add-annotation',
    description: 'Add annotation to catalog-info.yaml.',
    schema: {
      input: {
        type: 'object',
        required: ['url'],
        properties: {
          url: {
            title: 'url',
            description: 'Url to catalog-info.yaml file to add annotation.',
            type: 'string',
          },
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

      // TODO: type narrow data to correct type
      const contentInfo = yaml.loadAll(data as unknown as string)[0] as Entity;

      contentInfo.metadata.annotations = contentInfo.metadata.annotations ?? {};

      contentInfo.metadata.annotations["some-domain.com/website-url"] = "some-value";

      const sourceFilepath = resolveSafeChildPath(
        ctx.workspacePath,
        filePath,
      );

      fs.writeFileSync(sourceFilepath, yaml.dump(contentInfo));
      
      ctx.output('path', path.dirname(sourceFilepath));
    },
  });
}