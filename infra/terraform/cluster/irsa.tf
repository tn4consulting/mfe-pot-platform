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
