# GitHub Actions OIDC federation -- no long-lived AWS access keys anywhere.
# One shared role, not 7 per-repo roles: deliberate PoC pragmatism, since all
# 7 mfe-pot-* repos are one trust boundary here. Not appropriate for genuine
# multi-tenancy -- flagged explicitly, not a default to carry into anything
# bigger.

data "aws_caller_identity" "current" {}

# GitHub's OIDC TLS chain has changed before, so fetch the thumbprint live
# rather than hardcoding a literal that can silently go stale.
data "tls_certificate" "github_actions" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github_actions.certificates[0].sha1_fingerprint]
}

data "aws_iam_policy_document" "github_actions_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Scoped to `main` only -- matches exactly when Stage 2 (the deploy-eks CI
    # job) should run, never on a PR build.
    #
    # The classic AWS/GitHub OIDC tutorial pattern is
    # "repo:ORG/REPO:ref:refs/heads/BRANCH" -- that does NOT match what this
    # org's tokens actually carry. Confirmed live by decoding a real token
    # (temporary debug step, since removed): the sub claim embeds numeric
    # owner/repo IDs, e.g.
    # "repo:tn4consulting@79846699/mfe-pot-platform@1319472070:ref:refs/heads/main"
    # -- GitHub's newer repo-rename-hijack-resistant subject format, not
    # documented in most existing AWS/GitHub OIDC tutorials as of when this
    # was written. Wildcards cover both IDs so this survives a repo rename
    # (the numeric repo ID doesn't change, but wildcarding it anyway costs
    # nothing and is one less thing to get wrong).
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_org}@*/${var.github_repo_pattern}@*:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = "mfe-pot-github-actions-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_actions_trust.json
}

data "aws_iam_policy_document" "github_actions_deploy" {
  # ECR: GetAuthorizationToken must be resource "*" -- AWS doesn't support
  # scoping it further.
  statement {
    sid       = "EcrAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid    = "EcrPushPull"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
    ]
    resources = [for repo in aws_ecr_repository.app : repo.arn]
  }

  # Lets each repo's CI check whether the demo cluster currently exists
  # before attempting a deploy (the ephemeral-cluster gating step).
  statement {
    sid       = "EksDescribe"
    effect    = "Allow"
    actions   = ["eks:DescribeCluster"]
    resources = ["arn:aws:eks:${var.aws_region}:${data.aws_caller_identity.current.account_id}:cluster/${var.cluster_name}"]
  }
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  name   = "mfe-pot-github-actions-deploy"
  role   = aws_iam_role.github_actions_deploy.id
  policy = data.aws_iam_policy_document.github_actions_deploy.json
}
