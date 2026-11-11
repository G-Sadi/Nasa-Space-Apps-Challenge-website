@echo off
title Field Shift - Gemini AI Backend Proxy
echo ========================================================
echo   Starting Farmer Buddy (কৃষি বন্ধু) Gemini Backend Proxy
echo   Listening on: http://localhost:5000/api/ask
echo ========================================================
echo.

if not exist node_modules (
    echo [1/2] Installing Node.js dependencies...
    call npm.cmd install
)

echo [2/2] Launching Node.js Express server...
node server.js
pause
