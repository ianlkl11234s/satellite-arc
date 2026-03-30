FROM node:22-alpine AS build
WORKDIR /app

# 環境變數（build time 注入）
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# SPA fallback
RUN echo 'server { \
  listen 8080; \
  root /usr/share/nginx/html; \
  location / { \
    try_files $uri $uri/ /index.html; \
  } \
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
    expires 1y; \
    add_header Cache-Control "public, immutable"; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080
