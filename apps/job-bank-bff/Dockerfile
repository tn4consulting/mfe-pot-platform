# syntax=docker/dockerfile:1
#
# Built from the platform repo root -- see apps/job-bank/Dockerfile's
# top comment for the Phase 1 extraction note, which applies identically
# here (job-bank-bff moves into job-bank's own repo, same build context
# story).
#
# This is a single-package Nx "integrated" workspace, not a per-project
# pnpm workspace (no apps/*/package.json exists) -- Nx's `prune`/
# `prune-lockfile` executors expect the latter and fail here
# ("package.json does not exist"). So this copies the full workspace
# node_modules into the runtime stage rather than a pruned subset. That's
# an accepted PoT-scale simplification for now: once job-bank-bff is
# extracted into its own repo with its own trimmed package.json (Phase 1),
# node_modules becomes small automatically, since that repo depends only
# on the pinned @tn4consulting/shared-* packages plus this BFF's own
# runtime deps (express, cors) -- no extra pruning step needed at that point.
FROM node:22-alpine AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json tsconfig.json ./
COPY apps ./apps
COPY libs ./libs
COPY tools ./tools
RUN pnpm install --frozen-lockfile
RUN pnpm exec nx build job-bank-bff --configuration=production

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# The Express server binds process.env.HOST (default 'localhost' in
# main.ts, meant for local dev) -- inside a container that must be
# 0.0.0.0, or the Pod's Service can never reach it despite the process
# looking healthy from inside its own container.
ENV HOST=0.0.0.0
COPY --from=build /workspace/dist/apps/job-bank-bff ./
COPY --from=build /workspace/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "main.js"]
