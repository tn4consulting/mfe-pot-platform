# Solves the "Terraform doesn't know the NLB hostname/zone-id at apply time"
# problem: the NLB is created by Kubernetes (via ingress-nginx's Service)
# after the cluster exists, not by Terraform directly. external-dns instead
# watches Ingress resources cluster-wide and manages the matching Route 53
# records itself, no Terraform round-trip needed.
resource "helm_release" "external_dns" {
  name             = "external-dns"
  repository       = "https://kubernetes-sigs.github.io/external-dns/"
  chart            = "external-dns"
  namespace        = "kube-system"
  create_namespace = false
  wait             = true

  set {
    name  = "provider"
    value = "aws"
  }

  set {
    name  = "aws.region"
    value = var.aws_region
  }

  set {
    name  = "domainFilters[0]"
    value = var.domain_name
  }

  set {
    name  = "zoneIdFilters[0]"
    value = data.terraform_remote_state.foundation.outputs.route53_zone_id
  }

  # sync (not upsert-only) + a fixed, cluster-instance-independent txtOwnerId
  # (not derived from any per-cluster ID) makes a destroy/recreate cycle
  # self-healing: a freshly recreated cluster's external-dns recognizes the
  # TXT ownership records the previous incarnation left behind and can
  # reconcile/prune them once new Ingresses appear, instead of accumulating
  # stale Route 53 records across every demo cycle.
  set {
    name  = "policy"
    value = "sync"
  }

  set {
    name  = "txtOwnerId"
    value = var.cluster_name
  }

  set {
    name  = "serviceAccount.create"
    value = "true"
  }

  set {
    name  = "serviceAccount.name"
    value = "external-dns"
  }

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = module.external_dns_irsa.iam_role_arn
  }
}
