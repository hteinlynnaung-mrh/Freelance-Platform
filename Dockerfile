# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS node-base

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# ------------------------------
# API image
# ------------------------------
FROM node-base AS api-deps
WORKDIR /app/api

COPY api/package.json api/package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM api-deps AS api-build
ENV DATABASE_URL=file:/app/api/data/archer.db
COPY api ./
RUN npm run db:generate && npm run build

FROM node-base AS api
WORKDIR /app/api

ENV NODE_ENV=production

COPY --from=api-deps /app/api/node_modules ./node_modules
COPY --from=api-build /app/api/package.json ./package.json
COPY --from=api-build /app/api/dist ./dist
COPY --from=api-build /app/api/generated ./generated
COPY --from=api-build /app/api/prisma ./prisma
COPY --from=api-build /app/api/prisma.config.ts ./prisma.config.ts
COPY --from=api-build /app/api/src ./src

EXPOSE 5001

# The seed uses upserts, so this is safe to run on every container start.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && npm run db:seed && npm start"]

# ------------------------------
# Web image
# ------------------------------
FROM node-base AS web-deps
WORKDIR /app/app

COPY app/package.json app/package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM web-deps AS web-build
ARG VITE_API_URL=http://localhost:5001
ENV VITE_API_URL=${VITE_API_URL}

COPY app ./
RUN npm run build

FROM nginx:1.27-alpine AS web

COPY --from=web-build /app/app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
