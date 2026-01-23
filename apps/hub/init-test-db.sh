#!/bin/bash
set -e

# Create databases for CI/local-compose services if they don't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
DO
\$do\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'slates-hub-test') THEN
    CREATE DATABASE "slates-hub-test";
  END IF;
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'slates-registry') THEN
    CREATE DATABASE "slates-registry";
  END IF;
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'forge') THEN
    CREATE DATABASE "forge";
  END IF;
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'function-bay') THEN
    CREATE DATABASE "function-bay";
  END IF;
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'signal') THEN
    CREATE DATABASE "signal";
  END IF;
END
\$do\$;
EOSQL

echo "Database initialization complete"
