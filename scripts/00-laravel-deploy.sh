#!/usr/bin/env bash
echo "Installing dependencies..."
composer install --no-dev --working-dir=/var/www/html --optimize-autoloader

echo "Caching config & routes..."
php artisan config:cache
php artisan route:cache

echo "Running migrations..."
php artisan migrate --force