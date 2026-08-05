#!/usr/bin/env bash
# Builds the Strapi image, spins up (or reuses) a local kind cluster with
# ingress-nginx, and helm-upgrades charts/strapi and charts/session-cache
# onto it -- the platform repo's equivalent of each app repo's own
# tools/deploy-local.sh. Unlike those, kind-config.yaml already lives in
# this repo (no sibling checkout needed) and neither chart's image build
# needs GitHub Packages auth (session-cache has no image to build at all --
# redis:7-alpine is pulled straight from Docker Hub -- and Strapi has no
# @tn4consulting/* dependency).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

CLUSTER_NAME="${CLUSTER_NAME:-kind}"
HOSTNAME=cms.mfe-pot.local

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

echo "==> Building strapi image..."
docker build -t mfe-pot-strapi:kind tools/cms/strapi

echo "==> Loading image into kind..."
kind load docker-image mfe-pot-strapi:kind --name "$CLUSTER_NAME"

echo "==> Deploying strapi..."
helm --kube-context "kind-$CLUSTER_NAME" upgrade --install strapi charts/strapi \
  -f charts/strapi/values.yaml \
  -f charts/strapi/values-kind.yaml \
  --wait --timeout 180s

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
