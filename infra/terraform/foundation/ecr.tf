# One ECR repository per image. Deliberately NOT including the two Helm
# library charts (mfe-frontend-lib/mfe-backend-lib) as OCI repos here -- the
# existing sibling-checkout `file://` Chart.yaml dependency already works
# unchanged in a GitHub Actions runner (same trick Stage 1's kind-validation
# job already uses), so nothing about reaching EKS blocks on it. Standing
# follow-up, not built in this pass.

resource "aws_ecr_repository" "app" {
  for_each = toset(var.ecr_repository_names)

  name                 = each.value
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "app" {
  for_each = aws_ecr_repository.app

  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images after ${var.ecr_untagged_image_expiry_days} days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = var.ecr_untagged_image_expiry_days
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Keep only the most recent ${var.ecr_tagged_image_retention_count} tagged images"
        selection = {
          tagStatus      = "tagged"
          tagPatternList = ["*"]
          countType      = "imageCountMoreThan"
          countNumber    = var.ecr_tagged_image_retention_count
        }
        action = { type = "expire" }
      },
    ]
  })
}
