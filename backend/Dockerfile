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

# COMPOSER_ALLOW_SUPERUSER evita warnings de root
ENV COMPOSER_ALLOW_SUPERUSER=1

# --no-scripts evita el fallo de symfony-cmd (no existe en Alpine)
# dump-autoload por separado genera autoload_runtime.php correctamente
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts \
    && composer dump-autoload --optimize --no-dev --no-scripts

# Copiar el resto del código
COPY . .

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
