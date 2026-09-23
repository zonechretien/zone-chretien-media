@echo off
REM Rend visible le Node portable pour la fenetre en cours uniquement.
REM Recherche, dans l'ordre :
REM   1. runtime\node\ a la racine du disque du studio (installation normale) ;
REM   2. runtime\node\ a cote du depot ;
REM   3. un Node deja present dans le PATH (poste de developpement).
REM Ne modifie jamais le PATH de Windows.

set "ZC_NODE="
if exist "%~d0\runtime\node\node.exe" set "ZC_NODE=%~d0\runtime\node"
if not defined ZC_NODE if exist "%~dp0..\..\..\runtime\node\node.exe" set "ZC_NODE=%~dp0..\..\..\runtime\node"

if defined ZC_NODE (
    set "PATH=%ZC_NODE%;%PATH%"
    echo Node portable : %ZC_NODE%
    exit /b 0
)

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo Node.js introuvable.
    echo Decompressez le ZIP "Windows Binary" de Node.js 24 LTS dans le dossier
    echo runtime\node\ a la racine du disque ^(on doit avoir runtime\node\node.exe^).
    echo Voir zone-chretien-studio\README.md.
    exit /b 1
)
echo Node du poste : utilise celui deja installe.
exit /b 0
