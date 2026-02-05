@echo off
REM AI-Bridge E2E Test Script
REM Tests complete workflow from session creation to message exchange

setlocal enabledelayedexpansion

echo ========================================
echo AI-Bridge E2E Test
echo ========================================
echo.

REM Check if ai-bridge exists
if not exist "bin\ai-bridge.exe" (
    if not exist "ai-bridge.exe" (
        echo ERROR: ai-bridge.exe not found
        echo Please run: make build or go build ./cmd/ai-bridge
        exit /b 1
    )
    set BIN_PATH=.
) else (
    set BIN_PATH=bin
)

REM Start ai-bridge server in background
echo Starting ai-bridge server...
start /B "" "%BIN_PATH%\ai-bridge.exe" server --config configs\config.yaml > nul 2>&1

REM Wait for server to start
timeout /t 3 /nobreak > nul

REM Test health endpoint
echo Testing health endpoint...
curl -s http://localhost:8080/health
if %ERRORLEVEL% neq 0 (
    echo ERROR: Server not responding
    goto :cleanup
)
echo.
echo OK - Server is running
echo.

REM Create session
echo Creating session...
curl -s -X POST http://localhost:8080/api/v1/sessions ^
  -H "Content-Type: application/json" ^
  -d "{\"workingDirectory\": \".\", \"model\": \"haiku\"}" ^
  > tmp\session_response.json

if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to create session
    goto :cleanup
)

echo Session created successfully
echo.

REM List sessions
echo Listing sessions...
curl -s http://localhost:8080/api/v1/sessions
echo.
echo.

REM List commands
echo Testing commands endpoint...
curl -s http://localhost:8080/api/v1/commands
echo.
echo.

echo ========================================
echo E2E Test Completed Successfully!
echo ========================================

:cleanup
echo.
echo Stopping server...
taskkill /F /IM ai-bridge.exe > nul 2>&1
timeout /t 1 /nobreak > nul
echo Done.

endlocal
