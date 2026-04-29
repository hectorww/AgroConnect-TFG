# ── Stage 1: Build Angular ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos primero (mejor cache de capas)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copiar el resto del fuente
COPY . .

# Build de producción - usa la variable de entorno para la API URL
ARG API_URL=https://your-backend.up.railway.app
RUN sed -i "s|http://localhost:8000|${API_URL}|g" src/environments/environment.ts
RUN npm run build

# ── Stage 2: Servir con nginx ────────────────────────────────────────
FROM nginx:alpine

# Quitar config por defecto
RUN rm /etc/nginx/conf.d/default.conf

# Copiar nuestra config para SPA
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el build de Angular
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
