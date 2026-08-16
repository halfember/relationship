# ---- Build Stage ----
FROM docker.m.daocloud.io/library/node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

RUN npx prisma generate
RUN npm run build

# ---- Production Stage ----
FROM docker.m.daocloud.io/library/node:20-alpine

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata curl openssl && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

# 只复制生产依赖
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY prisma ./prisma

# 安全：非 root 用户
RUN addgroup -g 1001 app && adduser -D -u 1001 -G app app && \
    mkdir -p /app/data/uploads && chown -R app:app /app/data
USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && exec node dist/main"]
