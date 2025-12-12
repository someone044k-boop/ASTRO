@echo off
echo Installing components for Learning School project...
echo.

echo Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found!
    echo Please download from: https://nodejs.org/
    start https://nodejs.org/en/download/
    pause
    exit /b 1
) else (
    echo Node.js is installed
)

echo Checking PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo PostgreSQL not found!
    echo Please download from: https://www.postgresql.org/download/windows/
    echo Set password to: postgres123 during installation
    start https://www.postgresql.org/download/windows/
    pause
    exit /b 1
) else (
    echo PostgreSQL is installed
)

echo.
echo All components are ready!
echo.
echo Next steps:
echo 1. Run: setup-db.bat
echo 2. Run: start.bat
echo.
pause