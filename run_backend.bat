@echo off
title AgriVision Farmer Buddy - Gemini Backend Server
cd /d "%~dp0\backend"
echo [AgriVision] Starting Farmer Buddy Gemini Proxy Server on http://localhost:5000 ...
echo [AgriVision] Using official @google/genai SDK with multi-turn memory
node server.js
pause

