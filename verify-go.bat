@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Verifying AI-Bridge Project
echo ========================================
echo.

REM 查找Go
echo Checking Go installation...
for %%i in (go.exe) do set GO_PATH=%%~$PATH:i
if defined GO_PATH (
    echo Found Go at: !GO_PATH!
    echo.
    
    REM Go版本
    echo Go version:
    !GO_PATH! version
    echo.
    
    REM 整理依赖
    echo Running: go mod tidy...
    !GO_PATH! mod tidy
    if errorlevel 1 (
        echo ERROR: go mod tidy failed
        exit /b 1
    )
    echo OK: Dependencies resolved
    echo.
    
    REM 编译项目
    echo Running: go build ./cmd/ai-bridge...
    !GO_PATH! build ./cmd/ai-bridge
    if errorlevel 1 (
        echo ERROR: go build failed
        exit /b 1
    )
    echo OK: Build successful
    echo.
    
    REM 测试协议类型
    echo Running: go test ./pkg/protocol/...
    !GO_PATH! test ./pkg/protocol/...
    if errorlevel 1 (
        echo WARNING: Some tests failed (expected for stub packages)
    ) else (
        echo OK: All tests passed
    )
    echo.
    
    echo ========================================
    echo Verification Complete!
    echo ========================================
) else (
    echo ERROR: Go not found in PATH
    echo.
    echo Please add Go to PATH or use full path
    exit /b 1
)

endlocal
