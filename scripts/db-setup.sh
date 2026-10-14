#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-coffeeconnect}"
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_ROOT_USER="${MYSQL_ROOT_USER:-root}"

if [ -z "${DATABASE_URL:-}" ]; then
  if [ -n "${MYSQL_ROOT_PASSWORD:-}" ]; then
    export DATABASE_URL="mysql://${MYSQL_ROOT_USER}:${MYSQL_ROOT_PASSWORD}@${MYSQL_HOST}:${MYSQL_PORT}/${DB_NAME}"
  else
    export DATABASE_URL="mysql://${MYSQL_ROOT_USER}@${MYSQL_HOST}:${MYSQL_PORT}/${DB_NAME}"
  fi
fi

if [ -n "${MYSQL_ROOT_PASSWORD:-}" ]; then
  mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASSWORD" \
    -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
else
  mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_ROOT_USER" \
    -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
fi

echo "Using DATABASE_URL for ${DB_NAME} on ${MYSQL_HOST}:${MYSQL_PORT}"

npm run prisma:generate -w packages/db

if npm run prisma:migrate -w packages/db; then
  echo "Applied Prisma migrations successfully."
else
  echo "prisma:migrate failed (likely due to migration history assumptions on a fresh DB)."
  echo "Falling back to prisma db push for local onboarding..."
  npm exec -w packages/db prisma db push
fi

echo "MySQL + Prisma setup complete for database: $DB_NAME"
