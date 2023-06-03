# Dockerfile for GitHub Action CI

FROM node:18.14.2-alpine3.17 as builder

WORKDIR /app

# pnpm setup 在 alpine 中不成功，不能安装全局的 quasar/cli
# 所以 npm 和 pnpm 混着用一下。

RUN npm install -g pnpm@7.29.0 && \
    npm install -g @quasar/cli

# pnpm fetch does require only lockfile
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .

# docker build --build-arg defaultDriverWsAddr='ws://localhost:9001/live2d'
ARG defaultDriverWsAddr
ENV DEFAULT_DRIVER_WS_ADDR=$defaultDriverWsAddr

RUN npx quasar build

# runtime
FROM nginx:1.23.3-alpine-slim

COPY --from=builder /app/dist/spa /usr/share/nginx/html
# COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# nginx 不用 entrypoint
# ENTRYPOINT ["cat", "/etc/nginx/conf.d/default.conf"]
