# TLS for all 8 app hostnames -- a real domain now exists, and this is demoed
# in a browser against a "government services" UI, so HTTP-only reads as
# unfinished. Incremental cost is low since external-dns already needed the
# same Route 53 IRSA plumbing this reuses for the DNS-01 challenge.
resource "helm_release" "cert_manager" {
  name             = "cert-manager"
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  namespace        = "cert-manager"
  create_namespace = true
  wait             = true

  set {
    name  = "installCRDs"
    value = "true"
  }

  set {
    name  = "serviceAccount.create"
    value = "true"
  }

  set {
    name  = "serviceAccount.name"
    value = "cert-manager"
  }

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = module.cert_manager_irsa.iam_role_arn
  }
}
