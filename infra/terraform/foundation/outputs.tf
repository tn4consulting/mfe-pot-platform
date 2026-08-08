output "ecr_repository_urls" {
  description = "repo name -> full ECR URI, for each app's values-eks.yaml image.repository field."
  value       = { for name, repo in aws_ecr_repository.app : name => repo.repository_url }
}

output "route53_zone_id" {
  description = "Pass into cluster/'s external-dns and cert-manager IRSA policies."
  value       = aws_route53_zone.apps.zone_id
}

output "route53_zone_arn" {
  value = aws_route53_zone.apps.arn
}

output "route53_name_servers" {
  description = "Add these as NS records for the domain wherever the parent zone actually lives. Verify with `dig NS <domain_name>` once delegation propagates."
  value       = aws_route53_zone.apps.name_servers
}

output "github_actions_deploy_role_arn" {
  description = "Set as the tn4consulting org-level GitHub Actions variable AWS_GITHUB_ACTIONS_ROLE_ARN, used by every repo's deploy-eks CI job."
  value       = aws_iam_role.github_actions_deploy.arn
}

output "cluster_name" {
  value = var.cluster_name
}

output "aws_region" {
  value = var.aws_region
}
