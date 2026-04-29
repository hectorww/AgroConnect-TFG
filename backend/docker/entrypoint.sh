#!/bin/sh
set -e

echo "=== AgroConnect Backend - Iniciando ==="

# ── 1. Restaurar claves JWT desde variables de entorno ──
if [ -n "$JWT_PRIVATE_KEY_B64" ]; then
    echo ">>> Restaurando claves JWT desde variables de entorno..."
    echo "$JWT_PRIVATE_KEY_B64" | base64 -d > /var/www/html/config/jwt/private.pem
    echo "$JWT_PUBLIC_KEY_B64"  | base64 -d > /var/www/html/config/jwt/public.pem
    chmod 600 /var/www/html/config/jwt/private.pem
    echo ">>> Claves JWT restauradas."
fi

# ── 2. Calentar caché ──
echo ">>> Calentando caché de Symfony..."
php bin/console cache:warmup --env=prod --no-debug || true

# ── 3. Ejecutar migraciones ──
# Si la BD está vacía, crea el schema y marca todo como ejecutado
# Si ya tiene tablas, migrate se encarga de aplicar solo las pendientes
echo ">>> Verificando schema de base de datos..."
php bin/console doctrine:migrations:migrate --no-interaction --env=prod || true

echo "=== Arrancando nginx + php-fpm ==="
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
