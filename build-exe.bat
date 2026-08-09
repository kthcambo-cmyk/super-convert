@echo off
title Build Document Assistant Executable
echo ======================================================
echo   Building Windows Executable (DocumentAssistant.exe)...
echo ======================================================
echo.

cd /d "%~dp0"

:: Build the EXE
call npx pkg . --targets node18-win-x64 --output ./release/DocumentAssistant.exe

if errorlevel 1 (
    echo.
    echo [ERROR] Build failed! Check the output above.
    pause
    exit /b 1
)

echo.
echo   Copying required runtime assets to release folder...

:: Copy frontend UI (required at runtime)
if exist "public" (
    xcopy /E /I /Y "public" "release\public" >nul
    echo   [OK] public\ folder copied.
)

:: Copy .env config (if it exists)
if exist ".env" (
    copy /Y ".env" "release\.env" >nul
    echo   [OK] .env config copied.
)

:: Create empty uploads and processed folders (needed at runtime)
if not exist "release\uploads" mkdir "release\uploads"
if not exist "release\processed" mkdir "release\processed"
echo   [OK] uploads\ and processed\ folders ready.

echo.
echo ======================================================
echo   Build complete!
echo   Output: release\DocumentAssistant.exe  (~45 MB)
echo.
echo   To distribute, copy the entire 'release' folder.
echo   Users just double-click DocumentAssistant.exe
echo   Then open http://localhost:3000 in their browser.
echo ======================================================
echo.
pause
