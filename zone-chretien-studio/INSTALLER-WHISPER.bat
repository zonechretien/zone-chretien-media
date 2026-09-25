@echo off
setlocal
REM ============================================================
REM  Zone-Chretien Reels Studio - synchronisation automatique
REM  Installe whisper.cpp et son modele dans .whisper\ (une seule
REM  fois, connexion Internet requise). Aucun droit administrateur :
REM  rien n'est installe dans Windows.
REM
REM  Autre modele : INSTALLER-WHISPER.bat small
REM ============================================================
chcp 65001 >nul
title Zone-Chretien Reels Studio - installation de Whisper
cd /d "%~dp0"

call "%~dp0scripts\node-portable.bat"
if errorlevel 1 goto erreur

if not exist "node_modules\tsx\package.json" (
    echo Lancez d'abord LANCER-STUDIO.bat une fois pour installer le studio.
    goto erreur
)

if "%~1"=="" (
    call npm run -s whisper
) else (
    call npm run -s whisper -- --modele %1
)
if errorlevel 1 goto erreur
echo.
pause
exit /b 0

:erreur
echo.
pause
exit /b 1
