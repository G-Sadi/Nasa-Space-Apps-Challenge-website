@echo off
title Field Shift Farmer Buddy - Gemini Backend Server
cd /d "%~dp0\backend"
echo [Field Shift] Starting Farmer Buddy Gemini Proxy Server on http://localhost:5000 ...
echo [Field Shift] Using official @google/genai SDK with multi-turn memory
node server.js
pause

