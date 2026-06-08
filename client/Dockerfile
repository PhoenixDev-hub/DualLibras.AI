FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --no-optional

COPY . .

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
