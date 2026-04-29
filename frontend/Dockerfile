FROM node:20-bullseye AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG API_URL=https://your-backend.up.railway.app
RUN sed -i "s|http://localhost:8000|${API_URL}|g" src/environments/environment.ts

RUN npm run build

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
