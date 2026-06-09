# ---- Build stage ----
FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Upgrade npm to match packageManager field in package.json
RUN npm install -g npm@11.3.0

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build -- --configuration=production

# ---- Serve with nginx ----
FROM nginx:alpine

# SPA routing + API proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Angular SSR build outputs browser HTML as index.csr.html — rename for nginx
COPY --from=build /usr/src/app/dist/7hive/browser /usr/share/nginx/html
RUN [ -f /usr/share/nginx/html/index.csr.html ] && mv /usr/share/nginx/html/index.csr.html /usr/share/nginx/html/index.html || true

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]