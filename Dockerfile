# syntax=docker/dockerfile:1
# Multi-stage build for the self-hosted Cut image (ghcr.io/mendylanda/cut),
# consumed by the Coolify and Dokploy one-click templates. Produces a minimal
# Next.js standalone server that listens on $PORT and reads REDIS_URL +
# ADMIN_PASSWORD from the environment.

ARG NODE_VERSION=22-alpine

# 1. Install dependencies (cached on lockfile changes only).
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
# strict-dep-builds=false: don't fail on (or run) ignored native build scripts
# like sharp/esbuild/workerd — none are needed for the standalone server.
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --config.strict-dep-builds=false

# 2. Build the standalone server.
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN corepack enable
ENV NEXT_OUTPUT_STANDALONE=1
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# 3. Minimal runtime image — just the standalone output, static assets, public/.
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as the unprivileged user that ships with the node image.
RUN chown node:node /app
USER node

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
