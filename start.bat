@echo off
echo ====================================================
echo  Don Bosco Hostel — Dormitory Manager v2.0
echo ====================================================
echo.
echo Checking if Node.js is installed...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js found!
echo.

echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo Starting server...
echo.
echo Open your browser to: http://localhost:3000
echo.
echo  Admin login : Lukash / Tirkey8590
echo  Student login: enter your name or ID
echo.
echo Press Ctrl+C to stop the server
echo.
node server.js
pause
