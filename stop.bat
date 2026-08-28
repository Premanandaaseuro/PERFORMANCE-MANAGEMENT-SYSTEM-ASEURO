@echo off
TITLE PMS - Stop All Services
COLOR 0C
CLS

ECHO =========================================================================
ECHO                 STOPPING ALL PMS DOCKER CONTAINERS
ECHO =========================================================================
ECHO.
docker compose down
ECHO.
ECHO All PMS services have been stopped.
PAUSE
