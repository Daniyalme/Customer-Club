@echo off
REM === Setup File ===

cd ./frontend
npm i || exit 0

cd ..
cd ./backend
pip install -r requirements.txt || exit 0

echo.
echo === Scaffold complete! ===
