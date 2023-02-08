# 1Password vault replace syntax
#-op://vault-name/item-name/[section-name/]field-name

integrations:
  github:
    - host: github.com
      token: {{ op://private/Backstage Github PAT/password }}

auth:
  environment: development
  providers:
    auth0:
      development:
        domain: {{ op://shared/Backstage Auth0/production/domain }}
        clientId: {{ op://shared/Backstage Auth0/production/client_id }}
        clientSecret: {{ op://shared/Backstage Auth0/production/client_secret }}
        audience: {{ op://shared/Backstage Auth0/production/audience }}
    github:
      development:
        clientId: {{ op://shared/Backstage - GitHub oAuth App/localhost/client id }}
        clientSecret: {{ op://shared/Backstage - GitHub oAuth App/localhost/client secret }}

humanitec:
  orgId: the-frontside-software-inc
  registryUrl: 'northamerica-northeast1-docker.pkg.dev/frontside-backstage/frontside-artifacts'
  token: {{ op://shared/Humanitec Token/credential }}

techdocs:
  builder: external
  publisher:
    type: googleGcs
    googleGcs:
      bucketName: {{ op://shared/frontside-techdocs-reader/bucketName }}
      projectId: {{ op://shared/frontside-techdocs-reader/projectId }}
      credentials: '{{ op://shared/frontside-techdocs-reader/credentials }}'