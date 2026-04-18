#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  DATABASE_URL="file:/app/data/jscalendar-tasks.db"
  export DATABASE_URL
fi

if [ -z "${ATTACHMENTS_DIR:-}" ]; then
  ATTACHMENTS_DIR="/app/data/attachments"
  export ATTACHMENTS_DIR
fi

mkdir -p "$ATTACHMENTS_DIR"

case "$DATABASE_URL" in
  file:*)
    db_path="${DATABASE_URL#file:}"
    case "$db_path" in
      /*) ;;
      *) db_path="/app/$db_path" ;;
    esac
    mkdir -p "$(dirname "$db_path")"
    ;;
esac

/app/node_modules/.bin/prisma migrate deploy --schema=/app/prisma/schema.prisma

exec "$@"
