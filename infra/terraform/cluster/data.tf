# Reads the persistent foundation layer's outputs (ECR URLs, Route 53 zone,
# GitHub OIDC role ARN) -- this layer never creates or destroys those, only
# consumes them.
data "aws_caller_identity" "current" {}

data "terraform_remote_state" "foundation" {
  backend = "s3"

  config = {
    bucket = "mfe-pot-terraform-state"
    key    = "foundation/terraform.tfstate"
    region = var.aws_region
  }
}
