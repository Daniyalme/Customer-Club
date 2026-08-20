@echo off
setlocal
REM === Setup File ===
pushd "%~dp0"

echo === Installing frontend dependencies ===
pushd frontend
npm install
if errorlevel 1 goto :error

if not exist build\ (
	echo === Building frontend app ===
	npm run build
	if errorlevel 1 goto :error
) else (
	echo === Frontend build already exists; skipping build ===
)
popd

echo === Installing backend dependencies ===
pushd backend
python -m pip install -r requirements.txt
if errorlevel 1 goto :error
popd

echo.
echo === Setup complete! ===
echo You can now run the app using run.bat
popd
endlocal
exit /b 0

:error
echo.
echo === Setup failed. See the error above. ===
popd
endlocal
exit /b 1
