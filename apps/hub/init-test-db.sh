#!/bin/bash
set -e

# Create test database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE "slates-hub-test";
EOSQL

echo "Test database 'slates-hub-test' created successfully"
