#!/usr/bin/env bash
# Builds the Strapi and mock-idp images, spins up (or reuses) a local kind
# cluster with ingress-nginx, and helm-upgrades charts/strapi,
# charts/session-cache, charts/unleash, charts/mock-idp, and the
# observability stack (charts/otel-collector, charts/tempo,
# charts/prometheus, charts/grafana) onto it -- the platform repo's
# equivalent of each app repo's own tools/deploy-local.sh. Unlike those,
# kind-config.yaml already lives in this repo (no sibling checkout needed).
# session-cache, unleash, and the 4 observability charts have no image to
# build at all (all bare upstream Docker Hub images) and Strapi has no
# @tn4consulting/* dependency, so none of those need GitHub Packages auth --
# mock-idp's build does (the whole workspace's pnpm-lock.yaml pulls other
# @tn4consulting/* packages even though mock-idp itself doesn't import any),
# same as every app repo's own BFF image build.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

CLUSTER_NAME="${CLUSTER_NAME:-kind}"
HOSTNAME=cms.mfe-pot.local
MOCK_IDP_HOSTNAME=mock-idp.mfe-pot.local

NPM_TOKEN="${NODE_AUTH_TOKEN:-${GITHUB_TOKEN:-$(gh auth token 2>/dev/null || true)}}"
if [ -z "$NPM_TOKEN" ]; then
  echo "error: no GitHub token found. Set NODE_AUTH_TOKEN/GITHUB_TOKEN or run 'gh auth login' -- needed to pull @tn4consulting/* packages during the mock-idp image build." >&2
  exit 1
fi
token_file="$(mktemp)"
trap 'rm -f "$token_file"' EXIT
printf '%s' "$NPM_TOKEN" > "$token_file"

if ! kind get clusters 2>/dev/null | grep -qx "$CLUSTER_NAME"; then
  echo "==> Creating kind cluster '$CLUSTER_NAME'..."
  kind create cluster --name "$CLUSTER_NAME" \
    --config tools/k8s/kind-config.yaml \
    --image kindest/node:v1.27.3
fi

if ! kubectl --context "kind-$CLUSTER_NAME" get ns ingress-nginx >/dev/null 2>&1; then
  echo "==> Installing ingress-nginx..."
  kubectl --context "kind-$CLUSTER_NAME" apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
  kubectl --context "kind-$CLUSTER_NAME" rollout status deployment/ingress-nginx-controller \
    --namespace ingress-nginx \
    --timeout=120s
fi

echo "==> Deploying session-cache..."
helm --kube-context "kind-$CLUSTER_NAME" upgrade --install session-cache charts/session-cache \
  -f charts/session-cache/values.yaml \
  -f charts/session-cache/values-kind.yaml \
  --wait --timeout 120s

# unleash (feature-flag server + its own Postgres) -- backs design
# principle 6 (see TODO.md's "Design principles" section). No hard
# ordering dependency on anything below, deployed here simply because it's
# shared, mostly-stateless infra like session-cache. Longer timeout than
# the other bare-image charts since Postgres + Unleash's own schema
# migration on first boot takes longer than a single-container readiness
# probe.
echo "==> Deploying unleash..."
helm --kube-context "kind-$CLUSTER_NAME" upgrade --install unleash charts/unleash \
  -f charts/unleash/values.yaml \
  -f charts/unleash/values-kind.yaml \
  --wait --timeout 180s

# otel-collector/tempo/prometheus/grafana are all bare upstream images, same
# as session-cache -- no build/kind-load/restart dance needed. Deployed in
# this dependency order (collector needs tempo/prometheus reachable before
# its first export attempt) before anything that exports telemetry to them.
echo "==> Deploying otel-collector..."
helm --kube-context "kind-$CLUSTER_NAME" upgrade --install otel-collector charts/otel-collector \
  -f charts/otel-collector/values.yaml \
  -f charts/otel-collector/values-kind.yaml \
  --wait --timeout 120s

echo "==> Deploying tempo..."
helm --kube-context "kind-$CLUSTER_NAME" upgrade --install tempo charts/tempo \
  -f charts/tempo/values.yaml \
  -f charts/tempo/values-kind.yaml \
  --wait --timeout 120s

# Real upstream chart, referenced directly rather than vendored under
# charts/ -- its RBAC (ClusterRole/ClusterRoleBinding granting read-only
# list/watch on pods/deployments/nodes/etc.) is exactly right and
# maintained upstream; nothing in this repo should hand-roll that. No
# values-kind.yaml/values-eks.yaml split needed -- identical on kind and
# EKS, same posture as tempo/prometheus. fullnameOverride keeps the
# Service name predictable for charts/prometheus/templates/configmap.yaml's
# scrape job, which otherwise depends on the Helm release name.
echo "==> Deploying kube-state-metrics..."
helm --kube-context "kind-$CLUSTER_NAME" upgrade --install kube-state-metrics kube-state-metrics \
  --repo https://prometheus-community.github.io/helm-charts \
  --version 8.2.0 \
  --set fullnameOverride=kube-state-metrics \
  --wait --timeout 120s

echo "==> Deploying prometheus..."
helm --kube-context "kind-$CLUSTER_NAME" upgrade --install prometheus charts/prometheus \
  -f charts/prometheus/values.yaml \
  -f charts/prometheus/values-kind.yaml \
  --wait --timeout 120s

# The Deployment has no ConfigMap-checksum annotation, so a scrape-config-only
# change (like adding the kube-state-metrics job above) updates the ConfigMap
# but never triggers a pod restart on its own -- --wait above returns
# immediately since the pod template itself didn't change. Confirmed live:
# without this, the running Prometheus process keeps serving its old
# in-memory config indefinitely. Same class of gap as the image-tag
# kubectl-rollout-restart fix already applied to strapi/mock-idp below, just
# for a ConfigMap instead of an image.
kubectl --context "kind-$CLUSTER_NAME" rollout restart deployment/prometheus
kubectl --context "kind-$CLUSTER_NAME" rollout status deployment/prometheus --timeout=60s

echo "==> Deploying grafana..."
helm --kube-context "kind-$CLUSTER_NAME" upgrade --install grafana charts/grafana \
  -f charts/grafana/values.yaml \
  -f charts/grafana/values-kind.yaml \
  --wait --timeout 120s

echo "==> Building strapi image..."
docker build -t mfe-pot-strapi:kind tools/cms/strapi

echo "==> Loading image into kind..."
kind load docker-image mfe-pot-strapi:kind --name "$CLUSTER_NAME"

echo "==> Deploying strapi..."
helm --kube-context "kind-$CLUSTER_NAME" upgrade --install strapi charts/strapi \
  -f charts/strapi/values.yaml \
  -f charts/strapi/values-kind.yaml \
  --wait --timeout 180s

# Static image tag + pullPolicy: Never means Kubernetes has no signal to
# restart the pod just because a rebuilt image was loaded under the same
# tag -- see the identical fix (and its full story) applied to mock-idp
# below and in every app repo's own tools/deploy-local.sh. Missing here
# previously meant a strapi code change (e.g. tools/cms/strapi/src/index.ts)
# could sit built-and-loaded but never actually served, silently.
echo "==> Restarting deployment to pick up the freshly built image..."
kubectl --context "kind-$CLUSTER_NAME" rollout restart deployment/strapi
kubectl --context "kind-$CLUSTER_NAME" rollout status deployment/strapi --timeout=60s

echo "==> Waiting for ingress..."
status=000
for i in $(seq 1 30); do
  status=$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $HOSTNAME" http://localhost/_health || echo 000)
  [ "$status" = "204" ] && break
  sleep 2
done
if [ "$status" != "204" ]; then
  echo "warning: strapi isn't answering /_health with 204 yet (last status: $status). Check with:" >&2
  echo "  kubectl --context kind-$CLUSTER_NAME get pods,ingress" >&2
  exit 1
fi

echo "==> strapi is up: curl -H \"Host: $HOSTNAME\" http://localhost/_health"

echo "==> Building mock-idp image..."
DOCKER_BUILDKIT=1 docker build \
  --secret id=npm_token,src="$token_file" \
  -t mfe-pot-mock-idp:kind \
  -f apps/mock-idp/Dockerfile .

echo "==> Loading image into kind..."
kind load docker-image mfe-pot-mock-idp:kind --name "$CLUSTER_NAME"

echo "==> Updating Helm chart dependencies..."
helm dependency update charts/mock-idp

echo "==> Deploying mock-idp..."
helm --kube-context "kind-$CLUSTER_NAME" upgrade --install mock-idp charts/mock-idp \
  -f charts/mock-idp/values.yaml \
  -f charts/mock-idp/values-kind.yaml \
  --wait --timeout 120s

# Static image tag + pullPolicy: Never means Kubernetes has no signal to
# restart the pod just because a rebuilt image was loaded under the same
# tag -- see the identical fix (and its full story) in every app repo's
# own tools/deploy-local.sh.
echo "==> Restarting deployment to pick up the freshly built image..."
kubectl --context "kind-$CLUSTER_NAME" rollout restart deployment/mock-idp
kubectl --context "kind-$CLUSTER_NAME" rollout status deployment/mock-idp --timeout=60s

echo "==> Waiting for mock-idp ingress..."
status=000
for i in $(seq 1 30); do
  status=$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $MOCK_IDP_HOSTNAME" http://localhost/health || echo 000)
  [ "$status" = "200" ] && break
  sleep 2
done
if [ "$status" != "200" ]; then
  echo "warning: mock-idp isn't answering /health with 200 yet (last status: $status). Check with:" >&2
  echo "  kubectl --context kind-$CLUSTER_NAME get pods,ingress" >&2
  exit 1
fi

echo "==> mock-idp is up: curl -H \"Host: $MOCK_IDP_HOSTNAME\" http://localhost/health"
