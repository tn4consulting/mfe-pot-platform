terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.14"
    }
    kubectl = {
      source  = "alekc/kubectl"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "mfe-pot"
      ManagedBy = "terraform"
      Layer     = "cluster"
    }
  }
}

# All three of kubernetes/helm/kubectl authenticate via the `exec`-plugin
# pattern (`aws eks get-token`) against the EKS module's own endpoint/CA
# outputs, rather than a static token -- this is what lets Terraform's
# dependency graph correctly sequence every helm_release/kubectl_manifest
# after the cluster genuinely exists. The very first `apply` against a
# brand-new cluster occasionally needs one re-run if the API server isn't
# reachable the instant EKS reports ACTIVE -- idempotent and cheap, not a
# design flaw.

locals {
  exec_auth = {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", var.cluster_name, "--region", var.aws_region]
  }
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = local.exec_auth.api_version
    command     = local.exec_auth.command
    args        = local.exec_auth.args
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

    exec {
      api_version = local.exec_auth.api_version
      command     = local.exec_auth.command
      args        = local.exec_auth.args
    }
  }
}

provider "kubectl" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  load_config_file       = false

  exec {
    api_version = local.exec_auth.api_version
    command     = local.exec_auth.command
    args        = local.exec_auth.args
  }
}
