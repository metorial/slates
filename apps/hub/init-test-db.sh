#!/bin/bash
set -e

# Create databases for CI/local-compose services if they don't exist
dbs=("slates-hub-test" "slates-registry" "forge" "function-bay" "signal")
for db in "${dbs[@]}"; do
  exists=$(psql -tAc "SELECT 1 FROM pg_database WHERE datname='${db}'" \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB")
  if [ "$exists" != "1" ]; then
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
      -c "CREATE DATABASE \"${db}\";"
  fi
done

echo "Database initialization complete"
