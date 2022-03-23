## Backstage

To start the Backstage app with Postgres via docker compose, run:

```sh
docker-compose up
yarn install
POSTGRES_SERVICE_PORT=5432 POSTGRES_USER=postgres POSTGRES_PASSWORD=postgres yarn dev
```

To start Backstage in your local cluster using minikube, run:

```
TAG=whatever
PG=whatever

yarn install
yarn tsc
yarn build
yarn build-image --tag backstage:$TAG

minikube start
eval $(minikube docker-env)
minikube image load backstage:$TAG

# TODO - need to modify the charts so that the following steps are automated for local development but for now please do the following manually:
* 💥 comment out ./backstate/templates/certificate.yaml
* 💥 comment out ./backstage/templates/secrets.yaml
* 💥 comment out `volumeMounts` and `volumes`
* 💥 modify container command to exclude `app-config.production.yaml`

helm upgrade --install min-postgres-chart ./charts/postgres \
  -f ./charts/postgres/Values.yaml \
  --set postgresUsername=$PG \
  --set postgresPassword=$PG

helm upgrade --install min-backstage-chart ./charts/backstage \
  -f ./charts/backstage/Values.yaml \
  --set backstageImage=backstage:$TAG \
  --set baseUrl=http://localhost:7007

kubectl port-forward svc/backstage 7007:80
```
