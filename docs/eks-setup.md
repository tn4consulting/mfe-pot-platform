# EKS setup: hosting the mfe-pot family on AWS

Cloud analogue of [`local-setup.md`](./local-setup.md) — brings the family
up on a real AWS EKS cluster instead of a local `kind` cluster, for a live
demo. Full design rationale and decisions:
[`../../docs/plans/20260808-1500-mfe-pot-aws-eks-terraform.md`](../../docs/plans/20260808-1500-mfe-pot-aws-eks-terraform.md)
(the `mfe-pot` meta repo, one level up). This doc is the "how do I actually
do it" walkthrough; the Terraform itself has its own, more detailed
reference at [`../infra/terraform/README.md`](../infra/terraform/README.md)
— read that directly for anything below that needs more depth (backend
config, troubleshooting a partial `apply`, etc.).

## Three layers, two lifecycles

```
bootstrap/    one-time, LOCAL state, run by hand once
foundation/   persistent — essentially never destroyed (ECR, Route 53, GitHub OIDC)
cluster/      ephemeral — apply before a demo, destroy after (VPC, EKS, node group, ingress-nginx/external-dns/cert-manager)
```

Never run `terraform destroy` in `foundation/` as part of a normal demo
cycle — only `cluster/`. All three live in this repo, under
`infra/terraform/`.

## Prerequisites

- Terraform ≥ 1.10.
- AWS CLI v2, with **working** credentials — `aws sts get-caller-identity`
  must succeed before doing anything below.
- `kubectl`, `helm` — for verification and troubleshooting after `cluster/`
  is applied.
- `gh` CLI, authenticated with a token that can trigger workflow runs on
  every `tn4consulting/mfe-pot-*` repo — needed for the final
  all-repos-deploy step.
- The `mfe-pot` meta repo and all 6 app repos cloned as siblings (same
  layout `local-setup.md` uses) — `tools/deploy-eks.sh` in the meta repo
  runs from that parent directory.

## First-time setup (run once, ever)

```sh
cd infra/terraform/bootstrap
terraform init
terraform apply
# note the state_bucket_name output; if you didn't override the default
# ("mfe-pot-terraform-state"), every other layer's backend.tf already matches it.
```

## Foundation (apply once, leave running)

```sh
cd infra/terraform/foundation
cp terraform.tfvars.example terraform.tfvars   # adjust if needed
terraform init
terraform plan
terraform apply
```

Then, **manually**, add the `route53_name_servers` output as NS records
wherever `tn4consulting.com`'s parent zone actually lives, and confirm
delegation propagated with `dig NS aws.tn4consulting.com`.

Finally, set these as **org-level** GitHub Actions variables under
`tn4consulting` (not per-repo — every `mfe-pot-*` repo's `deploy-eks` CI job
reads the same three):
- `AWS_GITHUB_ACTIONS_ROLE_ARN` = the `github_actions_deploy_role_arn` output
- `AWS_REGION` = `ca-central-1`
- `EKS_CLUSTER_NAME` = `mfe-pot`

**Renaming an app repo/image needs a `terraform apply` here**, or CI
silently loses ECR push access — see `../CLAUDE.md`'s "Hosting: Kubernetes +
Helm" section for the real incident this caused.

## Cluster (apply before a demo, destroy after)

**Convenience scripts** (from this repo's root): `pnpm eks:up` / `pnpm
eks:down` wrap the `terraform plan`/`apply`/`destroy` cycle below with a
preflight check (AWS credentials, foundation already applied) and a
confirmation prompt before spending real money (`-y`/`--yes` to skip it for
scripted use). Real AWS costs start accruing the moment `eks:up` succeeds —
roughly $0.23–0.25/hr all-in (EKS control plane + NAT gateway + 2 nodes).

Manual steps, if you want more control:

```sh
cd infra/terraform/cluster
cp terraform.tfvars.example terraform.tfvars   # set acme_email at minimum
terraform init
terraform plan
terraform apply
```

If the very first `apply` against a brand-new cluster fails on a
`helm_release`/`kubectl_manifest` because the API server wasn't reachable
the instant EKS reported `ACTIVE`, just re-run `terraform apply` —
idempotent, cheap, not a design flaw.

Verify:

```sh
aws eks update-kubeconfig --name mfe-pot --region ca-central-1
kubectl get nodes                          # both Ready
kubectl get pods -A                        # all Running
kubectl get svc -n ingress-nginx ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'   # an NLB hostname
```

## Deploying every app

`deploy-eks` CI jobs only fire on a `push` to `main`, so the moment
`terraform apply` above brings up a **new** cluster, nothing deploys to it
on its own — there's no push to react to.

**First time only**: land the per-app-repo changes (`values-eks.yaml`,
Ingress TLS block, `deploy-eks` CI job — see the design doc) starting with
`mfe-pot-job-bank-mfe`, merge to `main`, and watch its `deploy-eks` job
actually deploy. Once that one repo proves the whole path end to end (image
→ ECR → Helm → Ingress → external-dns → cert-manager → a real HTTPS
response), repeat for the rest.

**Every time after** (a fresh cluster, or re-syncing an existing one): run
`tools/deploy-eks.sh` from the `mfe-pot` meta repo directory:

```sh
cd ../mfe-pot   # the meta repo, parent of all sibling checkouts
tools/deploy-eks.sh
```

This is the AWS equivalent of the meta repo's `tools/deploy-local.sh`, but
it doesn't build or deploy anything itself — each repo's own `deploy-eks` CI
job (GitHub Actions, via GitHub OIDC) does the actual build+push+helm-upgrade
work. This script's job is:
1. Preflight (`gh`/AWS credentials, cluster exists, all 7 sibling repos
   present).
2. Point `kubectl`/`helm` at the cluster.
3. Install the platform's shared infra with no CI job of its own —
   `session-cache`, `unleash`, and the OpenTelemetry stack
   (`otel-collector`, `tempo`, `kube-state-metrics`, `prometheus`,
   `grafana`) — since these are all bare upstream images with nothing to
   build.
4. Trigger each app repo's `deploy-eks` workflow via `workflow_dispatch`, in
   dependency order, and wait for each to finish.

It's a **redeploy, not a rebuild** by default: every repo's
`workflow_dispatch` defaults to `skip_build=true`, deploying whatever image
that commit's own push-triggered CI run already published — it does not
recompile from source. Run `tools/build-all.sh` first (from the meta repo)
if you need a fresh build of current `main` HEAD, e.g. to pre-warm the image
registry before a demo.

## Tearing down after a demo

```sh
cd infra/terraform/cluster
terraform destroy
```

If `destroy` fails partway with a `DependencyViolation` on a subnet or
security group, that's AWS's own ELB/ENI cleanup lagging a minute or two
behind the Kubernetes Service delete — just re-run `terraform destroy`, it's
idempotent (or use `pnpm eks:down`, same wrapper as `eks:up`).

Do **not** run `terraform destroy` in `foundation/` — that deletes your ECR
images, the Route 53 zone (breaking DNS delegation), and the GitHub OIDC
trust relationship every repo's CI depends on.

## Known limitation: don't blanket-scale replicas

A real capacity lesson from 2026-08-09: scaling several stateless services
to `replicaCount: 2` at once immediately exhausted the real 2-node
`t3.medium` cluster's pod capacity (an AWS VPC CNI ENI/IP allocation limit,
17 pods/node — not CPU/memory). Every chart's rolling-update/anti-affinity/
PDB mechanism stays in place (harmless at `replicaCount: 1`), but scaling
back up needs either a bigger node group or a narrower, deliberately-chosen
subset of services — see `../CLAUDE.md`'s "Design principles" section for
the full incident.
