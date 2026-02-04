@echo off
REM AI-Bridge E2E Test Script
REM This script runs end-to-end tests with actual Claude CLI

echo ========================================
echo AI-Bridge E2E Test Suite
echo ========================================
echo.

REM Check if Claude CLI is installed
echo Checking Claude CLI installation...
claude --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Claude CLI is not installed or not in PATH
    echo Please install Claude CLI first: https://claude.ai/download
    exit /b 1
)
echo Claude CLI found
echo.

REM Check if Claude CLI is authenticated
echo Checking Claude CLI authentication...
claude auth status >nul 2>&1
if errorlevel 1 (
    echo ERROR: Claude CLI is not authenticated
    echo Please run: claude auth login
    exit /b 1
)
echo Claude CLI authenticated
echo.

REM Check if config file exists
if not exist "..\configs\config.yaml" (
    echo ERROR: Configuration file not found
    echo Please copy configs\config.yaml.example to configs\config.yaml
    exit /b 1
)
echo Configuration file found
echo.

REM Create temporary test directory
if not exist "..\tmp\e2e" mkdir "..\tmp\e2e"
echo Test directory created: tmp\e2e
echo.

REM Build the application
echo ========================================
echo Building AI-Bridge...
echo ========================================
cd ..
go build -o bin\ai-bridge.exe cmd\ai-bridge\main.go
if errorlevel 1 (
    echo ERROR: Build failed
    cd scripts
    exit /b 1
)
echo Build successful
echo.

REM Start the server in background
echo ========================================
echo Starting AI-Bridge server...
echo ========================================
start /B "" bin\ai-bridge.exe server --config configs\config.yaml > tmp\e2e\server.log 2>&1
set SERVER_PID=%errorlevel%
echo Server started (PID: %SERVER_PID%)
echo.

REM Wait for server to be ready
echo Waiting for server to start...
timeout /t 5 /nobreak >nul

REM Check if server is running
echo Checking server health...
curl -s http://localhost:8080/health >nul 2>&1
if errorlevel 1 (
    echo ERROR: Server failed to start
    echo Check logs in tmp\e2e\server.log
    taskkill /F /PID %SERVER_PID% >nul 2>&1
    cd scripts
    exit /b 1
)
echo Server is running
echo.

REM Run E2E tests
echo ========================================
echo Running E2E tests...
echo ========================================

REM Test 1: Create a session
echo Test 1: Creating session...
curl -X POST http://localhost:8080/api/v1/sessions ^
  -H "Content-Type: application/json" ^
  -d "{\"workingDir\":\"tmp/e2e/test1\"}" ^
  -s > tmp\e2e\session_create.json
if errorlevel 1 (
    echo FAILED: Could not create session
    goto cleanup
)
echo Session created successfully
type tmp\e2e\session_create.json
echo.

REM Test 2: Send a message
echo Test 2: Sending message...
for /f "tokens=2 delims=:," %%a in ('type tmp\e2e\session_create.json ^| findstr /i "id"') do set SESSION_ID=%%a
set SESSION_ID=%SESSION_ID:"=%
set SESSION_ID=%SESSION_ID: =%
echo Session ID: %SESSION_ID%

curl -X POST http://localhost:8080/api/v1/sessions/%SESSION_ID%/messages ^
  -H "Content-Type: application/json" ^
  -d "{\"content\":\"hello\"}" ^
  -s > tmp\e2e\message_send.json
if errorlevel 1 (
    echo FAILED: Could not send message
    goto cleanup
)
echo Message sent successfully
echo.

REM Test 3: Get messages
echo Test 3: Getting messages...
curl -X GET http://localhost:8080/api/v1/sessions/%SESSION_ID%/messages?limit=10 ^
  -s > tmp\e2e\messages_get.json
if errorlevel 1 (
    echo FAILED: Could not get messages
    goto cleanup
)
echo Messages retrieved successfully
type tmp\e2e\messages_get.json
echo.

REM Test 4: List commands
echo Test 4: Listing commands...
curl -X GET "http://localhost:8080/api/v1/commands?sessionId=%SESSION_ID%" ^
  -s > tmp\e2e\commands_list.json
if errorlevel 1 (
    echo FAILED: Could not list commands
    goto cleanup
)
echo Commands listed successfully
echo.

REM Test 5: Delete session
echo Test 5: Deleting session...
curl -X DELETE http://localhost:8080/api/v1/sessions/%SESSION_ID% ^
  -s > tmp\e2e\session_delete.json
if errorlevel 1 (
    echo FAILED: Could not delete session
    goto cleanup
)
echo Session deleted successfully
echo.

echo ========================================
echo All E2E tests passed!
echo ========================================

:cleanup
echo.
echo Cleaning up...

REM Stop the server
echo Stopping server...
taskkill /F /IM ai-bridge.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo E2E test suite completed
echo Check tmp\e2e\ for logs and outputs
cd scripts
