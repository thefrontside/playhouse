# cert-manager creation

We are using `cert-manager` to create certs for our custom domain. For integration with Humanitec, the recommendation is to use `nginx-ingress`. With this, we can use [this tutorial](https://cert-manager.io/docs/tutorials/acme/nginx-ingress/) for reference.

Install the `cert-manager` foundational resources first. (Note, update the version. As of writing, this was the current version.)

```
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.yaml
```

Add the appropriate `ClusterIssuer` to the same namespace (run from the root of this repo). This is using Let's Encrypt which has a "staging" endpoint for test certificates. This allows one to test a setup without accidentally the low rate limits that exist on the production instance.

```shell
kubectl create -n cert-manager -f ./charts/cert-manager/staging.yaml
kubectl create -n cert-manager -f ./charts/cert-manager/prod.yaml
```

After the cert-manager is setup, the Ingress requires an annotation shim that cert-manager watches.

```yaml
annotations:
  cert-manager.io/cluster-issuer: 'letsencrypt-staging' # Replace this with a production issuer, `letsencrypt-prod`, once you've tested it
```

Within Humanitec, this requires a special resource definition with the following values.

- API Version: `v1`
- Ingress Class Name: `nginx`
- Annotations:

```
{
  "cert-manager.io/cluster-issuer": "letsencrypt-prod"
}
```

The certificates which `cert-manager` creates need to be mapped to secrets in the backstage namespace. This is handled in Humanitec with a custom `humanitec/template` `tls-cert` record.

- Init template:

```
tlsSecretName: {{ .id }}-tls
hostName: ${resources.dns.outputs.host}
certificateName: {{ .id }}-cert
```

- Manifests template

```
certificate-crd.yml:
  data:
    apiVersion: cert-manager.io/v1
    kind: Certificate
    metadata:
      name: {{ .init.certificateName }}
    spec:
      secretName: {{ .init.tlsSecretName }}
      duration: 2160h
      renewBefore: 720h
      isCA: false
      privateKey:
        algorithm: RSA
        encoding: PKCS1
        size: 2048
      usages:
        - server auth
        - client auth
      dnsNames:
        - "{{ .init.hostName }}"
      issuerRef:
        name: letsencrypt-prod
        kind: ClusterIssuer
  location: namespace
```

- Values template

```
tls_secret_name: {{ .init.tlsSecretName }}
```
