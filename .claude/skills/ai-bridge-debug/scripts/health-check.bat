@echo off
setlocal enabledelayedexpansion

echo ========================================
echo AI-Bridge Health Check
echo ========================================
echo.

REM Initialize status variables
set BACKEND_OK=0
set FRONTEND_OK=0

echo [1/4] Checking backend service...
tasklist /FI "IMAGENAME eq ai-bridge.exe" 2>nul | find /I /N "ai-bridge.exe">nul
if "%ERRORLEVEL%"=="0" (
    echo [OK] Backend process is running
) else (
    echo [ERROR] Backend process is not running
    echo Run start-backend.bat to start the backend
    echo.
    goto :frontend_check
)

echo.

echo [2/4] Testing backend health endpoint...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:8080/health 2>nul
if %errorlevel% equ 0 (
    echo [OK] Backend health check passed
    set BACKEND_OK=1
) else (
    echo [ERROR] Backend health check failed
    echo The service may be starting up or misconfigured
    echo Check logs\ai-bridge*.log for errors
)

echo.

echo [3/4] Getting backend health details...
curl -s http://localhost:8080/health 2>nul
echo.

:frontend_check
echo.

echo [4/4] Checking frontend service...
netstat -ano | findstr ":3000.*LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Frontend service is running on port 3000
    set FRONTEND_OK=1
) else (
    echo [WARN] Frontend service is not running
    echo To start the frontend:
    echo   cd web
    echo   npm run dev
)

echo.
echo ========================================
echo Health Check Summary
echo ========================================
echo.
if !BACKEND_OK! equ 1 (
    echo Backend:  [OK] Running and healthy
) else (
    echo Backend:  [FAIL] Not running or unhealthy
)

if !FRONTEND_OK! equ 1 (
    echo Frontend: [OK] Running
) else (
    echo Frontend: [WARN] Not running
)

echo.

REM Provide next steps
if !BACKEND_OK! equ 0 (
    echo To fix backend issues:
    echo 1. Check logs: type logs\ai-bridge-*.log ^| findstr /I "error fatal"
    echo 2. Restart backend: stop-backend.bat ^&^& start-backend.bat
    echo 3. Check configuration: type configs\config.yaml
    echo.
)

if !BACKEND_OK! equ 1 (
    if !FRONTEND_OK! equ 1 (
        echo [SUCCESS] All services are running!
        echo.
        echo Access the application:
        echo - Frontend: http://localhost:3000
        echo - Backend API: http://localhost:8080
        echo - Health: http://localhost:8080/health
        echo.
        echo Test the SDK integration:
        echo - Open browser: http://localhost:3000/test-sdk.html
        echo.
        exit /b 0
    )
)

exit /b 1
