# syntax=docker/dockerfile:1
#
# Same shape as apps/mock-idp/Dockerfile -- see that one for the fuller
# story on the fixes baked in here (npm auth secret mount, full workspace
# node_modules since this is a single-package Nx workspace, not a
# per-project pnpm workspace). Built from this repo's own root since
# aws-cost-exporter has no @tn4consulting/* dependency of its own but
# `pnpm install` still resolves the whole workspace's lockfile in one shot.
FROM node:22-alpine AS build
WORKDIR /workspace
ENV CI=true
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json tsconfig.json .npmrc ./
RUN --mount=type=secret,id=npm_token \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    NODE_AUTH_TOKEN="$(cat /run/secrets/npm_token)" pnpm install --frozen-lockfile --network-concurrency=4
COPY apps ./apps
COPY libs ./libs
COPY tools ./tools
RUN pnpm exec nx build aws-cost-exporter --configuration=production

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# See apps/mock-idp/Dockerfile's identical ENV HOST=0.0.0.0 comment -- a
# container-internal 'localhost' default would make the Pod's Service
# unreachable despite the process looking healthy from inside its own
# container.
ENV HOST=0.0.0.0
COPY --from=build /workspace/dist/apps/aws-cost-exporter ./
COPY --from=build /workspace/node_modules ./node_modules
EXPOSE 3006
CMD ["node", "main.js"]
