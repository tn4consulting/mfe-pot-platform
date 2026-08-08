module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = var.kubernetes_version

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Access Entries only -- the modern replacement for hand-editing the
  # aws-auth ConfigMap.
  authentication_mode = "API"

  # Public endpoint left open (0.0.0.0/0): GitHub-hosted Actions runners have
  # no stable IP range to allowlist, and this is a PoC, not a hardened
  # environment. Revisit if this cluster ever holds anything real.
  cluster_endpoint_public_access = true

  # The identity running `terraform apply` (you) also gets a cluster-admin
  # access entry automatically -- needed for kubectl/helm troubleshooting
  # without a separate access-entry resource.
  enable_cluster_creator_admin_permissions = true

  cluster_addons = {
    vpc-cni    = { most_recent = true }
    coredns    = { most_recent = true }
    kube-proxy = { most_recent = true }
  }

  eks_managed_node_groups = {
    default = {
      instance_types = var.node_instance_types
      capacity_type  = var.node_capacity_type

      min_size     = var.node_min_size
      max_size     = var.node_max_size
      desired_size = var.node_desired_size
    }
  }

  # The module's own default node-security-group rules only cover its known
  # internal needs (kubelet, coredns, webhooks, and node-initiated ephemeral
  # 1025-65535 return traffic) -- NOT arbitrary pod-to-pod traffic on
  # container ports below 1024. Confirmed live: ingress-nginx (on one node)
  # timed out reaching a frontend pod's port 80 on a different node, while
  # the same request to a BFF on port 3001 (inside the ephemeral range)
  # worked -- exactly the gap this rule closes. Standard requirement for any
  # real multi-node EKS + VPC CNI setup, not optional hardening.
  node_security_group_additional_rules = {
    ingress_self_all = {
      description = "Node to node all ports/protocols (pods are directly routable VPC IPs, not just the modules own known-port needs)"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      self        = true
    }
  }

  # Grants the foundation-layer GitHub Actions CI role real Kubernetes RBAC
  # permission (via the AWS-managed cluster-admin policy) to `helm upgrade`
  # against this cluster -- the mechanism that replaces aws-auth entirely.
  # Cluster-admin is pragmatic for a single-trusted-team PoC; a
  # namespace-scoped policy is the least-privilege follow-up, not built here.
  access_entries = {
    github_actions = {
      principal_arn = data.terraform_remote_state.foundation.outputs.github_actions_deploy_role_arn

      policy_associations = {
        cluster_admin = {
          policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = {
            type = "cluster"
          }
        }
      }
    }
  }
}
