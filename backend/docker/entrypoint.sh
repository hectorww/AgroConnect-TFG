#!/bin/sh
set -e

echo "=== AgroConnect Backend - Iniciando ==="

# ── 1. Generar claves JWT si no existen (Railway las inyecta como env vars) ──
if [ -n "$JWT_PRIVATE_KEY_B64" ] && [ -n "$JWT_PUBLIC_KEY_B64" ]; then
    echo ">>> Restaurando claves JWT desde variables de entorno..."
    mkdir -p /var/www/html/config/jwt
    echo "$JWT_PRIVATE_KEY_B64" | base64 -d > /var/www/html/config/jwt/private.pem
    echo "$JWT_PUBLIC_KEY_B64"  | base64 -d > /var/www/html/config/jwt/public.pem
    chmod 600 /var/www/html/config/jwt/private.pem
    chmod 644 /var/www/html/config/jwt/public.pem
    echo ">>> Claves JWT restauradas."
else
    echo ">>> ADVERTENCIA: JWT_PRIVATE_KEY_B64 o JWT_PUBLIC_KEY_B64 no están definidas. Las claves JWT no serán configuradas."
fi

# ── 2. Limpiar y calentar caché en modo prod ──
echo ">>> Calentando caché de Symfony..."
php bin/console cache:warmup --env=prod --no-debug || true

# ── 3. Ejecutar migraciones de base de datos ──
echo ">>> Ejecutando migraciones..."
php bin/console doctrine:migrations:migrate --no-interaction --env=prod || true

echo "=== Arrancando nginx + php-fpm ==="
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
