variable "aws_region" {
  description = "AWS region for all foundation resources. Must match bootstrap/'s and cluster/'s region."
  type        = string
  default     = "ca-central-1"
}

variable "domain_name" {
  description = "Domain (or subdomain) the 8 app hostnames live under. A Route 53 public hosted zone is created for exactly this name; delegate it from wherever the parent zone lives."
  type        = string
  default     = "aws.tn4consulting.com"
}

variable "github_org" {
  description = "GitHub org that owns every mfe-pot-* repo. Used to scope the OIDC trust policy."
  type        = string
  default     = "tn4consulting"
}

variable "github_repo_pattern" {
  description = "Wildcard matching every repo the shared CI role should be assumable from. Confirmed via `git remote -v` that all 7 repos (mfe-pot-platform, mfe-pot-msca-shell, mfe-pot-job-bank-shell, mfe-pot-dashboard, mfe-pot-job-bank, mfe-pot-employment-insurance, mfe-pot-life-events) share this prefix."
  type        = string
  default     = "mfe-pot-*"
}

variable "cluster_name" {
  description = "Fixed EKS cluster name -- referenced here (before the cluster exists) to scope the CI role's eks:DescribeCluster permission, and again in cluster/ to actually create it. EKS cluster ARNs are name-based, so this is a stable reference across cluster destroy/recreate cycles."
  type        = string
  default     = "mfe-pot"
}

variable "ecr_repository_names" {
  description = "One ECR repository per image, matching today's local Docker image names exactly. 6 frontends + 3 BFFs + mock-idp + strapi."
  type        = list(string)
  default = [
    "mfe-pot-msca-shell",
    "mfe-pot-job-bank-shell",
    "mfe-pot-dashboard-mfe",
    "mfe-pot-job-bank-mfe",
    "mfe-pot-employment-insurance-mfe",
    "mfe-pot-life-events-mfe",
    "mfe-pot-dashboard-bff",
    "mfe-pot-job-bank-bff",
    "mfe-pot-employment-insurance-bff",
    "mfe-pot-mock-idp",
    "mfe-pot-strapi",
  ]
}

variable "ecr_tagged_image_retention_count" {
  description = "How many most-recent tagged images to keep per repository before expiring older ones."
  type        = number
  default     = 15
}

variable "ecr_untagged_image_expiry_days" {
  description = "How many days to keep untagged images before expiring them."
  type        = number
  default     = 7
}
