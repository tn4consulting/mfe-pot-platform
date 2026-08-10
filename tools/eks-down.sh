#!/usr/bin/env bash
#
# Tears down the ephemeral half of the AWS EKS hosting story: VPC, EKS
# cluster, node group, ingress-nginx/external-dns/cert-manager --
# everything in infra/terraform/cluster. Deliberately does NOT touch
# infra/terraform/foundation (ECR images, Route 53 zone, GitHub OIDC/IAM) --
# that layer stays up across demo cycles; see infra/terraform/README.md.
#
# helm_release.ingress_nginx (and the real AWS NLB it owns) is destroyed
# before the node group/VPC automatically -- see the comment in
# infra/terraform/cluster/helm-ingress-nginx.tf for why no explicit
# depends_on is needed. If this fails partway with a DependencyViolation on
# a subnet or security group, that's AWS's own ELB/ENI cleanup lagging a
# minute or two behind the Kubernetes Service delete -- just re-run this
# script, it's idempotent.
#
# Usage: pnpm eks:down [-y|--yes]
#   -y, --yes   skip the confirmation prompt (e.g. for scripted use).

set -euo pipefail

YES=0
for arg in "$@"; do
  case "$arg" in
    -y|--yes) YES=1 ;;
    -h|--help)
      echo "Usage: pnpm eks:down [-y|--yes]"
      exit 0
      ;;
    *)
      echo "error: unknown option '$arg'" >&2
      exit 1
      ;;
  esac
done

CLUSTER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../infra/terraform/cluster" && pwd)"
cd "$CLUSTER_DIR"

command -v terraform > /dev/null || { echo "error: terraform not found." >&2; exit 1; }
# This environment has no default AWS credentials configured -- AWS_PROFILE
# must be exported explicitly. `aws sts get-caller-identity` alone isn't a
# reliable enough check: it can succeed against a short-lived ambient/cached
# credential that's gone again by the time Terraform's own aws provider
# (providers.tf, no explicit profile of its own) tries to authenticate later
# in the run, well after this preflight passed.
if [ -z "${AWS_PROFILE:-}" ]; then
  echo "error: AWS_PROFILE is not set -- run 'export AWS_PROFILE=tn4consulting' (or your own profile) first." >&2
  exit 1
fi
aws sts get-caller-identity > /dev/null 2>&1 || { echo "error: AWS CLI has no working credentials -- fix that first." >&2; exit 1; }

if [ "$YES" -ne 1 ]; then
  echo "This will destroy the running EKS cluster, VPC, and everything on them (all deployed apps included)."
  echo "foundation/ (ECR images, Route 53 zone, GitHub OIDC/IAM) is NOT touched."
  read -r -p "Continue? [y/N] " reply
  case "$reply" in
    [yY]|[yY][eE][sS]) ;;
    *) echo "Aborted -- nothing destroyed."; exit 1 ;;
  esac
fi

echo
echo "=== terraform destroy ==="
terraform destroy -auto-approve

echo
echo "=== Cluster torn down. ==="
echo "foundation/ is untouched -- ECR images, Route 53 zone, and GitHub OIDC trust relationship are all still in place for next time."
echo "Run 'pnpm eks:up' to bring it back."
