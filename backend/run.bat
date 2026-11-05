@echo off
echo ========================================================
echo   Starting Farmer Buddy (কৃষি বন্ধু) AI Backend Server
echo ========================================================
echo.

if not exist venv (
    echo [1/3] Creating virtual environment...
    python -m venv venv
)

echo [2/3] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/3] Installing/checking dependencies...
pip install -r requirements.txt

echo.
echo Launching FastAPI Server on http://127.0.0.1:8000
echo.
python main.py
pause
