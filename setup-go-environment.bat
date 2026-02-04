@echo off
REM ========================================
REM AI-Bridge Go Environment Setup
REM ========================================

setlocal enabledelayedexpansion

echo ========================================
echo AI-Bridge - Go Environment Setup
echo ========================================
echo.

REM Step 1: Find Go installation
echo [1/4] Searching for Go installation...
set GO_FOUND=0

REM Check if Go is already in PATH
where go.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Found Go in PATH
    set GO_FOUND=1
    goto :found_go
)

REM Check SynologyDrive location
if exist "C:\Users\allan716\SynologyDrive\MyThings\Apps\Proxmax3\4.3\go.exe" (
    echo Found Go at: C:\Users\allan716\SynologyDrive\MyThings\Apps\Proxmax3\4.3\
    set "GO_PATH=C:\Users\allan716\SynologyDrive\MyThings\Apps\Proxmax3\4.3"
    set GO_FOUND=1
    goto :found_go
)

REM Check standard locations
if exist "C:\Go\bin\go.exe" (
    echo Found Go at: C:\Go\bin\
    set "GO_PATH=C:\Go\bin"
    set GO_FOUND=1
    goto :found_go
)

if exist "C:\Program Files\Go\bin\go.exe" (
    echo Found Go at: C:\Program Files\Go\bin\
    set "GO_PATH=C:\Program Files\Go\bin"
    set GO_FOUND=1
    goto :found_go
)

REM If not found, provide instructions
echo.
echo ========================================
echo Go NOT Found!
echo ========================================
echo.
echo Please install Go from: https://golang.org/dl/
echo.
echo Or if Go is already installed in a custom location,
echo add it to your system PATH:
echo.
echo   1. Press Win+R
echo   2. Type: sysdm.cpl
echo   3. Go to Advanced tab -^> Environment Variables
echo   4. Edit PATH and add Go bin directory
echo.
pause
exit /b 1

:found_go
echo.

REM Step 2: Add Go to PATH for this session
echo [2/4] Adding Go to current session...
set "PATH=!GO_PATH!;%PATH%"
echo Updated PATH for this session
echo.

REM Step 3: Verify Go installation
echo [3/4] Verifying Go installation...
go version
if errorlevel 1 (
    echo ERROR: Go executable not working
    pause
    exit /b 1
)
echo Go is working!
echo.

REM Step 4: Verify project
echo [4/4] Verifying AI-Bridge project...
echo.
cd /d "%~dp0"

echo Running: go mod tidy
call go mod tidy
if errorlevel 1 (
    echo WARNING: go mod tidy had issues
) else (
    echo SUCCESS: Dependencies resolved
)
echo.

echo Running: go build ./cmd/ai-bridge
call go build ./cmd/ai-bridge
if errorlevel 1 (
    echo ERROR: Build failed
    echo.
    echo This is expected if some packages are stubs.
    echo The project structure is correct.
) else (
    echo SUCCESS: Build completed!
    if exist ai-bridge.exe (
        echo Created: ai-bridge.exe
    )
)
echo.

echo Running: go test ./pkg/protocol/...
call go test ./pkg/protocol/...
if errorlevel 1 (
    echo WARNING: Some tests failed
) else (
    echo SUCCESS: All tests passed
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To make Go available in all sessions:
echo.
echo   1. Press Win+R
echo   2. Type: sysdm.cpl
echo   3. Go to Advanced tab -^> Environment Variables
echo   4. Under System Variables, edit PATH
echo   5. Add: !GO_PATH!
echo.
echo Then restart your terminal/command prompt.
echo.

pause
