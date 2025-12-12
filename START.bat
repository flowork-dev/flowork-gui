@echo off
TITLE FLOWORK PORTABLE ENGINE (V16 - CONNECT FIX)
cls

echo =================================================================
echo           FLOWORK PORTABLE LAUNCHER (V16 - CONNECT FIX)
echo =================================================================

REM --- [FASE 0: SETUP PATH] ---
set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

set "DIST_PYTHON=%ROOT_DIR%\flowork-core\dist\python\python.exe"
set "DIST_NODE=%ROOT_DIR%\flowork-core\dist\nodejs"
set "GUI_DIR=%ROOT_DIR%\flowork-gui-lite\template\web"
set "SETUP_SCRIPT=%ROOT_DIR%\setup_dist.ps1"

REM --- [FASE 1: CEK MESIN] ---
if exist "%DIST_PYTHON%" goto :CHECK_NODE
echo [AUTO-INSTALL] Engine tidak ditemukan. Memulai instalasi otomatis...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SETUP_SCRIPT%"
if %errorlevel% neq 0 ( pause & exit /b 1 )
if not exist "%DIST_PYTHON%" ( pause & exit /b 1 )

:CHECK_NODE
if exist "%DIST_NODE%" set "PATH=%DIST_NODE%;%PATH%"

REM --- [FASE 2: CONFIGURATION (DULUAN!)] ---
echo [SETUP] Generating Configurations...
"%DIST_PYTHON%" portable_setup.py
if %errorlevel% neq 0 ( pause & exit /b 1 )

REM --- [FASE 3: BUILD GUI (JIKA PERLU)] ---
if exist "%GUI_DIR%\dist\index.html" goto :SET_ENV_VARS

:BUILD_GUI
echo [GUI] Building Frontend (One-Time)...
cd /d "%GUI_DIR%"
call npm install --no-audit --no-fund --quiet
call npm run build
cd /d "%ROOT_DIR%"

REM --- [FASE 4: INJECT ENV GLOBALLY] ---
:SET_ENV_VARS
REM Ini trik kuncinya! Kita set Environment Variable di level CMD ini.
REM Semua proses Python yang jalan dari sini akan mewarisi nilai ini.
REM Jadi mereka GAK PERLU cari file .env lagi, karena udah ada di memori.

echo [BOOT] Loading environment into memory...
for /f "usebackq tokens=1,* delims==" %%A in ("%ROOT_DIR%\.env") do (
    if "%%A" neq "" set "%%A=%%B"
)

REM Paksa Path Database (Override kalau ada yang bandel)
set "ENV_FILE_PATH=%ROOT_DIR%\.env"
echo [BOOT] Config Source: %ENV_FILE_PATH%

REM --- [FASE 5: RUNNING] ---
echo -----------------------------------------------------------------
echo [3/3] Meluncurkan Flowork Trinity System...
echo.
echo    [GATEWAY]: http://localhost:8000
echo    [CORE]   : http://localhost:8001
echo    [GUI]    : http://localhost:3000
echo.
echo [INFO] Jangan tutup jendela ini.
echo.

"%DIST_PYTHON%" flowork_launcher.py