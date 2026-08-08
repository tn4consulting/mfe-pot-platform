variable "aws_region" {
  type    = string
  default = "ca-central-1"
}

variable "domain_name" {
  description = "Must match foundation's domain_name -- used to scope external-dns' domainFilters."
  type        = string
  default     = "aws.tn4consulting.com"
}

variable "cluster_name" {
  description = "Must match foundation's cluster_name -- that layer's IAM policy is scoped to this exact name."
  type        = string
  default     = "mfe-pot"
}

variable "kubernetes_version" {
  description = "EKS control-plane version. NOT the local kind pin (v1.27.3, a cgroup-v1 Docker workaround on the dev machine, not a deliberate target) -- check AWS's current supported EKS versions at apply time and pin whatever's current-stable."
  type        = string
  default     = "1.31"
}

variable "vpc_cidr" {
  type    = string
  default = "10.42.0.0/16"
}

variable "availability_zone_count" {
  description = "EKS's hard minimum is 2. No reason to pay for a 3rd on a PoC that gets torn down between demos."
  type        = number
  default     = 2
}

variable "node_instance_types" {
  type    = list(string)
  default = ["t3.medium"]
}

variable "node_capacity_type" {
  description = "ON_DEMAND by default -- an interruption mid-demo is a much worse outcome than SPOT's small savings. Kept as a variable so SPOT stays a one-line opt-in for solo iteration outside an actual demo."
  type        = string
  default     = "ON_DEMAND"
}

variable "node_desired_size" {
  description = "One node per AZ by default."
  type        = number
  default     = 2
}

variable "node_min_size" {
  type    = number
  default = 2
}

variable "node_max_size" {
  description = "Small headroom above desired_size, not autoscaling for load -- this is a demo cluster, not a production workload."
  type        = number
  default     = 3
}

variable "letsencrypt_environment" {
  description = "'staging' while iterating on this Terraform (avoids Let's Encrypt rate limits across repeated destroy/recreate cycles); switch to 'prod' only right before an actual demo."
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["staging", "prod"], var.letsencrypt_environment)
    error_message = "letsencrypt_environment must be \"staging\" or \"prod\"."
  }
}

variable "acme_email" {
  description = "Contact email Let's Encrypt uses for expiry/policy notices."
  type        = string
}
