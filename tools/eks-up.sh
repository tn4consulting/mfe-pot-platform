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
echo "=== terraform plan (cluster only) ==="
# Two-stage apply, not one: the kubernetes/helm/kubectl providers (providers.tf)
# all configure themselves from module.eks's own outputs (cluster_endpoint,
# cluster_certificate_authority_data). On a from-scratch stand-up those
# outputs have no value in state at all yet -- hashicorp/kubernetes and helm
# tolerate that (they defer real configuration until first resource use), but
# alekc/kubectl doesn't: a plain untargeted `terraform plan` errors immediately
# with "invalid provider configuration ... no configuration has been
# provided" the moment it needs to validate the kubectl provider block, well
# before anything is actually created. Targeting module.vpc/module.eks first
# means that plan never needs to touch the kubectl/helm/kubernetes provider
# blocks at all, since no resource under them is in scope. Safe to run even
# when the cluster already exists -- it's just a no-op plan/apply then.
terraform plan -target=module.vpc -target=module.eks -out=.eks-up-cluster.tfplan

if [ "$YES" -ne 1 ]; then
  echo
  read -r -p "Apply the plan above? This starts real AWS billing (~\$0.23-0.25/hr). [y/N] " reply
  case "$reply" in
    [yY]|[yY][eE][sS]) ;;
    *) echo "Aborted -- nothing applied."; rm -f .eks-up-cluster.tfplan; exit 1 ;;
  esac
fi

echo
echo "=== terraform apply (cluster only) ==="
terraform apply .eks-up-cluster.tfplan
rm -f .eks-up-cluster.tfplan

echo
echo "=== terraform plan (everything else) ==="
# module.eks's outputs are now real known values in state, so the
# kubectl/helm/kubernetes provider blocks configure cleanly this time.
terraform plan -out=.eks-up.tfplan

echo
echo "=== terraform apply (everything else) ==="
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

The cluster is otherwise EMPTY right now -- no apps, no Ingress resources,
so external-dns has nothing to create Route 53 records from yet. Every
*.aws.tn4consulting.com hostname will 404/NXDOMAIN until you deploy onto it.

Next: deploy the apps, either by pushing to any app repo's main (their
deploy-eks CI job picks up automatically), or from the mfe-pot meta repo
(one level up from mfe-pot-platform):

  cd .. && ./tools/deploy-eks.sh

When you're done: pnpm eks:down (never applies to infra/terraform/foundation
-- that holds the ECR images, Route 53 zone, and GitHub OIDC trust
relationship every repo's CI depends on).
EOF
