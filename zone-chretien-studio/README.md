# Zone-Chrétien Reels Studio

Studio local (identifiant `com.lepolo.zc-studio`) : il rend les Reels en MP4 **sur le PC**,
jamais sur Vercel. Les templates vivent dans `../remotion/` et sont partagés avec l'aperçu du CMS.

Développé par Lepolo.

> État : étape 1 — rendu en ligne de commande. Le serveur local, le lanceur
> `LANCER-STUDIO.bat` et le guide complet arrivent à l'étape 2.

## Installation sans droits administrateur

Rien n'est installé dans Windows : tout reste dans le dossier du disque.

1. **Node portable** : télécharger le ZIP « Windows Binary (.zip) » de Node.js 24 LTS sur
   nodejs.org, le décompresser dans `runtime\node\` à la racine du disque (on doit avoir
   `runtime\node\node.exe`).
2. Ouvrir une invite de commandes (`cmd`) **dans le dossier `zone-chretien-studio`**, puis
   rendre Node visible pour cette fenêtre seulement :
   ```bat
   set "PATH=G:\runtime\node;%PATH%"
   ```
   (remplacer `G:` par la lettre actuelle du disque ; ce réglage disparaît à la fermeture de
   la fenêtre, rien n'est modifié dans Windows).
3. Installer les dépendances du studio (une seule fois, connexion Internet requise) :
   ```bat
   npm ci
   ```
4. Télécharger le navigateur de rendu (une seule fois, ~115 Mo, rangé dans
   `node_modules\.remotion\`) :
   ```bat
   npm run navigateur
   ```

Ensuite, le rendu fonctionne **hors ligne** : polices locales (`../public/reels/fonts/`),
navigateur et ffmpeg déjà sur le disque.

## Rendre une vidéo

```bat
npm run rendu:exemple
npm run rendu -- --template Verset --props exemples/verset-long-1-corinthiens-13.json --out out/verset-long.mp4
```

Les chemins sont relatifs au dossier du studio. `Ctrl+C` annule proprement le rendu.
Sortie : MP4 H.264, 1080×1920, 30 i/s, `yuv420p` / `bt709` (format attendu par
Instagram, TikTok et YouTube).

## Licence Remotion

Remotion est gratuit pour un particulier, une association / organisation à but non lucratif
ou une entreprise de 3 personnes au plus ; au-delà, une licence entreprise est obligatoire
(voir <https://remotion.dev/license>). Si vous êtes éligible à la licence gratuite, vous
pouvez le déclarer en définissant `REMOTION_LICENSE_KEY=free-license` avant le rendu
(sinon Remotion affiche simplement un avertissement). C'est à vous de vérifier l'éligibilité.

## Limites connues

- **Chemins longs** : Windows limite les chemins à 260 caractères. Placez le dépôt près de la
  racine du disque (ex. `G:\zone-chretien\`) : le navigateur de rendu est rangé assez
  profondément dans `node_modules\.remotion\`.
- Premier rendu d'une session : ~20 s de préparation des templates (bundle), puis le rendu.
