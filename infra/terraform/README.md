# mfe-pot AWS EKS infrastructure

Terraform for hosting the mfe-pot family on AWS EKS in `ca-central-1`. Full
design rationale, decisions, and the per-app-repo changes this depends on live
in `mfe-pot/docs/plans/20260808-1500-mfe-pot-aws-eks-terraform.md` (the meta
repo, one level up from this one) — read that first if anything here is
unclear on *why*, not just *what*.

## Three layers, two lifecycles

```
bootstrap/    one-time, LOCAL state, run by hand once
foundation/   persistent — essentially never destroyed
cluster/      ephemeral — apply before a demo, destroy after
```

`foundation/` holds the stuff that's expensive to lose or slow to re-create
(ECR images, the Route 53 zone, the GitHub OIDC trust relationship).
`cluster/` holds the stuff you actually want to tear down between demos (the
VPC, the EKS cluster itself, node group, ingress-nginx/external-dns/cert-manager).
Never run `terraform destroy` in `foundation/` as part of a normal demo cycle —
only `cluster/`.

## Prerequisites

- Terraform ≥ 1.10 (`terraform version` — 1.15.8 confirmed installed locally).
- AWS CLI v2, with **working** credentials: `aws sts get-caller-identity` must
  succeed before doing anything below. (At time of writing this fails in the
  dev environment this was authored in — fix that first.)
- `kubectl`, `helm` (for troubleshooting after `cluster/` is applied).

## First-time setup (run once, ever)

```sh
cd bootstrap
terraform init
terraform apply
# note the state_bucket_name output; if you didn't override the default
# ("mfe-pot-terraform-state"), every other layer's backend.tf already matches it.
```

If you *do* override `state_bucket_name`, update the literal `bucket = "..."`
in both `foundation/backend.tf` and `cluster/backend.tf` — backend blocks
can't reference variables.

## Foundation (apply once, leave running)

```sh
cd foundation
cp terraform.tfvars.example terraform.tfvars   # adjust if needed
terraform init
terraform plan
terraform apply
```

Then, **manually**, add the `route53_name_servers` output as NS records
wherever `tn4consulting.com`'s parent zone actually lives. Confirm delegation
propagated with `dig NS aws.tn4consulting.com`.

Finally, set these as **org-level** GitHub Actions variables under
`tn4consulting` (not per-repo — every mfe-pot-* repo's `deploy-eks` CI job
reads the same three):
- `AWS_GITHUB_ACTIONS_ROLE_ARN` = the `github_actions_deploy_role_arn` output
- `AWS_REGION` = `ca-central-1`
- `EKS_CLUSTER_NAME` = `mfe-pot`

## Cluster (apply before a demo, destroy after)

**Convenience scripts** (from `mfe-pot-platform`'s repo root): `pnpm eks:up` /
`pnpm eks:down` wrap the `terraform plan`/`apply`/`destroy` cycle below with a
preflight check (AWS credentials, foundation already applied) and a
confirmation prompt before spending real money (`-y`/`--yes` to skip it for
scripted use). Manual steps, if you want more control:

```sh
cd cluster
cp terraform.tfvars.example terraform.tfvars   # set acme_email at minimum
terraform init
terraform plan
terraform apply
```

If the very first `apply` against a brand-new cluster fails on a
`helm_release`/`kubectl_manifest` because the API server wasn't reachable the
instant EKS reported `ACTIVE`, just re-run `terraform apply` — idempotent,
cheap, not a design flaw.

Verify:

```sh
aws eks update-kubeconfig --name mfe-pot --region ca-central-1
kubectl get nodes                          # both Ready
kubectl get pods -A                        # all Running
kubectl get svc -n ingress-nginx ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'   # an NLB hostname
```

Then land the per-app-repo changes (`values-eks.yaml`, Ingress TLS block,
`deploy-eks` CI job — see the design doc) starting with `mfe-pot-job-bank-mfe`,
merge to `main`, and watch its `deploy-eks` job actually deploy. Once that one
repo proves the whole path end to end (image → ECR → Helm → Ingress →
external-dns → cert-manager → a real HTTPS response), repeat for the rest.

Once everything's deployed once, use `mfe-pot/tools/deploy-eks.sh` to
re-trigger all 8 repos' CI on an already-provisioned cluster (needed because
`deploy-eks` only fires on a `push`, and nothing pushes the moment a fresh
cluster comes up).

### Tearing down after a demo

```sh
cd cluster
terraform destroy
```

`helm_release.ingress_nginx` (and the real AWS NLB it owns) is destroyed
before the node group/VPC automatically — see the comment in
`helm-ingress-nginx.tf` for why no explicit `depends_on` is needed. If
`destroy` fails partway with a `DependencyViolation` on a subnet or security
group, that's AWS's own ELB/ENI cleanup lagging a minute or two behind the
Kubernetes Service delete — just re-run `terraform destroy`, it's idempotent.

Do **not** run `terraform destroy` in `foundation/` — that would delete your
ECR images, the Route 53 zone (breaking DNS delegation), and the GitHub OIDC
trust relationship every repo's CI depends on.
