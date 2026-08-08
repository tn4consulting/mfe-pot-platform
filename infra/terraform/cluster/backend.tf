# See foundation/backend.tf for the same caveat: `bucket` here must literally
# match whatever bootstrap/ actually created.
terraform {
  backend "s3" {
    bucket       = "mfe-pot-terraform-state"
    key          = "cluster/terraform.tfstate"
    region       = "ca-central-1"
    use_lockfile = true
    encrypt      = true
  }
}
