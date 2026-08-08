# Public hosted zone for the 8 app hostnames. NS delegation into the parent
# zone (wherever tn4consulting.com actually lives) is a manual, one-time step
# outside Terraform's control -- see outputs.tf's `route53_name_servers` and
# the design doc for the exact records to add.

resource "aws_route53_zone" "apps" {
  name    = var.domain_name
  comment = "mfe-pot PoC app hostnames -- delegated subdomain, see mfe-pot/docs/plans/ for the AWS EKS design doc"
}
