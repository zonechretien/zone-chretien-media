@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM  Zone-Chretien Media - Lancement rapide du CMS admin
REM  Double-cliquer ce fichier depuis l'explorateur Windows,
REM  ou lancer "npm run lance_app" depuis un terminal.
REM  Aucun droit administrateur requis.
REM ============================================================

set "PORT=3000"
set "LOGIN_URL=http://localhost:%PORT%/admin/login"
set "MAX_TRIES=60"

echo ============================================
echo   Zone-Chretien Media - Lancement du CMS
echo ============================================
echo.
echo Demarrage du serveur de developpement (npm run dev)...
echo (une nouvelle fenetre va s'ouvrir - ne pas la fermer)
echo.

start "Zone-Chretien - Serveur dev (ne pas fermer)" cmd /k "cd /d "%~dp0" && npm run dev"

echo Attente que le serveur soit pret sur le port %PORT%...

set /a TRIES=0

:waitloop
set /a TRIES+=1
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://localhost:%PORT%' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto ready

if !TRIES! GEQ %MAX_TRIES% (
    echo.
    echo Le serveur met plus de temps que prevu a demarrer.
    echo Ouverture du navigateur quand meme - reessayez si la page ne charge pas encore.
    goto ready
)

REM "ping" sert ici de minuteur portable (~2s) : contrairement a "timeout",
REM il ne requiert pas de console interactive et fonctionne dans tous les cas.
ping -n 3 127.0.0.1 >nul
goto waitloop

:ready
echo.
echo Serveur pret. Ouverture de la page de connexion du CMS...
start "" "%LOGIN_URL%"

echo.
echo Termine ! Cette fenetre va se fermer.
echo Le serveur continue de tourner dans la fenetre "Zone-Chretien - Serveur dev".
ping -n 4 127.0.0.1 >nul

endlocal
