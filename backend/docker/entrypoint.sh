#!/bin/sh
set -e

echo "=== AgroConnect Backend - Iniciando ==="

# ── 1. Restaurar claves JWT ──
if [ -n "$JWT_PRIVATE_KEY_B64" ]; then
    echo ">>> Restaurando claves JWT desde variables de entorno..."
    mkdir -p /var/www/html/config/jwt
    echo "$JWT_PRIVATE_KEY_B64" | base64 -d > /var/www/html/config/jwt/private.pem
    echo "$JWT_PUBLIC_KEY_B64"  | base64 -d > /var/www/html/config/jwt/public.pem
    chmod 644 /var/www/html/config/jwt/private.pem
    chmod 644 /var/www/html/config/jwt/public.pem
    echo ">>> Claves JWT restauradas."
    # Verificar que los archivos existen y tienen contenido
    echo ">>> Verificando claves..."
    ls -la /var/www/html/config/jwt/
    head -1 /var/www/html/config/jwt/private.pem
fi

# ── 2. Calentar caché ──
echo ">>> Calentando caché de Symfony..."
php bin/console cache:warmup --env=prod --no-debug || true

# ── 3. Ejecutar migraciones ──
echo ">>> Verificando schema de base de datos..."
php bin/console doctrine:migrations:migrate --no-interaction --env=prod || true

echo "=== Arrancando nginx + php-fpm ==="
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
