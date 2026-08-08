# One-time, hand-run bootstrap: creates the S3 bucket that every other layer's
# remote state lives in. Deliberately uses LOCAL state itself -- the classic
# chicken-and-egg problem (the backend bucket can't be created by a config that
# uses it as its own backend). This resource is trivial enough to re-create by
# hand or `terraform import` if this local state file is ever lost; no remote
# state, no locking, nothing elaborate needed for one S3 bucket.
#
# Run this once, ever (or once per AWS account if the whole thing is rebuilt
# from scratch). Never destroy it as part of a demo up/down cycle -- foundation/
# and cluster/ both depend on it existing.

terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region the state bucket lives in. Should match every other layer's region."
  type        = string
  default     = "ca-central-1"
}

variable "state_bucket_name" {
  description = "Globally-unique S3 bucket name for Terraform remote state. Bucket names are global across all AWS accounts, so the default is unlikely to be free -- override it."
  type        = string
  default     = "mfe-pot-terraform-state"
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = var.state_bucket_name

  # Deliberately no lifecycle { prevent_destroy = true } -- this is a PoC, and
  # a human deliberately running `terraform destroy` in this specific directory
  # should be trusted to mean it. Just don't wire this into any automated
  # up/down cycle.
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    # Versioning, not a backup strategy: protects against a bad `apply`
    # clobbering state, lets you recover the previous state file by hand.
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "state_bucket_name" {
  value       = aws_s3_bucket.terraform_state.id
  description = "Pass this into foundation/ and cluster/'s backend.tf `bucket` field."
}
