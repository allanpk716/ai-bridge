@echo off
setlocal enabledelayedexpansion

echo ========================================
echo AI-Bridge Backend Service Stop
echo ========================================
echo.

echo [1/3] Checking for backend process...
tasklist /FI "IMAGENAME eq ai-bridge.exe" 2>nul | find /I /N "ai-bridge.exe">nul
if "%ERRORLEVEL%"=="0" (
    echo [OK] Backend process found
) else (
    echo [INFO] Backend process is not running
    exit /b 0
)

echo.

REM Try graceful shutdown first
echo [2/3] Attempting graceful shutdown (Ctrl+C)...

REM Find PIDs of all ai-bridge.exe processes
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq ai-bridge.exe" /NH ^| findstr "ai-bridge.exe"') do (
    echo Sending shutdown signal to PID %%a...
    taskkill /PID %%a /T >nul 2>&1
)

REM Wait for graceful shutdown
echo Waiting for process to exit...
timeout /t 5 /nobreak >nul

echo.

REM Check if still running
echo [3/3] Verifying shutdown...
tasklist /FI "IMAGENAME eq ai-bridge.exe" 2>nul | find /I /N "ai-bridge.exe">nul
if "%ERRORLEVEL%"=="0" (
    echo [WARN] Process still running, forcing termination...

    REM Force terminate
    taskkill /F /IM ai-bridge.exe >nul 2>&1

    timeout /t 2 /nobreak >nul

    tasklist /FI "IMAGENAME eq ai-bridge.exe" 2>nul | find /I /N "ai-bridge.exe">nul
    if "%ERRORLEVEL%"=="0" (
        echo [ERROR] Failed to terminate backend process
        echo You may need to manually terminate it using Task Manager
        exit /b 1
    )
)

echo [OK] Backend service stopped
echo.
echo ========================================
echo Backend shutdown complete!
echo ========================================
echo.
echo To start the backend again, run: start-backend.bat
echo.
