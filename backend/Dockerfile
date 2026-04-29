FROM php:8.2-fpm-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    git \
    unzip \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    openssl

# Instalar extensiones PHP
RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    zip \
    intl \
    mbstring \
    opcache

# Instalar Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copiar composer.json y composer.lock primero (cache de capas Docker)
COPY composer.json composer.lock ./

# Instalar dependencias PHP (sin dev, modo prod)
# SIN --no-scripts para que Symfony pueda generar autoload_runtime.php
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copiar el resto del código
COPY . .

# Asegurar que el autoloader está actualizado con todo el código
RUN composer dump-autoload --optimize --no-dev

# Crear directorios necesarios con permisos correctos
RUN mkdir -p var/cache var/log config/jwt \
    && chmod -R 777 var/

# Configurar nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Configurar supervisor (para correr nginx + php-fpm juntos)
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Script de arranque
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

CMD ["/entrypoint.sh"]
