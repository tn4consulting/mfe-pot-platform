# IRSA roles for the two addons that need to write to Route 53. Deliberately
# NOT in foundation/: the EKS cluster's own OIDC issuer URL contains a random
# ID that changes every destroy/recreate, so a trust policy referencing it has
# to be recreated every cycle too -- these belong here, coupled to one cluster
# instance, not in the persistent layer.

module "external_dns_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.39"

  role_name = "${var.cluster_name}-external-dns"

  attach_external_dns_policy    = true
  external_dns_hosted_zone_arns = [data.terraform_remote_state.foundation.outputs.route53_zone_arn]

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:external-dns"]
    }
  }
}

module "cert_manager_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.39"

  role_name = "${var.cluster_name}-cert-manager"

  attach_cert_manager_policy    = true
  cert_manager_hosted_zone_arns = [data.terraform_remote_state.foundation.outputs.route53_zone_arn]

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["cert-manager:cert-manager"]
    }
  }
}

# Cost Explorer has no attach_*_policy convenience flag on this module (it
# only wraps a fixed list of well-known addons -- external-dns, cert-manager,
# ebs-csi, etc.), so this attaches a hand-authored policy via the module's
# generic role_policy_arns input instead. GetCostAndUsage doesn't support
# resource-level ARNs at all (Cost Explorer's API has no per-resource
# scoping), so Resource = "*" here is the narrowest this grant can be -- one
# read-only action, nothing else.
data "aws_iam_policy_document" "aws_cost_exporter_cost_explorer_read" {
  statement {
    sid       = "CostExplorerReadOnly"
    effect    = "Allow"
    actions   = ["ce:GetCostAndUsage"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "aws_cost_exporter_cost_explorer_read" {
  name   = "${var.cluster_name}-aws-cost-exporter-cost-explorer-read"
  policy = data.aws_iam_policy_document.aws_cost_exporter_cost_explorer_read.json
}

module "aws_cost_exporter_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.39"

  # Referenced directly (not via a Terraform output) from
  # charts/aws-cost-exporter/values-eks.yaml -- this chart isn't
  # Terraform-installed (see mfe-pot-platform/.github/workflows/deploy-eks.yml's
  # deploy-aws-cost-exporter job), so there's no other way for it to receive
  # this role's ARN. Deterministic from account ID + this role_name, safe to
  # hardcode there the same way the ECR account ID already is.
  role_name = "${var.cluster_name}-aws-cost-exporter"

  role_policy_arns = {
    cost_explorer_read = aws_iam_policy.aws_cost_exporter_cost_explorer_read.arn
  }

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["default:aws-cost-exporter"]
    }
  }
}
