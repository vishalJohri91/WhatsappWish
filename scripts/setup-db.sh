#!/usr/bin/env bash
#
# One-time database setup for WhatsApp Wish using the Homebrew PostgreSQL 16.
# Run this in your OWN terminal (not inside a sandbox) AFTER the server is running.
#
#   brew services start postgresql@16   # start the server (restarts at login)
#   ./scripts/setup-db.sh               # then run this
#
# Creates a "whatsappwish" role and a "whatsappwish" database owned by it,
# matching the defaults in src/main/resources/application.yml. Idempotent.

set -euo pipefail

PGBIN="/opt/homebrew/opt/postgresql@16/bin"

if [ ! -x "$PGBIN/psql" ]; then
  echo "ERROR: psql not found at $PGBIN. Is postgresql@16 installed? (brew install postgresql@16)" >&2
  exit 1
fi

if ! "$PGBIN/pg_isready" -q; then
  echo "ERROR: PostgreSQL is not accepting connections." >&2
  echo "Start it first with:  brew services start postgresql@16" >&2
  exit 1
fi

# Create the login role if it doesn't exist.
if ! "$PGBIN/psql" -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='whatsappwish'" | grep -q 1; then
  "$PGBIN/psql" -d postgres -c "CREATE ROLE whatsappwish LOGIN PASSWORD 'whatsappwish';"
  echo "Created role 'whatsappwish'."
else
  echo "Role 'whatsappwish' already exists."
fi

# Create the database owned by that role if it doesn't exist.
if ! "$PGBIN/psql" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='whatsappwish'" | grep -q 1; then
  "$PGBIN/createdb" -O whatsappwish whatsappwish
  echo "Created database 'whatsappwish'."
else
  echo "Database 'whatsappwish' already exists."
fi

echo "✅ Database ready. Start the backend with:  mvn spring-boot:run"
