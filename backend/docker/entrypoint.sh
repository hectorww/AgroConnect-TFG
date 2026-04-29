#!/bin/sh
set -e

echo "=== AgroConnect Backend - Iniciando ==="

# ── 1. Generar claves JWT si no existen ──
if [ -n "$JWT_PRIVATE_KEY_B64" ]; then
    echo ">>> Restaurando claves JWT desde variables de entorno..."
    echo "$JWT_PRIVATE_KEY_B64" | base64 -d > /var/www/html/config/jwt/private.pem
    echo "$JWT_PUBLIC_KEY_B64"  | base64 -d > /var/www/html/config/jwt/public.pem
    chmod 600 /var/www/html/config/jwt/private.pem
    echo ">>> Claves JWT restauradas."
fi

# ── 2. Ejecutar migraciones PRIMERO ──
echo ">>> Ejecutando migraciones..."
php bin/console doctrine:migrations:migrate --no-interaction --env=prod

# ── 3. Limpiar y calentar caché DESPUÉS ──
echo ">>> Calentando caché de Symfony..."
php bin/console cache:warmup --env=prod --no-debug

echo "=== Arrancando nginx + php-fpm ==="
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
