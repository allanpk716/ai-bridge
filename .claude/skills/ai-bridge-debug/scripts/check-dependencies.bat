@echo off
REM AI-Bridge Dependency Check Script for Windows
REM This script checks if all required dependencies are installed

echo ========================================
echo AI-Bridge Dependency Check
echo ========================================
echo.

set ALL_OK=1

REM Check Go
echo [1/5] Checking Go installation...
go version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Go is installed
    go version
) else (
    echo [FAIL] Go is not installed or not in PATH
    set ALL_OK=0
)
echo.

REM Check Claude CLI
echo [2/5] Checking Claude CLI installation...
claude version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Claude CLI is installed
    claude version
) else (
    echo [FAIL] Claude CLI is not installed or not in PATH
    echo Please install Claude CLI from: https://claude.ai/download
    set ALL_OK=0
)
echo.

REM Check Git
echo [3/5] Checking Git installation...
git version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Git is installed
    git version
) else (
    echo [FAIL] Git is not installed or not in PATH
    set ALL_OK=0
)
echo.

REM Check SQLite
echo [4/5] Checking SQLite installation...
sqlite3 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] SQLite is installed
    sqlite3 --version
) else (
    echo [WARN] SQLite is not installed (optional for development)
    echo You can install SQLite from: https://www.sqlite.org/download.html
)
echo.

REM Check project directories
echo [5/5] Checking project directories...
if exist "data" (
    echo [OK] data directory exists
) else (
    echo [INFO] Creating data directory...
    mkdir data
)

if exist "logs" (
    echo [OK] logs directory exists
) else (
    echo [INFO] Creating logs directory...
    mkdir logs
)
echo.

REM Final result
echo ========================================
if %ALL_OK% equ 1 (
    echo All critical dependencies are installed!
    echo You are ready to run AI-Bridge.
) else (
    echo Some dependencies are missing.
    echo Please install the missing dependencies and run this script again.
)
echo ========================================

pause
