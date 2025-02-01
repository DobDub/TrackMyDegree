#!/bin/bash

sleep 15

psql -U sa -d master -f /docker-entrypoint-initdb.d/init.sql

# Optionally, run any verification or additional scripts
# /wait-for-it.sh postgres:5432 --timeout=30 --strict -- echo "PostgreSQL is still available"
