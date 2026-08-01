# syntax=docker/dockerfile:1
#
# Built from the platform repo root (this validation build predates the
# Phase 1 extraction described in docs/plans/20260801-1935-mfe-pot-polyrepo-split-and-k8s-hosting.md --
# once job-bank moves to its own repo, this Dockerfile travels with it and
# the build context becomes that repo's own root instead of the monorepo).
#
# One image, built once, promoted across environments unchanged -- see
# CLAUDE.md's Hosting section. Environment-specific values are injected at
# container startup via MFE_POT_ENV_JSON (see tools/docker/frontend-entrypoint.sh),
# never baked in at build time.

FROM node:22-alpine AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json tsconfig.json ./
COPY apps ./apps
COPY libs ./libs
COPY tools ./tools
RUN pnpm install --frozen-lockfile
RUN pnpm exec nx build job-bank --configuration=production

FROM nginx:alpine AS runtime
COPY tools/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY tools/docker/frontend-entrypoint.sh /docker-entrypoint.d/40-mfe-pot-env.sh
RUN chmod +x /docker-entrypoint.d/40-mfe-pot-env.sh
COPY --from=build /workspace/dist/apps/job-bank/browser /usr/share/nginx/html
EXPOSE 80
