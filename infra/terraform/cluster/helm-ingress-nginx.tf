# ingress-nginx behind an AWS NLB -- deliberately not the AWS Load Balancer
# Controller/ALB, so every existing app repo's templates/ingress.yaml
# (ingressClassName: nginx) works completely unchanged.
#
# Destroy ordering note: this resource is created/managed through the `helm`
# provider, whose own provider block (providers.tf) references
# module.eks's endpoint/CA outputs -- that reference makes every helm_release
# in this layer implicitly depend on module.eks (and, transitively, module.vpc,
# since eks depends on vpc's subnet_ids). Terraform destroys dependents before
# their dependencies, so a plain `terraform destroy` here already tears down
# this Helm release (and the NLB it owns, via the Kubernetes Service delete)
# BEFORE it touches the node group or VPC -- no explicit depends_on needed,
# and adding one in the "vpc waits on this" direction isn't possible anyway
# without creating a dependency cycle. The one residual rough edge: AWS's own
# ELB/ENI teardown can lag a minute or two behind the Service-delete API call
# returning, so an immediate VPC/subnet destroy can occasionally hit a
# transient DependencyViolation. If that happens, just re-run
# `terraform destroy` -- it's idempotent and the second run succeeds once AWS
# finishes the cleanup in the interim.
resource "helm_release" "ingress_nginx" {
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = "ingress-nginx"
  create_namespace = true
  wait             = true

  set {
    name  = "controller.service.type"
    value = "LoadBalancer"
  }

  set {
    name  = "controller.service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-type"
    value = "nlb"
  }

  set {
    name  = "controller.service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-nlb-target-type"
    value = "instance"
  }

  set {
    name  = "controller.service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-scheme"
    value = "internet-facing"
  }
}

output "ingress_nginx_namespace" {
  value = helm_release.ingress_nginx.namespace
}
