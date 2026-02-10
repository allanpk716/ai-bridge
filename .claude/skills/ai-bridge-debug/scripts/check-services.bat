@echo off
setlocal enabledelayedexpansion

echo ========================================
echo AI-Bridge Service Status Check
echo ========================================
echo.

set BACKEND_RUNNING=0
set FRONTEND_RUNNING=0
set BACKEND_PID=0

REM Check backend service (port 8080)
echo [1/3] Checking backend service (port 8080)...
netstat -ano | findstr ":8080.*LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Backend service is running on port 8080
    set BACKEND_RUNNING=1

    REM Get the PID for information
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080.*LISTENING"') do (
        set BACKEND_PID=%%a
        goto :found_backend_pid
    )
    :found_backend_pid
    echo      PID: !BACKEND_PID!
) else (
    echo [WARN] Backend service is NOT running
)

echo.

REM Check for ai-bridge.exe process
echo [2/3] Checking ai-bridge.exe process...
tasklist /FI "IMAGENAME eq ai-bridge.exe" 2>nul | find /I /N "ai-bridge.exe">nul
if "%ERRORLEVEL%"=="0" (
    echo [OK] ai-bridge.exe process is running
) else (
    echo [WARN] ai-bridge.exe process not found
)

echo.

REM Check frontend service (port 3000)
echo [3/3] Checking frontend service (port 3000)...
netstat -ano | findstr ":3000.*LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Frontend service is running on port 3000
    set FRONTEND_RUNNING=1

    REM Get the PID for information
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
        echo      PID: %%a
        goto :found_frontend_pid
    )
    :found_frontend_pid
) else (
    echo [WARN] Frontend service is NOT running
)

echo.
echo ========================================
echo Summary:
echo ========================================
if !BACKEND_RUNNING! equ 1 (
    echo Backend:  RUNNING
) else (
    echo Backend:  STOPPED
)

if !FRONTEND_RUNNING! equ 1 (
    echo Frontend: RUNNING
) else (
    echo Frontend: STOPPED
)

echo.
echo Next steps:
if !BACKEND_RUNNING! equ 0 (
    echo - Run start-backend.bat to start the backend service
)

if !FRONTEND_RUNNING! equ 0 (
    echo - Navigate to web/ directory and run 'npm run dev' to start frontend
)

if !BACKEND_RUNNING! equ 1 (
    echo - Run health-check.bat to verify backend health
)

echo.

REM Exit code: 0 if both running, 1 if one or both stopped
if !BACKEND_RUNNING! equ 1 (
    if !FRONTEND_RUNNING! equ 1 (
        exit /b 0
    )
)
exit /b 1
