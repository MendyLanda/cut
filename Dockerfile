# syntax=docker/dockerfile:1
# Multi-stage build for the self-hosted Cut image (ghcr.io/mendylanda/cut),
# consumed by the Coolify and Dokploy one-click templates. Produces a minimal
# Hono server (esbuild bundle) that listens on $PORT and reads REDIS_URL +
# ADMIN_PASSWORD from the environment.

ARG NODE_VERSION=22-alpine

# 1. Install, build the CSS + bundled server, then drop dev dependencies. Install
#    and build share one stage so esbuild's native binary (set up by its install
#    script) and pnpm's bin shims stay consistent.
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
RUN pnpm prune --prod

# 2. Minimal runtime image — bundled server, prod node_modules, public/ assets.
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as the unprivileged user that ships with the node image.
RUN chown node:node /app
USER node

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/public ./public

EXPOSE 3000
CMD ["node", "dist/server.mjs"]
