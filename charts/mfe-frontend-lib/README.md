# mfe-frontend-lib

Helm library chart (never installed directly) holding reusable
Deployment/Service/ConfigMap templates for an mfe-pot frontend -- a static
SPA served by nginx with a runtime-env entrypoint (see
`tools/docker/frontend-entrypoint.sh` and `libs/shared/runtime-config`).

An application chart depends on this and calls its named templates from
its own `templates/`, passing the shared root context (`.`):

```yaml
# Chart.yaml
dependencies:
  - name: mfe-frontend-lib
    version: 0.1.0
    repository: "file://../mfe-frontend-lib"
```

```yaml
# templates/frontend-configmap.yaml
{{ include "mfe-frontend-lib.configmap" . }}
# templates/frontend-deployment.yaml
{{ include "mfe-frontend-lib.deployment" . }}
# templates/frontend-service.yaml
{{ include "mfe-frontend-lib.service" . }}
```

## Values contract

```yaml
frontend:
  name: dashboard              # also used as the Deployment/Service/ConfigMap name
  replicaCount: 1
  image:
    repository: myregistry/mfe-pot-dashboard
    tag: "sha-abc123"
    pullPolicy: IfNotPresent
  containerPort: 80            # nginx's listen port inside the container
  servicePort: 80
  runtimeConfig:                # app-specific shape -- see apps/<app>/src/runtime-config.ts
    strapiBaseUrl: "http://strapi.mfe-pot.svc.cluster.local:1337"
    dashboardBffBaseUrl: "https://dashboard.mfe-pot.example.com/api"
```

`runtimeConfig` is serialized whole to JSON and injected as a single
`MFE_POT_ENV_JSON` env var -- the container entrypoint writes it verbatim
into `env.js` at startup, which `getRuntimeConfig()` reads as
`window.__mfePotEnv`. One generic key instead of per-field ConfigMap
entries, since every app's config shape differs.

Ingress is deliberately **not** part of this library chart -- each
application chart owns a single Ingress resource combining its frontend's
`/` path with its backend's `/api` path (where a backend exists) under one
hostname, which needs both components' names together and doesn't fit a
per-component library template cleanly.
