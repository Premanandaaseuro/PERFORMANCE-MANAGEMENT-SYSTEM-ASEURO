@echo off
TITLE Performance Management System (PMS) - Unified Runner
COLOR 0A
CLS

ECHO =========================================================================
ECHO        PERFORMANCE MANAGEMENT SYSTEM (PMS) - UNIFIED SINGLE RUNNER
ECHO =========================================================================
ECHO.
ECHO [1] Full Stack via Docker Compose (Frontend, Backend, Database, PgAdmin)
ECHO [2] Run Backend JAR file directly (java -jar backend\target\pms-1.0.0.jar)
ECHO [3] Build Backend Spring Boot JAR file only
ECHO [4] Stop all running services
ECHO [5] Exit
ECHO.
ECHO =========================================================================
SET /P CHOICE="Please select an option (1-5) [Default is 1]: "

IF "%CHOICE%"=="" SET CHOICE=1
IF "%CHOICE%"=="1" GOTO RUN_DOCKER
IF "%CHOICE%"=="2" GOTO RUN_JAR
IF "%CHOICE%"=="3" GOTO BUILD_JAR
IF "%CHOICE%"=="4" GOTO STOP_ALL
IF "%CHOICE%"=="5" GOTO END

:RUN_DOCKER
CLS
ECHO =========================================================================
ECHO [1/3] Checking Docker environment...
ECHO =========================================================================
WHERE docker >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    ECHO [ERROR] Docker is not installed or not running. Please start Docker Desktop.
    PAUSE
    GOTO END
)

ECHO.
ECHO [2/3] Building and starting all microservices & containers...
docker compose up --build -d

IF %ERRORLEVEL% NEQ 0 (
    ECHO [ERROR] Failed to start Docker Compose stack.
    PAUSE
    GOTO END
)

ECHO.
ECHO =========================================================================
ECHO SUCCESS! Performance Management System is up and running!
ECHO =========================================================================
ECHO  - Frontend UI          : http://localhost
ECHO  - Backend API          : http://localhost:8081
ECHO  - Swagger API Docs     : http://localhost:8081/swagger-ui/index.html
ECHO  - PgAdmin Database UI  : http://localhost:5050 (User: admin@admin.com / Pass: admin)
ECHO =========================================================================
ECHO.
ECHO Opening Frontend application in default browser...
start http://localhost
PAUSE
GOTO END

:RUN_JAR
CLS
ECHO =========================================================================
ECHO [1/3] Ensuring PostgreSQL Database is active...
ECHO =========================================================================
docker compose up -d postgres

IF NOT EXIST "%CD%\backend\target\pms-1.0.0.jar" (
    ECHO.
    ECHO [2/3] JAR file not found. Building backend\target\pms-1.0.0.jar...
    docker run --rm -v "%CD%\backend:/workspace" -w /workspace maven:3.9.9-eclipse-temurin-17 mvn clean package -DskipTests
) ELSE (
    ECHO [2/3] Found existing backend\target\pms-1.0.0.jar.
)

ECHO.
ECHO =========================================================================
ECHO [3/3] Running Spring Boot JAR (pms-1.0.0.jar)...
ECHO =========================================================================
ECHO DB_HOST=localhost DB_PORT=5433 DB_NAME=pms_db SERVER_PORT=8081
ECHO Press Ctrl+C to terminate backend server.
ECHO.

SET DB_HOST=localhost
SET DB_PORT=5433
SET DB_NAME=pms_db
SET DB_USERNAME=postgres
SET DB_PASSWORD=postgres
SET SERVER_PORT=8081

java -jar "%CD%\backend\target\pms-1.0.0.jar"
PAUSE
GOTO END

:BUILD_JAR
CLS
ECHO =========================================================================
ECHO Building Spring Boot JAR file (pms-1.0.0.jar)...
ECHO =========================================================================
docker run --rm -v "%CD%\backend:/workspace" -w /workspace maven:3.9.9-eclipse-temurin-17 mvn clean package -DskipTests
IF %ERRORLEVEL% EQU 0 (
    ECHO.
    ECHO SUCCESS! Jar created at: %CD%\backend\target\pms-1.0.0.jar
) ELSE (
    ECHO.
    ECHO [ERROR] Failed to build JAR file.
)
PAUSE
GOTO END

:STOP_ALL
CLS
ECHO =========================================================================
ECHO Stopping all PMS Docker containers...
ECHO =========================================================================
docker compose down
ECHO All PMS services stopped.
PAUSE
GOTO END

:END
