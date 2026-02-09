@echo off
REM Bundle analysis script for AI-Bridge web application
REM This script builds the project and opens the bundle visualization

echo.
echo ========================================
echo AI-Bridge Bundle Analysis
echo ========================================
echo.

echo Step 1: Building project...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo Build failed! Please fix errors before analyzing bundle.
    exit /b %ERRORLEVEL%
)

echo.
echo Step 2: Opening bundle analysis...
echo.
echo Bundle analysis will open in your default browser.
echo Look for: dist\stats.html
echo.

if exist "dist\stats.html" (
    start dist\stats.html
    echo.
    echo Analysis opened successfully!
    echo.
    echo Key metrics to check:
    echo - Main bundle size (should be ^< 500KB gzipped)
    echo - Chunk distribution
    echo - Dependency tree
    echo.
) else (
    echo.
    echo ERROR: stats.html not found in dist directory
    echo Please check Vite configuration.
    exit /b 1
)

echo.
echo ========================================
echo Analysis complete!
echo ========================================
echo.
