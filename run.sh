#!/usr/bin/env bash
set -e

echo "========================================================================="
echo "        PERFORMANCE MANAGEMENT SYSTEM (PMS) - UNIFIED RUNNER"
echo "========================================================================="
echo ""

if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed or not in PATH."
    exit 1
fi

echo "[1/2] Building and starting all microservices & containers..."
docker compose up --build -d

echo ""
echo "========================================================================="
echo "SUCCESS! All services are running."
echo "========================================================================="
echo " * Frontend UI          : http://localhost"
echo " * Backend API          : http://localhost:8081"
echo " * Swagger API Docs     : http://localhost:8081/swagger-ui/index.html"
echo " * PgAdmin Database UI  : http://localhost:5050 (admin@admin.com / admin)"
echo "========================================================================="
