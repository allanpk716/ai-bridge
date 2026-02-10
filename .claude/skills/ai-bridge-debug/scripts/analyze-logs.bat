@echo off
setlocal enabledelayedexpansion

echo ========================================
echo AI-Bridge Log Analysis
echo ========================================
echo.

REM Set log directory
set LOG_DIR=logs
set LOG_PATTERN=ai-bridge-*.log

echo [1/5] Checking log directory...
if not exist "%LOG_DIR%" (
    echo [ERROR] Log directory not found: %LOG_DIR%
    echo.
    echo The backend may not have been started yet, or logs are configured elsewhere.
    exit /b 1
)

echo [OK] Log directory found
echo.

echo [2/5] Finding log files...
pushd "%LOG_DIR%"
dir /B %LOG_PATTERN% 2>nul >nul
if %errorlevel% neq 0 (
    echo [WARN] No log files found matching pattern: %LOG_PATTERN%
    echo.
    echo Possible reasons:
    echo - Backend has not been started yet
    echo - Log directory is different (check configs\config.yaml)
    echo - Logger is configured to output only to stdout
    popd
    exit /b 0
)

REM Get the most recent log file
for /f "delims=" %%f in ('dir /B /O-D %LOG_PATTERN% 2^>nul') do (
    set LATEST_LOG=%%f
    goto :found_log
)

:found_log
echo [OK] Found log file: !LATEST_LOG!
echo.

echo [3/5] Analyzing recent errors...
echo.
echo ========================================
echo Recent ERROR entries (last 20)
echo ========================================
findstr /I "error" "!LATEST_LOG!" 2>nul | more /E +1 | tail -n 20 2>nul
if %errorlevel% neq 0 (
    echo No error entries found (or findstr failed)
)

echo.
echo.

echo [4/5] Analyzing recent FATAL entries...
echo.
echo ========================================
echo Recent FATAL entries (last 10)
echo ========================================
findstr /I "fatal panic" "!LATEST_LOG!" 2>nul | more /E +1 | tail -n 10 2>nul
if %errorlevel% neq 0 (
    echo No fatal/panic entries found
)

echo.
echo.

echo [5/5] Analyzing recent WARN entries...
echo.
echo ========================================
echo Recent WARN entries (last 15)
echo ========================================
findstr /I "warn" "!LATEST_LOG!" 2>nul | more /E +1 | tail -n 15 2>nul
if %errorlevel% neq 0 (
    echo No warning entries found
)

echo.
echo.

echo ========================================
echo Log Statistics
echo ========================================
echo File: !LATEST_LOG!

REM Count total lines
for /f %%a in ('type "!LATEST_LOG!" 2^>nul ^| find /C /V ""') do set TOTAL_LINES=%%a
echo Total lines: !TOTAL_LINES!

REM Count errors
for /f %%a in ('type "!LATEST_LOG!" 2^>nul ^| find /C /I "error"') do set ERROR_COUNT=%%a
echo Error count: !ERROR_COUNT!

REM Count warnings
for /f %%a in ('type "!LATEST_LOG!" 2^>nul ^| find /C /I "warn"') do set WARN_COUNT=%%a
echo Warning count: !WARN_COUNT!

REM Count fatals/panics
for /f %%a in ('type "!LATEST_LOG!" 2^>nul ^| find /C /I "fatal panic"') do set FATAL_COUNT=%%a
echo Fatal count: !FATAL_COUNT!

echo.

popd

echo ========================================
echo Full Log Location
echo ========================================
echo %LOG_DIR%\!LATEST_LOG!
echo.
echo To view the full log:
echo   type %LOG_DIR%\!LATEST_LOG! ^| more
echo.
echo To search for specific terms:
echo   findstr /I "search term" %LOG_DIR%\!LATEST_LOG!
echo.
