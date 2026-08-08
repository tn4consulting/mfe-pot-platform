output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "update_kubeconfig_command" {
  value = "aws eks update-kubeconfig --name ${var.cluster_name} --region ${var.aws_region}"
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "check_nlb_hostname_command" {
  description = "Run after apply to confirm the NLB is up: `kubectl get svc -n ingress-nginx ingress-nginx-controller`"
  value       = "kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'"
}
