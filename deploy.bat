@echo off
REM =============================================================================
REM SOCIAL ORBIT - GitHub Pages Deploy Script (Windows)
REM =============================================================================
REM This script builds and deploys the React app to GitHub Pages
REM 
REM Usage: deploy.bat [commit-message]
REM =============================================================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Social Orbit - Deploy Script
echo ========================================
echo.

REM Configuration
set APP_DIR=social-orbit
set GIT_REMOTE=git@github.com-personal:coder-jkb/Social-Orbit.git

REM Check if we're in the right directory
if not exist "%APP_DIR%" (
    echo ERROR: %APP_DIR% directory not found!
    echo Please run this script from the repository root.
    exit /b 1
)

REM Step 1: Check for uncommitted changes and commit
echo Step 1: Checking for uncommitted changes...

git status --porcelain > nul 2>&1
for /f %%i in ('git status --porcelain') do set HAS_CHANGES=1

if defined HAS_CHANGES (
    echo Uncommitted changes found. Staging all changes...
    git add .
    
    REM Get commit message from argument or use default
    if "%~1"=="" (
        set COMMIT_MSG=Auto-deploy: %date% %time%
    ) else (
        set COMMIT_MSG=%~1
    )
    
    echo Committing with message: !COMMIT_MSG!
    git commit -m "!COMMIT_MSG!"
    
    echo Pushing to main branch...
    git push origin main
    
    echo [OK] Changes pushed to main
) else (
    echo [OK] No uncommitted changes
)

REM Step 2: Build the React app
echo.
echo Step 2: Building production bundle...

cd %APP_DIR%

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call yarn install
)

REM Build
call yarn build

if errorlevel 1 (
    echo ERROR: Build failed!
    cd ..
    exit /b 1
)

echo [OK] Build complete

REM Step 3: Deploy to GitHub Pages
echo.
echo Step 3: Deploying to GitHub Pages...

call npx gh-pages -d dist -r %GIT_REMOTE% -m "Deploy: %date% %time%"

if errorlevel 1 (
    echo ERROR: Deployment failed!
    cd ..
    exit /b 1
)

cd ..

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Your app is live at:
echo   https://coder-jkb.github.io/Social-Orbit/
echo.

endlocal

