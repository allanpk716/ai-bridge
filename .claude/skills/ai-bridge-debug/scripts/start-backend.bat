@echo off
setlocal enabledelayedexpansion

echo ========================================
echo AI-Bridge Backend Service Start
echo ========================================
echo.

REM Change to project root
cd /d "%~dp0..\..\..\"

echo [1/6] Checking if backend is already running...
tasklist /FI "IMAGENAME eq ai-bridge.exe" 2>nul | find /I /N "ai-bridge.exe">nul
if "%ERRORLEVEL%"=="0" (
    echo [OK] Backend is already running
    echo.
    echo To restart the backend:
    echo 1. Run stop-backend.bat
    echo 2. Run start-backend.bat again
    echo.
    exit /b 0
)

echo [2/6] Checking configuration file...
if not exist "configs\config.yaml" (
    echo [ERROR] configs\config.yaml not found
    echo.
    echo Please create config file:
    echo   copy configs\config.yaml.example configs\config.yaml
    echo.
    exit /b 1
)
echo [OK] Configuration file found

echo.

REM Check if executable exists
echo [3/6] Checking executable...
set "EXE_PATH=ai-bridge.exe"
if not exist "%EXE_PATH%" (
    echo [WARN] Executable not found, compiling...
    echo.

    REM Check Go installation
    where go >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Go is not installed or not in PATH
        echo Please install Go from https://golang.org/dl/
        exit /b 1
    )

    REM Enable CGO for SQLite
    echo Enabling CGO for SQLite support...
    set CGO_ENABLED=1

    REM Build executable
    echo Building ai-bridge.exe...
    go build -v -o ai-bridge.exe .\cmd\ai-bridge
    if %errorlevel% neq 0 (
        echo [ERROR] Build failed
        exit /b 1
    )

    echo [OK] Build successful
) else (
    echo [OK] Executable found
)

echo.

REM Check required directories
echo [4/6] Checking required directories...
if not exist "data" (
    echo Creating data directory...
    mkdir data
)
if not exist "logs" (
    echo Creating logs directory...
    mkdir logs
)
echo [OK] Directories ready

echo.

REM Start the backend service
echo [5/6] Starting backend service on port 8080...
start /B ai-bridge.exe server --config configs\config.yaml > logs\backend-startup.log 2>&1

REM Wait a moment for the process to start
echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo.

REM Verify the service started
echo [6/6] Verifying startup...
tasklist /FI "IMAGENAME eq ai-bridge.exe" 2>nul | find /I /N "ai-bridge.exe">nul
if "%ERRORLEVEL%"=="0" (
    echo [OK] Backend process is running

    REM Test health endpoint
    echo Testing health endpoint...
    curl -s -o nul -w "%%{http_code}" http://localhost:8080/health 2>nul
    if %errorlevel% equ 0 (
        echo [OK] Backend is responding on port 8080
    ) else (
        echo [WARN] Backend process running but health check failed
        echo Check logs\ai-bridge*.log for details
    )
) else (
    echo [ERROR] Backend failed to start
    echo.
    echo Check logs\backend-startup.log for details
    echo.
    echo Common issues:
    echo - Port 8080 already in use (netstat -ano ^| findstr :8080)
    echo - Configuration error in configs\config.yaml
    echo - Missing dependencies (run go mod download)
    exit /b 1
)

echo.
echo ========================================
echo Backend startup complete!
echo ========================================
echo.
echo Backend URL: http://localhost:8080
echo Health check: http://localhost:8080/health
echo API docs: http://localhost:8080/swagger/
echo.
echo Logs: logs\ai-bridge-*.log
echo.
echo To stop the backend, run: stop-backend.bat
echo.
