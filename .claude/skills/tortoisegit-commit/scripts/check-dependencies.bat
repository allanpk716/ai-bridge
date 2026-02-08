@echo off
echo Checking TortoiseGit dependencies...

REM Check TortoiseGitProc.exe
where TortoiseGitProc.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] TortoiseGitProc.exe found in PATH
) else (
    echo [WARNING] TortoiseGitProc.exe not in PATH
    echo Checking default installation path...
    if exist "C:\Program Files\TortoiseGit\bin\TortoiseGitProc.exe" (
        echo [OK] Found at C:\Program Files\TortoiseGit\bin\
    ) else (
        echo [ERROR] TortoiseGit not found. Please install TortoiseGit.
        exit /b 1
    )
)

REM Check Pageant
tasklist | find /I "pageant.exe" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Pageant is running
) else (
    echo [WARNING] Pageant not running. Start Pageant with your PPK key.
)

REM Check Git
where git >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Git found
    git config --global core.sshcommand
) else (
    echo [ERROR] Git not found in PATH
)

echo.
echo Dependency check complete.
