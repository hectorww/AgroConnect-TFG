FROM node:20-bullseye AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# API_URL se pasa como build arg desde Railway
ARG API_URL=https://agroconnect-tfg-production.up.railway.app

# Reemplazar en environment.prod.ts (el que usa la build de producción)
RUN sed -i "s|http://localhost:8000|${API_URL}|g" src/environments/environment.prod.ts

RUN npm run build

FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
