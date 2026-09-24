@echo off
setlocal
REM ============================================================
REM  Zone-Chretien Reels Studio (com.lepolo.zc-studio)
REM  Developpe par Lepolo.
REM
REM  Double-cliquer ce fichier. Aucun droit administrateur requis :
REM  rien n'est installe dans Windows, le PATH n'est modifie que
REM  pour cette fenetre.
REM ============================================================
chcp 65001 >nul
title Zone-Chretien Reels Studio - ne pas fermer
cd /d "%~dp0"

call "%~dp0scripts\node-portable.bat"
if errorlevel 1 goto erreur

REM --- Premiere utilisation : installation des dependances du studio ---
if not exist "node_modules\@remotion\renderer\package.json" (
    echo Premiere utilisation : installation du studio ^(connexion Internet requise, quelques minutes^)...
    call npm ci --no-audit --no-fund
    if errorlevel 1 (
        echo.
        echo L'installation a echoue. Verifiez la connexion Internet puis relancez ce fichier.
        goto erreur
    )
)

REM --- Navigateur de rendu (telecharge une seule fois, range sur le disque) ---
call npm run -s navigateur
if errorlevel 1 (
    echo.
    echo Attention : le navigateur de rendu est absent. L'apercu fonctionnera,
    echo mais pas l'export MP4. Connectez-vous une fois a Internet puis relancez.
    echo.
)

REM --- Demarrage du serveur local (127.0.0.1 uniquement) ---
call npm run -s demarrer
echo.
echo Le studio s'est arrete.
pause
exit /b 0

:erreur
echo.
pause
exit /b 1
