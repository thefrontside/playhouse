import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { DefaultGithubCredentialsProvider, ScmIntegrations  } from "@backstage/integration";
import { Octokit } from '@octokit/rest';
import { GetResponseDataTypeFromEndpointMethod } from "@octokit/types";
import { waitUntil } from 'async-wait-until';

export const buildAndPushAction = (integrations: ScmIntegrations) => {
  return createTemplateAction<{ githubOrg: string; repo: string }>({
    id: 'frontside:build-push',
    schema: {
      input: {
        required: ['githubOrg', 'repo'],
        type: 'object',
        properties: {
          githubOrg: {
            type: 'string',
            title: 'Contents',
            description: 'Github organization',
          },
          repo: {
            type: 'string',
            title: 'Contents',
            description: 'The new repository',
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          run_id: {
            type: 'string'
          }
        }
      }
    },
    async handler(ctx) {
      const owner = ctx.input.githubOrg;
      const repo = ctx.input.repo;
      const workflow_name = "Build and Upload Image";
      const job_name = "build-and-upload";

      // need to make this work for github app too
      const githubIntegration = DefaultGithubCredentialsProvider.fromIntegrations(integrations);
      const { token } = await githubIntegration.getCredentials({ url: `https://github.com/${owner}` });
      const octo = new Octokit({
        auth: token,
        baseUrl: "https://api.github.com"
      });

      type OctokitResponseData = GetResponseDataTypeFromEndpointMethod<typeof octo.actions.listRepoWorkflows>
      const { data }: { data: OctokitResponseData} = await octo.rest.actions.listRepoWorkflows({ owner, repo });
      const { id } = data.workflows.find(workflow => workflow.name == workflow_name) || { id: "" };
      const runid = Date.now().toString();
      
      await octo.rest.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: id,
        ref: "main",
        inputs: {
          id: runid
        }
      });

      let confirmed_runid: number;
      try {
        let foundWorkflow: number | undefined;
        await waitUntil(async () => {
          try {
            const fiveLatestRuns = await octo.rest.actions.listWorkflowRuns({
              owner,
              repo,
              workflow_id: id,
              page: 1,
              per_page: 5
            });
            const checkEachWorkflow = await Promise.all(fiveLatestRuns.data.workflow_runs.map(async ({ id: run_id }) => {
              const getJobs = await octo.rest.actions.listJobsForWorkflowRun({
                owner,
                repo,
                run_id: run_id
              });
              const findMatchingStep = getJobs.data.jobs
              .find(job => job.name === job_name)
              ?.steps?.find(step => {
                return step.name == runid;
              });
              if(findMatchingStep){
                return run_id;
              } else {
                return;
              }
            }));
            foundWorkflow = checkEachWorkflow.find(runid => runid);
          } catch (e) {
            return false;
          }
          if (foundWorkflow) {
            confirmed_runid = foundWorkflow;
            return true;
          } else {
            return false;
          }
        }, { timeout: 45_000 });
      } catch (e) {
        throw e;
      }

      try {
        await waitUntil(async () => {
          let workflow_run_status;
          try {
            workflow_run_status = await octo.rest.actions.getWorkflowRun({
              owner,
              repo,
              run_id: confirmed_runid,
            });
          } catch (e) {
            return false
          };
          if (workflow_run_status.data.status == 'completed') {
            return true;
          } else {
            return false;
          }
        }, { timeout: 45_000 });
      } catch (e) {
        throw e;
      }
      
      ctx.output("run_id", runid)
    },
  });
};
