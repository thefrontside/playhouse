# Backstage Deployment Workflow Overview

Runs on commits to the main branch (pull request merge commits):

1. Authenticate workflow runner to GCP

2. Install Cloud SDK
    - This is so we can run `gcloud` commands to submit a build to `Cloud Build`

3. Run yarn install, tsc, and build

4. Build Backstage image using `Cloud Build` and push to `Artifacts Registry`
    - Uses the git commit SHA as image tag

5. Authenticate to GKE cluster to upgrade deployments

6. Upgrade [postgres chart](https://github.com/thefrontside/backstage/tree/main/charts/postgres)

7. Upgrade [backstage chart](https://github.com/thefrontside/backstage/tree/main/charts/backstage)
    - The deployment chart will use the new Backstage image that was just pushed to the Artifacts Registry

8. Confirm the new deployment of Backstage is successful
    - If unsuccessful the deployment will rollback to the previous revision
