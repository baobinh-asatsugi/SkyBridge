@echo off
cd /d "%~dp0"
echo Starting SkyBridge Mission Control Prototype...
echo.
if not exist node_modules (
  echo Installing dependencies. This may take a few minutes on first run...
  npm install
)
echo.
npm run dev
pause
