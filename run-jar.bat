@echo off
TITLE PMS - Run Spring Boot JAR File
COLOR 0B
CLS

ECHO =========================================================================
ECHO              RUNNING PMS SPRING BOOT BACKEND (JAR FILE)
ECHO =========================================================================
ECHO.

ECHO [1/3] Starting Database Container (PostgreSQL)...
docker compose up -d postgres

IF NOT EXIST "%CD%\backend\target\pms-1.0.0.jar" (
    ECHO [2/3] Building JAR file backend\target\pms-1.0.0.jar...
    docker run --rm -v "%CD%\backend:/workspace" -w /workspace maven:3.9.9-eclipse-temurin-17 mvn clean package -DskipTests
) ELSE (
    ECHO [2/3] Spring Boot JAR file ready at backend\target\pms-1.0.0.jar
)

ECHO.
ECHO =========================================================================
ECHO [3/3] Executing: java -jar backend\target\pms-1.0.0.jar
ECHO =========================================================================
ECHO  - Database Host : localhost:5433 (pms_db)
ECHO  - API Server    : http://localhost:8081
ECHO  - Swagger Docs  : http://localhost:8081/swagger-ui/index.html
ECHO =========================================================================
ECHO.

SET DB_HOST=localhost
SET DB_PORT=5433
SET DB_NAME=pms_db
SET DB_USERNAME=postgres
SET DB_PASSWORD=postgres
SET SERVER_PORT=8081

java -jar "%CD%\backend\target\pms-1.0.0.jar"
PAUSE
