FROM node:24.19.0-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm ci

COPY tsconfig.base.json vitest.config.ts ./
COPY apps ./apps
COPY packages ./packages
RUN npm run build

FROM node:24.19.0-bookworm-slim AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    DATABASE_PATH=/data/pr0gbarz.sqlite
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/web/dist apps/web/dist
COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY --from=build /app/packages/database/dist packages/database/dist
COPY --from=build /app/packages/database/drizzle packages/database/drizzle
COPY --from=build /app/packages/ui/dist packages/ui/dist

RUN mkdir /data && chown node:node /data
USER node
EXPOSE 8080
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:8080/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node", "apps/api/dist/server.js"]
