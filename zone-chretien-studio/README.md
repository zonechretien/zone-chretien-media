# Zone-Chrétien Reels Studio

Studio local (identifiant `com.lepolo.zc-studio`) : il sert la bibliothèque de médias du disque
externe à l'éditeur de Reels du CMS et rend les vidéos MP4 **sur le PC**, jamais sur Vercel.
Les templates vivent dans `../remotion/` et sont partagés avec l'aperçu du CMS : l'aperçu et
le MP4 sont produits par le même code.

Développé par Lepolo.

---

## 1. Organisation du disque externe

```
G:\                                  (la lettre peut changer : D:, E:, F:, G:…)
├── Zone-Chretien-Studio\            BIBLIOTHÈQUE : le seul dossier que le studio lit et écrit
│   ├── zc-studio.json               repère de la bibliothèque (créé par PREPARER-DISQUE.bat)
│   ├── Fonds\                       images et vidéos de fond (.jpg .png .webp .mp4 .mov .webm)
│   ├── Musiques\                    musiques (.mp3 .m4a .aac .wav .ogg)
│   ├── VoixOff\                     voix off enregistrées depuis l'éditeur
│   ├── Logos\                       logos (.png .jpg .webp)
│   ├── Polices\                     polices supplémentaires (.ttf .otf .woff .woff2)
│   ├── Exports\                     vidéos MP4 exportées
│   └── .zc-cache\                   miniatures générées (peut être supprimé sans risque)
├── (vos autres dossiers)            jamais lus par le studio
├── runtime\
│   ├── node\                        Node.js portable (node.exe)
│   └── git\                         PortableGit (facultatif)
└── zone-chretien\                   clone du dépôt du CMS
    └── zone-chretien-studio\        ← ce dossier
        ├── LANCER-STUDIO.bat
        └── PREPARER-DISQUE.bat
```

Le studio cherche `<lecteur>:\Zone-Chretien-Studio\zc-studio.json` sur chaque lecteur (C: à Z:)
et ne sert que le contenu de ce dossier : le reste du disque n'est jamais lu. Pour un autre
nom de dossier, créer `zone-chretien-studio\config.local.json` (non versionné) :
`{ "dossierBibliotheque": "Mon-Dossier" }` — un seul nom de dossier, sans `\ / :`.

Tous les médias sont référencés par **chemin relatif** au dossier de la bibliothèque
(ex. `Musiques/adoration-douce.mp3`) : aucun chemin absolu ni lettre de lecteur n'est
enregistré, le disque peut changer de lettre d'un branchement à l'autre.

> Disque préparé avec une version précédente (repère `zc-studio.json` à la racine) : relancer
> `PREPARER-DISQUE.bat`, puis déplacer `Fonds\`, `Musiques\`, `VoixOff\`, `Logos\`, `Polices\`
> et `Exports\` dans `Zone-Chretien-Studio\` et supprimer l'ancien `zc-studio.json` de la racine.

> Gardez le dépôt **près de la racine** du disque (`G:\zone-chretien\`) : Windows limite les
> chemins à 260 caractères et le navigateur de rendu est rangé assez profondément.

## 2. Installation initiale, sans droits administrateur

Rien n'est installé dans Windows : pas d'installateur, pas de registre, pas de service, pas
de variable d'environnement système. Tout reste sur le disque.

1. **Node.js portable** — sur <https://nodejs.org/fr/download>, télécharger Node.js **24 LTS**,
   format « Windows Binary (.zip) » 64 bits. Décompresser le ZIP puis renommer le dossier
   obtenu en `node`, placé dans `G:\runtime\` : on doit avoir `G:\runtime\node\node.exe`.
2. **Récupérer le dépôt** — deux possibilités :
   - *avec Git* (recommandé, permet les mises à jour) : si Git n'est pas installé sur le PC,
     prendre **PortableGit** sur <https://git-scm.com/downloads/win> (fichier
     `PortableGit-…-64-bit.7z.exe`). C'est une archive auto-extractible : l'exécuter et
     choisir `G:\runtime\git` comme dossier de destination (aucun droit administrateur
     demandé). Lancer ensuite `G:\runtime\git\git-bash.exe` et taper :
     ```bash
     cd /g/
     git clone <adresse-du-dépôt> zone-chretien
     cd zone-chretien
     git checkout reels-studio      # tant que le module n'est pas fusionné
     ```
   - *sans Git* : télécharger le ZIP du dépôt sur GitHub et le décompresser dans
     `G:\zone-chretien\`.
3. **Préparer le disque** — double-cliquer `zone-chretien-studio\PREPARER-DISQUE.bat`.
   Au premier lancement, il installe le studio (connexion Internet requise, ~1 minute), puis
   crée `Zone-Chretien-Studio\` avec `zc-studio.json` et les dossiers de la bibliothèque. Il
   ne touche à rien d'autre sur le disque et ne supprime ni n'écrase rien. Pour préparer un
   autre disque que celui du studio : `npm run preparer-disque -- D:`.
4. **Lancer le studio** — double-cliquer `zone-chretien-studio\LANCER-STUDIO.bat`.
   Au premier lancement, il télécharge le navigateur de rendu (~115 Mo, une seule fois, rangé
   dans `zone-chretien-studio\node_modules\.remotion\`). La fenêtre affiche :
   ```
   Zone-Chrétien Reels Studio — développé par Lepolo
   Adresse : http://127.0.0.1:4317
   Disque  : Bibliothèque Zone-Chrétien (G:\Zone-Chretien-Studio)
   ```
   **Laisser cette fenêtre ouverte** pendant l'utilisation de l'éditeur ; `Ctrl+C` ou la
   fermeture de la fenêtre arrête le studio.

Ensuite, tout fonctionne **hors connexion** pour le rendu : polices locales
(`../public/reels/fonts/`), navigateur de rendu et ffmpeg déjà sur le disque.

Pour vérifier l'état à tout moment : ouvrir <http://127.0.0.1:4317> dans le navigateur
(disque, navigateur de rendu, sites autorisés, bouton « Réessayer », écran À propos).

## 3. Mettre à jour les templates

```bash
cd /g/zone-chretien
git pull
```

puis **relancer** `LANCER-STUDIO.bat` : le studio prépare les templates une fois au démarrage.
Si `package.json` du studio a changé, supprimer `zone-chretien-studio\node_modules\` avant de
relancer pour réinstaller les bonnes versions.

## 4. Autoriser l'éditeur du CMS à joindre le studio

L'éditeur (site HTTPS sur Vercel) appelle le studio sur `http://127.0.0.1:4317`.

- **Chrome / Edge (version 142 et plus)** : à la première connexion, le navigateur demande si
  le site peut accéder aux applications et appareils de cet ordinateur / du réseau local
  (autorisation « Local Network Access », appelée « loopback » depuis Chrome 145). Cliquer
  **Autoriser**. En cas de refus par erreur : icône à gauche de l'adresse → Paramètres du site
  → « Réseau local » / « Accès en boucle locale » → Autoriser, puis recharger la page.
- **Firefox** : non testé à ce jour (le comportement sera vérifié avec l'éditeur, étape 3).
- **Safari** : non pris en charge (le studio est prévu pour un PC Windows).

Sites autorisés : `config.json` → `originesAutorisees`, qui ne contient **que les sites HTTPS
du CMS** (production Vercel et zone-chretien.org ; vérifié par un test). Pour ajouter d'autres
adresses **exactes** sans modifier le dépôt, créer `config.local.json` (non versionné, à côté
de `config.json`) ; ses origines s'ajoutent à celles de `config.json` :

- un déploiement de prévisualisation Vercel ;
- le serveur de développement local du CMS (`npm run dev`), **uniquement sur un PC de
  développement** : sans cette ligne, l'éditeur ouvert sur `http://localhost:3000` ne peut
  pas joindre le studio.

```json
{
  "originesAutorisees": [
    "https://zone-chretien-media-git-reels-studio-xxxx.vercel.app",
    "http://localhost:3000"
  ]
}
```

Relancer `LANCER-STUDIO.bat` après toute modification : la page <http://127.0.0.1:4317>
affiche la liste des sites autorisés effectivement prise en compte.

Pas de caractères génériques (`*`) : n'importe qui pouvant créer un projet Vercel au nom
proche, seules des adresses exactes sont acceptées. `http://localhost:3000` n'est pas dans
`config.json` : toute application lancée sur ce port du PC (un autre projet, par exemple)
pourrait sinon piloter le studio.

## 5. Sécurité

- Écoute **uniquement sur 127.0.0.1** : le studio n'est pas visible depuis le réseau, aucune
  règle de pare-feu n'est nécessaire.
- En-tête `Host` vérifié (protection contre le « DNS rebinding »).
- CORS limité aux sites autorisés ; toute requête d'écriture exige l'en-tête `X-ZC-Studio`,
  ce qui oblige le navigateur à demander l'autorisation au studio : un site non autorisé ne
  peut ni lancer un rendu ni déposer un fichier.
- Médias en **lecture seule**, limités à la bibliothèque : chemins `..`, chemins absolus,
  lettres de lecteur, dossiers cachés et liens symboliques / jonctions qui sortent du dossier
  `Zone-Chretien-Studio` sont refusés ; un dossier de bibliothèque qui serait lui-même un lien
  ou une jonction est ignoré. Le reste du disque n'est jamais lu.
- Seul le dossier `VoixOff/` reçoit des fichiers (voix off, 50 Mo maximum), jamais
  d'écrasement ; les exports vont dans `Exports/`.

## 6. Interface du studio (pour l'éditeur du CMS)

| Méthode | Adresse | Rôle |
|---|---|---|
| GET | `/api/etat` | Version, disque détecté, navigateur de rendu, synchronisation (Whisper), rendus en cours |
| POST | `/api/disque/detecter` | « Réessayer » la détection du disque |
| GET | `/api/bibliotheque` | Médias par dossier (`Fonds`, `Musiques`, …) |
| GET | `/api/miniature?chemin=…` | Miniature JPEG (images et vidéos), mise en cache |
| GET | `/api/media-info?chemin=…` | Type et durée d'un média |
| GET | `/media/<chemin>` | Fichier du média (requêtes `Range` prises en charge) |
| POST | `/api/rendus` | Lancer un export `{ templateId, titre, props }` |
| GET | `/api/rendus`, `/api/rendus/<id>` | Progression des exports |
| POST | `/api/rendus/<id>/annuler` | Annuler un export |
| POST | `/api/voix-off` | Déposer une voix off (corps = audio, `Content-Type: audio/webm`…) ; les enregistrements du navigateur (.webm, .ogg) sont convertis en .m4a (AAC) pour une durée fiable |
| POST | `/api/synchronisations` | Synchroniser le texte sur une voix off `{ chemin: "VoixOff/…", mots: [...], langue: "fr" \| "ht" }` (voir §11) |
| GET | `/api/synchronisations/<id>` | Progression et résultat (minutage de chaque mot, confiance, silence retiré) |
| POST | `/api/synchronisations/<id>/annuler` | Annuler une synchronisation |

Les requêtes POST doivent porter l'en-tête `X-ZC-Studio: 1`. Les erreurs sont renvoyées en
JSON `{ "erreur": "message en français" }`.

## 7. Rendu en ligne de commande (dépannage)

Depuis une invite de commandes dans ce dossier, après
`set "PATH=G:\runtime\node;%PATH%"` (valable pour cette fenêtre seulement) :

```bat
npm run rendu:exemple
npm run rendu -- --template Verset --props exemples/verset-long-1-corinthiens-13.json --out out/verset-long.mp4
npm run rendu -- --template Evenement --format 16:9 --out out/evenement.mp4
npm run apercus
```

Templates : `Verset`, `Priere`, `Devotion`, `Citation`, `Evenement` ; formats `9:16`, `1:1`, `16:9`.
Sans `--props`, les valeurs d'exemple du template sont utilisées. `npm run apercus` produit des
images fixes de tous les templates dans tous les formats (`out/apercus/`), pratique pour vérifier
la mise en page après un changement de charte.

Sortie : MP4 H.264, 1080×1920, 30 i/s, `yuv420p` / `bt709` (format attendu par Instagram,
TikTok et YouTube). `Ctrl+C` annule proprement.

## 8. Messages d'erreur

| Message | Que faire |
|---|---|
| Disque Zone-Chrétien non détecté… | Brancher le disque, puis « Réessayer ». Vérifier que `Zone-Chretien-Studio\zc-studio.json` existe à la racine du disque (sinon `PREPARER-DISQUE.bat`) |
| Média introuvable : … | Le fichier a été déplacé ou renommé sur le disque |
| Format de média non supporté | Convertir le fichier (voir les formats au §1) |
| Espace disque insuffisant… | Libérer au moins 500 Mo sur le disque |
| Navigateur de rendu absent… | Se connecter une fois à Internet et relancer le studio |
| Le port 4317 est déjà utilisé… | Le studio est déjà ouvert dans une autre fenêtre |
| Rendu annulé. | Annulation demandée ; aucun fichier incomplet n'est laissé |
| Synchronisation automatique non installée… | Lancer `INSTALLER-WHISPER.bat` une fois (connexion Internet requise), puis relancer le studio |
| Windows bloque l'exécution de whisper.cpp… | Règle de sécurité du PC : utiliser le calage manuel de l'éditeur |

## 9. Licence Remotion

Remotion est gratuit pour un particulier, une association / organisation à but non lucratif
ou une entreprise de 3 personnes au plus ; au-delà, une licence entreprise est obligatoire
(voir <https://remotion.dev/license>). Si vous êtes éligible à la licence gratuite, vous
pouvez le déclarer en définissant `REMOTION_LICENSE_KEY=free-license` avant le rendu
(sinon Remotion affiche simplement un avertissement). C'est à vous de vérifier l'éligibilité.

## 10. Limites connues

- Le studio prépare les templates au démarrage (~20 s) : un `git pull` demande de le relancer.
- Un seul rendu à la fois (les suivants attendent leur tour) : le rendu utilise déjà tous les
  cœurs du PC.
- Vidéos de fond : elles bouclent si l'éditeur fournit leur durée (`mediaDurationSeconds`,
  donnée par `/api/media-info`) ; sinon elles ne sont pas rejouées une fois terminées.
- ffmpeg livré avec Remotion (miniatures, durées) : version allégée, suffisante pour ces usages.
- Synchronisation automatique : voir les limites au §11.

## 11. Synchronisation du texte sur la voix off (Whisper)

L'éditeur peut caler le texte affiché sur la voix off, **mot par mot**, de deux façons :

- **automatiquement** : le studio analyse la voix avec [whisper.cpp](https://github.com/ggml-org/whisper.cpp)
  (reconnaissance vocale hors ligne, sur ce PC). Whisper ne sert **qu'au minutage** : le texte
  affiché reste toujours celui de l'éditeur, les erreurs de reconnaissance n'apparaissent jamais
  à l'écran. Les mots entendus sont alignés sur le texte exact (`remotion/lib/sync/align.ts`) :
  mots ajoutés à l'oral (« Amen ») ou non lus tolérés, nombres lus en toutes lettres reconnus
  en français et en créole (« Jean 3:16 » ≈ « Jean trois seize » ≈ « Jan twa sèz ») ;
- **à la main** : on écoute la voix et on appuie sur Espace au début de chaque phrase ; ce mode
  corrige aussi un résultat automatique.

Le silence du début de l'enregistrement est retiré automatiquement (on garde 0,25 s avant la
parole). Chaque synchronisation reçoit un **indice de confiance** (part du texte retrouvée dans
la voix) : sous 60 %, l'éditeur ne l'applique pas sans votre accord et propose le calage manuel.

### Installation (une seule fois, sans droits administrateur)

Double-cliquer `INSTALLER-WHISPER.bat` (ou `INSTALLER-WHISPER.bat small` pour un autre
modèle), puis relancer `LANCER-STUDIO.bat`. Le script télécharge whisper.cpp **1.9.4**
(exécutables Windows officiels, ~5 Mo) et le modèle, vérifie leur empreinte **SHA-256** et
range tout dans `zone-chretien-studio\.whisper\` (non versionné, jamais envoyé à Vercel). Rien
n'est installé dans Windows. L'exécutable n'est pas signé : s'il est bloqué par une règle de
sécurité du PC, le calage manuel reste disponible.

Pour forcer un modèle quand plusieurs sont installés : `"modeleWhisper": "small"` dans
`config.local.json`. Sinon le studio prend le meilleur présent (large-v3-turbo, medium, small, tiny).

### Modèles mesurés sur ce PC (Intel Core Ultra 7 155U, processeur seul)

Voix de référence de 71 s dont l'instant de chaque mot est connu (synthèse vocale Windows) :

| Modèle | Taille | Temps pour 71 s | ≈ pour 60 s | Écart moyen par mot* |
|---|---|---|---|---|
| tiny | 78 Mo | 7 s | 6 s | 0,09 s |
| small | 488 Mo | 32 à 50 s | 30 à 40 s | 0,08 s |
| medium | 1,5 Go | 155 s | 130 s | 0,10 s |
| large-v3-turbo | 1,6 Go | 128 à 174 s | 110 à 150 s | 0,09 s |

\* après correction du retard propre à chaque modèle (`offsetSeconds` dans `src/whisper.ts`).
Le temps total comprend la conversion de la voix et l'alignement (quelques secondes).
Les gros modèles ne sont pas plus précis pour le minutage : ils **reconnaissent mieux** les
mots (utile pour le créole haïtien et les voix difficiles), ce qui donne plus de repères sûrs.

### Limites

- Créole haïtien : Whisper a été entraîné sur très peu de créole ; la reconnaissance est
  nettement moins bonne qu'en français. Le texte affiché reste juste, mais le minutage peut
  être moins précis : vérifier l'aperçu et corriger au besoin avec le calage manuel.
- Le texte lu doit être le texte affiché : les passages improvisés sont ignorés ; un texte
  affiché mais non lu (un titre, par exemple) reçoit un minutage estimé et est signalé.
- Un seul calcul à la fois ; le processeur est très sollicité pendant l'analyse.
