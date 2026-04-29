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

# Copiar código del proyecto
COPY . .

# Instalar dependencias PHP (sin dev, modo prod)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Crear directorios necesarios con permisos correctos
# config/jwt/ is created here so the entrypoint can write the PEM files
# decoded from JWT_PRIVATE_KEY_B64 / JWT_PUBLIC_KEY_B64 at container start
RUN mkdir -p var/cache var/log config/jwt \
    && chmod -R 777 var/ \
    && chmod 755 config/jwt

# Configurar nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Configurar supervisor (para correr nginx + php-fpm juntos)
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Script de arranque
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

CMD ["/entrypoint.sh"]
