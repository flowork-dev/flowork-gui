@echo off
TITLE FORCE REBUILD GUI FLOWORK
cls
echo =======================================================
echo    MENGHAPUS CACHE & BUILD ULANG GUI (PORTABLE FIX)
echo =======================================================
echo.

set "ROOT_DIR=%~dp0"
set "GUI_DIR=%ROOT_DIR%flowork-gui-lite\template\web"
set "DIST_NODE=%ROOT_DIR%flowork-core\dist\nodejs"
set "PATH=%DIST_NODE%;%PATH%"

echo [1/3] Menghapus folder build lama...
if exist "%GUI_DIR%\dist" (
    rmdir /s /q "%GUI_DIR%\dist"
    echo [OK] Folder dist dihapus.
)

echo [2/3] Mengupdate konfigurasi...
"%ROOT_DIR%flowork-core\dist\python\python.exe" portable_setup.py

echo [3/3] Memulai proses Build (Vite)...
cd /d "%GUI_DIR%"
call npm install
call npm run build

if %errorlevel% neq 0 (
    echo [FATAL] Gagal build GUI! Cek error di atas.
    pause
    exit /b
)

echo.
echo =======================================================
echo    SUKSES! GUI SUDAH DIPERBARUI KE PORT 8000.
echo    Silakan jalankan START.bat sekarang.
echo =======================================================
pause