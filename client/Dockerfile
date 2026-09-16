FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_BACKEND_HTTP_URL=http://localhost:5455
ARG VITE_BACKEND_WS_URL=ws://localhost:5455/ws
ARG VITE_AUTH_BACKEND_HTTP_URL=http://localhost:4000
RUN npm run build


FROM nginx:alpine

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY --from=builder /app/dist .

COPY nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health.html || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
