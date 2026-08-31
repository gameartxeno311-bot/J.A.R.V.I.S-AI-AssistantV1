@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo   J.A.R.V.I.S. EB INTERFACE
 echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Install Node.js 20+ from https://nodejs.org/ and run this file again.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Please reinstall Node.js 20+.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo First run detected. Installing J.A.R.V.I.S. dependencies...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. See the error above.
    pause
    exit /b 1
  )
)

echo.
echo Starting J.A.R.V.I.S. on http://localhost:8787/
echo Your browser will open automatically.
echo Keep this window open while using J.A.R.V.I.S.
echo Press Ctrl+C to stop the server.
echo.

start "JARVIS Browser" /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:8787/"
call npm run dev

pause
endlocal
