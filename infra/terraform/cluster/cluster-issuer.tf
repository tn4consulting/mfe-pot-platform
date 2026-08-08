# Both staging and prod ClusterIssuers are always created -- which one an app
# actually uses is chosen per-app, per-deploy, via its own
# values-eks.yaml's ingress.tls.clusterIssuer field, not a cluster-wide
# toggle. Default to letsencrypt-staging while iterating on this Terraform
# itself (avoids Let's Encrypt rate limits across repeated destroy/recreate
# cycles); switch a given app to letsencrypt-prod only right before an actual
# demo.
#
# kubectl_manifest (not the Terraform-native kubernetes_manifest resource,
# which is known-fragile applying CRD-defined types in the same apply that
# installs the CRDs) for these -- ClusterIssuer is a cert-manager CRD type,
# and kubectl_manifest shells out to a real API call rather than needing the
# CRD schema known at plan time.
#
# No explicit accessKeyID/secretAccessKey in the route53 solver block: the
# cert-manager pod's own IRSA-annotated ServiceAccount (see
# helm-cert-manager.tf) supplies credentials automatically via the pod's
# assumed role.

locals {
  cluster_issuers = {
    letsencrypt-staging = "https://acme-staging-v02.api.letsencrypt.org/directory"
    letsencrypt-prod    = "https://acme-v02.api.letsencrypt.org/directory"
  }
}

resource "kubectl_manifest" "cluster_issuer" {
  for_each = local.cluster_issuers

  yaml_body = yamlencode({
    apiVersion = "cert-manager.io/v1"
    kind       = "ClusterIssuer"
    metadata = {
      name = each.key
    }
    spec = {
      acme = {
        server = each.value
        email  = var.acme_email
        privateKeySecretRef = {
          name = "${each.key}-account-key"
        }
        solvers = [
          {
            dns01 = {
              route53 = {
                region       = var.aws_region
                hostedZoneID = data.terraform_remote_state.foundation.outputs.route53_zone_id
              }
            }
          },
        ]
      }
    }
  })

  depends_on = [helm_release.cert_manager]
}
