@echo off
echo Verifying AI-Bridge...
echo.

REM Check if Go is in PATH
where go.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Go found in PATH
    go version
    echo.

    echo Running: go mod tidy
    go mod tidy
    echo.

    echo Running: go build ./cmd/ai-bridge
    go build ./cmd/ai-bridge
    if %ERRORLEVEL% EQU 0 (
        echo Build SUCCESS
        echo.
    ) else (
        echo Build FAILED
        exit /b 1
    )

    echo Running: go test ./pkg/protocol/...
    go test ./pkg/protocol/...
    echo.

    echo Verification complete!
) else (
    echo Go NOT found in PATH
    echo.
    echo Please add Go installation directory to system PATH
    echo.
    echo Found Go at: C:\Users\allan716\SynologyDrive\MyThings\Apps\Proxmax3\4.3\go.exe
    echo.
    echo Run this command to add to PATH:
    echo setx PATH "%PATH%;C:\Users\allan716\SynologyDrive\MyThings\Apps\Proxmax3\4.3"
)
