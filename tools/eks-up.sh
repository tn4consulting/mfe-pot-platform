#!/usr/bin/env bash
#
# Stands up the ephemeral half of the AWS EKS hosting story: VPC, EKS
# cluster, node group, ingress-nginx/external-dns/cert-manager -- everything
# in infra/terraform/cluster. Deliberately does NOT touch
# infra/terraform/foundation (ECR, Route 53 zone, GitHub OIDC/IAM) -- that
# layer is applied once, by hand, and left running; see
# infra/terraform/README.md if it isn't up yet.
#
# This is the AWS analogue of tools/deploy-local.sh's "spin up the cluster"
# half -- it doesn't deploy any app itself. Once this finishes, either push
# to any app repo's main (their deploy-eks CI job picks it up automatically)
# or run ../../tools/deploy-eks.sh from the mfe-pot meta repo to bring
# everything up in one go.
#
# Real AWS costs start accruing the moment this succeeds -- roughly
# $0.23-0.25/hr all-in (EKS control plane + NAT gateway + 2x node). Run
# tools/eks-down.sh when you're done for the day.
#
# Usage: pnpm eks:up [-y|--yes]
#   -y, --yes   skip the confirmation prompt (e.g. for scripted use).

set -euo pipefail

YES=0
for arg in "$@"; do
  case "$arg" in
    -y|--yes) YES=1 ;;
    -h|--help)
      echo "Usage: pnpm eks:up [-y|--yes]"
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

echo "=== Preflight ==="
command -v terraform > /dev/null || { echo "error: terraform not found." >&2; exit 1; }
aws sts get-caller-identity > /dev/null 2>&1 || { echo "error: AWS CLI has no working credentials -- fix that first." >&2; exit 1; }

# The cluster layer reads foundation's outputs via terraform_remote_state --
# fail fast with a clear message rather than a cryptic Terraform error deep
# in a 2-minute plan if that layer was never applied.
if ! aws s3api head-object --bucket mfe-pot-terraform-state --key foundation/terraform.tfstate > /dev/null 2>&1; then
  echo "error: foundation/terraform.tfstate not found in the state bucket -- apply infra/terraform/foundation first (see its own README.md). That layer is applied once and left running, unlike this one." >&2
  exit 1
fi
echo "AWS credentials OK, foundation layer already applied."

echo
echo "=== terraform init ==="
terraform init -input=false

echo
echo "=== terraform plan ==="
terraform plan -out=.eks-up.tfplan

if [ "$YES" -ne 1 ]; then
  echo
  read -r -p "Apply the plan above? This starts real AWS billing (~\$0.23-0.25/hr). [y/N] " reply
  case "$reply" in
    [yY]|[yY][eE][sS]) ;;
    *) echo "Aborted -- nothing applied."; rm -f .eks-up.tfplan; exit 1 ;;
  esac
fi

echo
echo "=== terraform apply ==="
terraform apply .eks-up.tfplan
rm -f .eks-up.tfplan

CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo mfe-pot)
AWS_REGION_OUT=$(terraform output -raw aws_region 2>/dev/null || echo ca-central-1)

echo
echo "=== Pointing kubectl at the cluster ==="
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION_OUT"
kubectl get nodes

echo
echo "=== Cluster is up. ==="
cat <<EOF

Next: deploy the apps onto it, either by pushing to any app repo's main
(their deploy-eks CI job picks up automatically), or from the mfe-pot meta
repo (one level up from mfe-pot-platform):

  cd .. && ./tools/deploy-eks.sh

When you're done: pnpm eks:down (never applies to infra/terraform/foundation
-- that holds the ECR images, Route 53 zone, and GitHub OIDC trust
relationship every repo's CI depends on).
EOF
