import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import fetch from "cross-fetch";

export const deployHumanitec = ({ humanitecApiEndpoint }: { humanitecApiEndpoint: string }) => {
  return createTemplateAction<{ imageTag: string; orgId: string; app: string; }>({
    id: 'frontside:humanitec',
    schema: {
      input: {
        required: ['orgId', 'app'],
        type: 'object',
        properties: {
          imageTag: {
            type: 'string',
          },
          orgId: {
            type: 'string',
          },
          app: {
            type: 'string',
          },
        },
      }
    },
    async handler(ctx) {
      const orgId = ctx.input.orgId;
      const appId = ctx.input.app;
      const imageTag = ctx.input.imageTag;
      const imageLocation = "northamerica-northeast1-docker.pkg.dev/frontside-backstage/frontside-artifacts/podinfo"
      const image = `${imageLocation}:${imageTag}`;

      // 🚨 wasn't sure how to get the proxy working specifically for the scaffolder
      const url = `${humanitecApiEndpoint}/orgs/${orgId}`;
      // 🚨

      // 🟢 this is usually supposed to be done in CI per their docs but then we have to have our humanitec token added to github actions just for this one step so i'm just doing it here from the tag passed on from the previous step
      async function notifyHumanitecOfImage() {
        const response = await fetch(`${url}/images/podinfo/builds`, {
          method: 'POST',
          body: JSON.stringify({ "image": image }),
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (response.ok) {
          // let data = await response.text(); // response is a stream of string
          // // 🟡 https://api-docs.humanitec.com/#tag/Image/paths/~1orgs~1{orgId}~1images~1{imageId}~1builds/post
          // return data;
          return;
        }
        console.log({ response });
        throw new Error('Could not notify humanitec of image');
      }

      async function createNewApplication() {
        const response = await fetch(`${url}/apps`, {
          method: 'POST',
          body: JSON.stringify({ "id": appId, "name": appId }),
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (response.ok) {
          // let data = await response.json();
          // 🟡 https://api-docs.humanitec.com/#tag/Application/paths/~1orgs~1{orgId}~1apps/post
          // return data;
          return;
        }
        console.log({ response });
        throw new Error('Could not create an application');
      }

      // deltas are workloads
      async function createNewDeploymentDelta() {
        const body = {
          "metadata": {
            "env_id": "deployment",
            "name": "what",
          },
          "modules": {
            "add": {
              "podinfo": {
                "externals": {
                  "my-dns-resource": {
                    "type": "dns"
                  }
                },
                "profile": "humanitec/default-module",
                "spec": {
                  "containers": {
                    "podinfo": {
                      "files": {},
                      "id": "podinfo",
                      "image": `${image}`,
                      "resources": {
                        "limits": {
                          "cpu": "0.250",
                          "memory": "256Mi"
                        },
                        "requests": {
                          "cpu": "0.025",
                          "memory": "64Mi"
                        }
                      },
                      "variables": {},
                      "volume_mounts": {}
                    }
                  },
                  "ingress": {
                    "rules": {
                      "externals.my-dns-resource": {
                        "http": {
                          "/": {
                            "port": 3000,
                            "type": "default"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "remove": [],
            "update": {}
          }
        }
        const response = await fetch(`${url}/apps/${appId}/deltas`, {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (response.ok) {
          const data = await response.json();
          // 🟡 https://api-docs.humanitec.com/#tag/Delta/paths/~1orgs~1{orgId}~1apps~1{appId}~1deltas/post
          return data;
        }
        console.log({ response });
        throw new Error('Could not create deployment delta');
      }

      async function deployDelta(delta_id: string) {
        const response = await fetch(`${url}/apps/${appId}/envs/development/deploys`, {
          method: 'POST',
          body: JSON.stringify({
            "delta_id": delta_id,
            "comment": `Deploying ${imageTag}`,
          }),
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (response.ok) {
          // let data = await response.json();
          // 🟡 https://api-docs.humanitec.com/#tag/Deployment/paths/~1orgs~1{orgId}~1apps~1{appId}~1envs~1{envId}~1deploys/post
          // return data;
          return;
        }
        console.log({ response });
        throw new Error('Could not deploy delta');
      }

      await notifyHumanitecOfImage();
      await createNewApplication();
      const { id: delta_id } = await createNewDeploymentDelta();
      await deployDelta(delta_id);
    },
  });
};
