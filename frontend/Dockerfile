# ── Stage 1: Build Angular ──────────────────────────────────────────
FROM node:20-bullseye AS builder

WORKDIR /app

# Copiar solo dependencias
COPY package*.json ./

RUN npm install --platform=linux --arch=x64

# Copiar el resto del código
COPY . .

# Reemplazar API antes del build
ARG API_URL=https://your-backend.up.railway.app
RUN sed -i "s|http://localhost:8000|${API_URL}|g" src/environments/environment.ts

# Build
RUN npm run build

# ── Stage 2: Servir con nginx ────────────────────────────────────────
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]