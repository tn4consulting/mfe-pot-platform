# mfe-backend-lib

Helm library chart (never installed directly) holding reusable
Deployment/Service/ConfigMap templates for an mfe-pot BFF -- a plain
Express/Node process listening on `PORT`, with a `GET /health` endpoint
used for the readiness/liveness probes (every BFF already has one, added
for the `mfe-e2e` Playwright suite's readiness checks -- see CLAUDE.md's
"Independent testability" section).

An application chart depends on this and calls its named templates from
its own `templates/`, passing the shared root context (`.`):

```yaml
# Chart.yaml
dependencies:
  - name: mfe-backend-lib
    version: 0.2.0
    repository: "file://../mfe-backend-lib"
```

```yaml
# templates/backend-configmap.yaml
{{ include "mfe-backend-lib.configmap" . }}
# templates/backend-deployment.yaml
{{ include "mfe-backend-lib.deployment" . }}
# templates/backend-service.yaml
{{ include "mfe-backend-lib.service" . }}
# templates/backend-pdb.yaml -- renders nothing unless
# backend.podDisruptionBudget.enabled is true, safe to always include
{{ include "mfe-backend-lib.pdb" . }}
```

## Values contract

```yaml
backend:
  name: job-bank-bff          # also used as the Deployment/Service/ConfigMap/PDB name
  replicaCount: 1
  image:
    repository: myregistry/mfe-pot-job-bank-bff
    tag: "sha-abc123"
    pullPolicy: IfNotPresent
  containerPort: 3001
  servicePort: 3001           # defaults to containerPort if omitted
  env:
    HOST: "0.0.0.0"            # must be 0.0.0.0 in-container, not the app's 'localhost' dev default
    PORT: "3001"
  readinessPath: /health       # optional, defaults to /health (same as liveness) -- override to
                                # e.g. /ready once this BFF has a real readiness check (verifies
                                # its own dependencies, e.g. Redis, not just "the process is up")
  podDisruptionBudget:
    enabled: false              # only turn on alongside replicaCount > 1 -- see _pdb.tpl's own comment
    minAvailable: 1
```

The Deployment's rolling-update `strategy` (`maxUnavailable: 0`, `maxSurge: 1`)
and soft pod anti-affinity are unconditional, not values-gated -- both are
harmless at `replicaCount: 1` (see `_deployment.tpl`'s own comments) and
directly implement `mfe-pot/TODO.md`'s "Design principles" section,
principles 3 and 4.

`env` is rendered as plain ConfigMap keys (unlike `mfe-frontend-lib`'s
single JSON blob) because BFFs already read individual env vars directly
via `process.env` -- no code change needed there.
