import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { DefaultGithubCredentialsProvider, ScmIntegrations  } from "@backstage/integration";
import { Octokit } from '@octokit/rest';
import { GetResponseDataTypeFromEndpointMethod } from "@octokit/types";
import { waitUntil } from 'async-wait-until';

export const buildAndPushAction = (integrations: ScmIntegrations) => {
  return createTemplateAction<{ githubOrg: string; repo: string; }>({
    id: 'frontside:build-push',
    schema: {
      input: {
        required: ['githubOrg', 'repo'],
        type: 'object',
        properties: {
          githubOrg: {
            type: 'string',
          },
          repo: {
            type: 'string',
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          runId: {
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
      let workflow_id: number = 0;
      try {
        await waitUntil(async () => {
          try {
            const { data }: { data: OctokitResponseData} = await octo.rest.actions.listRepoWorkflows({ owner, repo });
            workflow_id = data.workflows.find(workflow => workflow.name == workflow_name)?.id || 0;
          } catch (e) {
            return false;
          }
          if (workflow_id !== 0) {
            return true;
          } else {
            return false;
          }
        }, { timeout: 30_000 })
      } catch (e) {
        throw e;
      }

      const runId = Date.now().toString();
      await octo.rest.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id,
        ref: "master",
        inputs: {
          id: runId
        }
      });

      let confirmed_runId: number;
      try {
        let foundWorkflow: number | undefined;
        await waitUntil(async () => {
          try {
            const fiveLatestRuns = await octo.rest.actions.listWorkflowRuns({
              owner,
              repo,
              workflow_id,
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
                return step.name == runId;
              });
              if(findMatchingStep){
                return run_id;
              } else {
                return;
              }
            }));
            foundWorkflow = checkEachWorkflow.find(runId => runId);
          } catch (e) {
            return false;
          }
          if (foundWorkflow) {
            confirmed_runId = foundWorkflow;
            return true;
          } else {
            return false;
          }
        }, { timeout: 60_000 });
      } catch (e) {
        throw e;
      }

      try {
        let workflow_run;
        await waitUntil(async () => {
          try {
            workflow_run = await octo.rest.actions.getWorkflowRun({
              owner,
              repo,
              run_id: confirmed_runId,
            });
          } catch (e) {
            return false
          };
          if (workflow_run.data.conclusion == 'success') {
            return true;
          } else if (workflow_run.data.conclusion == 'failure') {
            throw "Github actions workflow run failed";
            // see status options: https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs-for-a-repository
          } else {
            return false;
          }
        }, { timeout: 75_000 });
      } catch (e) {
        throw e;
      }
      console.log("runId", runId, typeof runId)
      ctx.output("runId", `${runId}`);
    },
  });
};
