@echo off
setlocal
REM ============================================================
REM  Zone-Chretien Reels Studio - preparation du disque
REM  Cree zc-studio.json et les dossiers Fonds, Musiques, VoixOff,
REM  Logos, Polices, Exports a la racine du disque ou se trouve ce
REM  fichier. Ne supprime et n'ecrase jamais rien.
REM ============================================================
chcp 65001 >nul
cd /d "%~dp0"

call "%~dp0scripts\node-portable.bat"
if errorlevel 1 goto fin

if not exist "node_modules\tsx\package.json" (
    echo Installation du studio ^(connexion Internet requise^)...
    call npm ci --no-audit --no-fund
    if errorlevel 1 goto fin
)

call npm run -s preparer-disque

:fin
echo.
pause
