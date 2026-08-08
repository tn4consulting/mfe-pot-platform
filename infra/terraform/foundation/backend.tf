# Remote state, S3 native locking (use_lockfile) rather than a DynamoDB lock
# table -- one fewer persistent resource for the same guarantee, available
# since Terraform 1.10.
#
# NOTE: backend blocks cannot reference variables, so `bucket` below must
# literally match whatever `state_bucket_name` bootstrap/ actually created.
# If you overrode the default there, override it here too.
terraform {
  backend "s3" {
    bucket       = "mfe-pot-terraform-state"
    key          = "foundation/terraform.tfstate"
    region       = "ca-central-1"
    use_lockfile = true
    encrypt      = true
  }
}
