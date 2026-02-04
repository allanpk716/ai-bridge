@echo off
REM AI-Bridge Project Initialization Script
REM This script helps set up the project after cloning

echo ========================================
echo AI-Bridge Project Initialization
echo ========================================
echo.

REM Check Go installation
echo [1/6] Checking Go installation...
go version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Go is not installed or not in PATH
    echo Please install Go from https://golang.org/dl/
    echo.
    echo After installation, restart your terminal and run this script again.
    pause
    exit /b 1
)
echo Go found:
go version
echo.

REM Check Claude CLI installation
echo [2/6] Checking Claude CLI installation...
claude --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Claude CLI is not installed or not in PATH
    echo Please install Claude CLI from https://claude.ai/download
    echo.
    echo The project can be built without Claude CLI, but E2E tests will fail.
    echo.
    choice /C YN /M "Continue anyway"
    if errorlevel 2 exit /b 1
) else (
    echo Claude CLI found:
    claude --version
    echo.
)

REM Check Claude CLI authentication
echo [3/6] Checking Claude CLI authentication...
claude auth status >nul 2>&1
if errorlevel 1 (
    echo WARNING: Claude CLI is not authenticated
    echo Please run: claude auth login
    echo.
    choice /C YN /M "Continue anyway"
    if errorlevel 2 exit /b 1
) else (
    echo Claude CLI is authenticated
    echo.
)

REM Initialize Go module
echo [4/6] Initializing Go module...
if not exist go.mod (
    echo Creating go.mod...
    go mod init github.com/your-org/ai-bridge
    if errorlevel 1 (
        echo ERROR: Failed to initialize Go module
        pause
        exit /b 1
    )
) else (
    echo go.mod already exists
)
echo.

REM Install dependencies
echo [5/6] Installing dependencies...
echo This may take a few minutes...
echo.
go get github.com/stretchr/testify@v1.9.0
go get gorm.io/gorm@v1.25.12
go get gorm.io/driver/sqlite@v1.5.6
go get github.com/WQGroup/logger
go get github.com/gin-gonic/gin@v1.10.0
go get github.com/gorilla/websocket@v1.5.3
go get github.com/fsnotify/fsnotify@v1.7.0
go get gopkg.in/yaml.v3
go mod tidy
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed successfully
echo.

REM Create configuration file
echo [6/6] Setting up configuration...
if not exist configs\config.yaml (
    echo Creating config.yaml from example...
    copy configs\config.yaml.example configs\config.yaml >nul
    echo.
    echo Configuration file created: configs\config.yaml
    echo.
    echo IMPORTANT: Edit configs\config.yaml and update the following:
    echo   - auth.jwtSecret (set a strong secret)
    echo   - auth.cliApiToken (set your API token)
    echo   - claude.defaultModel (haiku, sonnet, or opus)
    echo.
    choice /C YN /M "Open config file for editing now"
    if errorlevel 1 (
        start notepad configs\config.yaml
    )
) else (
    echo configs\config.yaml already exists
)
echo.

REM Create necessary directories
echo Creating directories...
if not exist bin mkdir bin
if not exist data mkdir data
if not exist logs mkdir logs
if not exist tmp mkdir tmp
echo.

REM Build project
echo ========================================
echo Building project...
echo ========================================
go build -o bin\ai-bridge.exe cmd\ai-bridge\main.go
if errorlevel 1 (
    echo.
    echo WARNING: Build failed. This is expected for initial setup.
    echo The project structure is ready, but some packages are not yet implemented.
    echo.
    echo You can now start implementing the features according to the plan.
) else (
    echo.
    echo ========================================
    echo SUCCESS! Project initialized successfully!
    echo ========================================
    echo.
    echo Binary created: bin\ai-bridge.exe
    echo.
    echo Next steps:
    echo   1. Edit configs\config.yaml with your settings
    echo   2. Run: make run
    echo   3. Or run: bin\ai-bridge.exe server --config configs\config.yaml
    echo.
    echo For more information, see:
    echo   - QUICKSTART.md - Quick start guide
    echo   - README.md - Project documentation
    echo   - PROJECT_STATUS.md - Current implementation status
)

echo.
echo Initialization complete!
pause
