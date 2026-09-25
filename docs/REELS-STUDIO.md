# Zone-Chrétien Reels Studio — guide complet

Module de création de Reels (prière, dévotion, verset, citation, annonce d'événement) du CMS
Zone-Chrétien Media. Développé par Lepolo — identifiant du studio local : `com.lepolo.zc-studio`.

Spécification d'origine : [`SPEC-REELS-STUDIO.md`](SPEC-REELS-STUDIO.md).

---

## 1. Principe

```
[CMS sur Vercel — navigateur]
  /admin/reels : liste, création, formulaire, aperçu en direct (@remotion/player)
  Projets enregistrés dans Turso (table reel_projects)
        │  fetch depuis le navigateur vers http://127.0.0.1:4317
        ▼
[Studio local sur le PC — Node portable, sans droits admin]
  Détecte la bibliothèque, sert les médias (lecture seule), reçoit les voix off,
  rend les MP4 (@remotion/renderer), les enregistre dans Exports/
        ▼
[Disque externe]  X:\Zone-Chretien-Studio\  zc-studio.json · Fonds/ · Musiques/ · VoixOff/ · Logos/ · Polices/ · Exports/
```

- **Bibliothèque = un dossier dédié**, `Zone-Chretien-Studio` à la racine d'un lecteur, qui
  contient le repère `zc-studio.json`. Le studio le cherche sur chaque lecteur (C: à Z:),
  quelle que soit la lettre, et **ne lit jamais rien d'autre sur le disque** : les autres
  dossiers et fichiers du disque (documents personnels…) restent inaccessibles. Le nom du
  dossier se change dans `zone-chretien-studio/config.local.json` :
  `{ "dossierBibliotheque": "Mon-Dossier" }` (un seul nom de dossier, sans `\ / :`).
- **Sécurité du service des médias** : chemins relatifs uniquement, sans `..`, lettre de
  lecteur, URL ni dossier caché ; fichier résolu obligatoirement sous le dossier de la
  bibliothèque, y compris après résolution des liens symboliques et jonctions ; un dossier de
  bibliothèque qui serait lui-même un lien ou une jonction est ignoré.

- **Vercel ne touche jamais aux vidéos** : il sert l'éditeur et enregistre les projets. Les
  médias et les MP4 restent sur le disque externe.
- **Aperçu = MP4** : les templates (`remotion/`) sont le même code pour l'aperçu du CMS et
  pour le rendu du studio.
- **Chemins relatifs au dossier de la bibliothèque uniquement** (`Musiques/douce.mp3`,
  `Exports/…mp4`) : la lettre du disque peut changer.

## 2. Fichiers ajoutés

```
remotion/                        templates partagés (aperçu du CMS ET rendu du studio)
  brand.ts                       charte : couleurs, thèmes par template, polices, logo, lisibilité
  brand.test.ts                  contrastes (WCAG), polices OFL présentes, monogramme valide
  formats.ts                     9:16, 1:1, 16:9 et zones sûres
  schemas.ts                     schémas zod des 5 templates (+ libellés du formulaire)
  template-meta.ts               registre des templates (sans React : utilisable côté serveur)
  templates.ts                   registre + composants (aperçu et rendu)
  templates/specs.ts             props d'un template → écrans
  engine/                        moteur commun : mise en page (layout.ts), rendu (ReelScreens.tsx)
  components/                    fond, logo, écran de fin, bande son, zones sûres, apparition mot par mot
  lib/                           ajustement du texte, minutage, typographie, audio, dates
  Root.tsx, index.ts             point d'entrée du rendu
public/reels/fonts/              polices locales (OFL) — rendu hors ligne
public/reels/logo/monogramme.svg monogramme « ZC » vectoriel, sans fond (en-tête et écran de fin)
design/logo/source/              images de référence du logo officiel (versionnées, jamais
                                 servies par le site ni envoyées à Vercel : .vercelignore)
src/app/admin/reels/             pages : liste, nouveau, éditeur
src/components/admin/reels/      éditeur, champs générés, médias, voix off, aperçu, export
src/lib/reels/                   client du studio, générateur de formulaire, « Transformer en Reel »
src/lib/bible/                   Bible LSG 1910 hors ligne : analyseur de références, lecture du texte
src/lib/actions/reels.ts         actions serveur (création, enregistrement, export, transformation)
prisma/migrations/…_add_reel_projects/   table reel_projects (seule modification de la base)
zone-chretien-studio/            studio local (projet Node séparé, jamais construit par Vercel)
  LANCER-STUDIO.bat, PREPARER-DISQUE.bat, README.md, src/…
docs/BIBLE-LSG1910.md            source, licence et vérification de la Bible
```

## 3. Installation sur le PC (sans droits administrateur)

Tout est détaillé pas à pas dans [`zone-chretien-studio/README.md`](../zone-chretien-studio/README.md).
En résumé :

1. Décompresser **Node.js 24 LTS** (ZIP « Windows Binary ») dans `G:\runtime\node\`.
2. Copier le dépôt dans `G:\zone-chretien\` (avec PortableGit ou le ZIP de GitHub).
3. Double-cliquer `zone-chretien-studio\PREPARER-DISQUE.bat` (une fois) : crée
   `G:\Zone-Chretien-Studio\` avec `zc-studio.json` et ses sous-dossiers, sans toucher au reste
   du disque. Pour un autre disque : `npm run preparer-disque -- D:`.
4. Double-cliquer `zone-chretien-studio\LANCER-STUDIO.bat` à chaque utilisation.
5. Dans Chrome / Edge, à la première connexion de l'éditeur au studio : **Autoriser** l'accès
   aux appareils de cet ordinateur (« Local Network Access »).

## 4. Utilisation dans le CMS

1. **Reels → Nouveau Reel** : titre, template, format.
2. **Éditeur** : le formulaire est généré depuis le template ; l'aperçu se met à jour en direct.
   - *Fond* : dégradé, couleur, image ou vidéo du disque (la vidéo boucle si elle est courte).
   - *Référence biblique* : taper « Ps 34.8 », « Jn 3:16-17 », « 1 Co 13:4 »… puis
     **Insérer le texte LSG 1910** (texte et référence mise en forme).
   - *Musique* : fichier de `Musiques/`, volume, fondus.
   - *Voix off* : fichier de `VoixOff/` ou **enregistrement au micro** ; la musique baisse
     automatiquement pendant la voix ; la durée peut être calée sur la voix.
   - *Durée* : automatique (selon le texte), imposée, ou calée sur la voix off.
   - *Zones sûres* : bouton « Afficher les zones sûres » (jamais visibles dans le MP4).
3. **Enregistrer**, puis **Exporter en MP4** : progression, annulation ; la vidéo est rangée dans
   `Exports/` du disque et le projet passe au statut « Exporté ».
4. **Transformer en Reel** (pages de modification des contenus) :

| Contenu | Template | Prérempli avec |
|---|---|---|
| Verset du jour | Verset | référence mise en forme, texte |
| Dévotion | Dévotion | titre, verset, réflexion, appel à l'action |
| Prière | Prière | titre, texte |
| Inspiration | Citation | texte, auteur (« Zone-Chrétien » par défaut) |
| Témoignage | Citation | texte, nom |
| Article | — | « Fonction en développement » |

« LSG 1910 » n'est affiché que si le texte du contenu est vraiment celui de la LSG 1910.

## 5. Templates et formats

| Template | Écrans |
|---|---|
| Verset / Inspiration | verset (mot par mot, sur plusieurs écrans si long) + référence |
| Prière | titre → prière → verset facultatif |
| Dévotion | titre → verset + référence → réflexion → appel à l'action |
| Citation | citation + « — auteur » |
| Annonce d'événement | nom → date / heure / lieu → description → appel à l'action (visuel en fond) |

Tous : formats **9:16** (1080×1920), **1:1** (1080×1080), **16:9** (1920×1080), 30 i/s ;
accroche dès la première image ; marque et libellé en haut ; écran de fin avec logo et
« zone-chretien.org » ; texte hors des zones sûres ; taille ajustée automatiquement et
découpage en plusieurs écrans (jamais de débordement — vérifié par les tests sur les 300 versets
les plus longs de la Bible et sur tous les champs à longueur maximale).

Aperçus fixes de tous les templates : `npm run apercus` dans `zone-chretien-studio`
(images dans `out/apercus/`).

## 6. Charte des Reels

Alignée sur la charte du site public (tokens `--brand-*` de `src/app/globals.css`) et sur le
logo officiel. Tout passe par `remotion/brand.ts` : aucune couleur ni police en dur dans les
compositions.

- **Couleurs** : fonds bleu nuit `#0A1628` / `#132238` / `#1A3055`, or `#E8A020` (accroche,
  référence, filets, pictogrammes, bouton), or clair `#F5C842`, texte `#F5F7FA`, texte
  secondaire `#C3CCDA`. Le bleu `#2D7DD2` et l'argent ne servent qu'au décor.
- **Thème par template** (dégradé par défaut des nouveaux projets + couleur d'accent), pour
  reconnaître le type de contenu dans un fil : Verset bleu nuit / or, Prière indigo / or clair,
  Dévotion bleu pétrole / or, Citation ardoise / argent, Événement bleu roi / or.
- **Lisibilité sur téléphone** : contrastes vérifiés par `brand.test.ts` (texte principal ≥ 7:1,
  tout autre texte ≥ 4,5:1, sur chaque dégradé). Sur une photo ou une vidéo du disque, voile
  bleu nuit d'au moins 0,65 et légère ombre sous le texte, quel que soit le réglage
  « Assombrissement ».
- **Polices** (fichiers locaux, SIL Open Font License 1.1, intégration dans des vidéos
  autorisée) : Playfair Display (titres, textes bibliques), DM Sans (libellés, texte courant),
  Bebas Neue (logotype « ZONE-CHRÉTIEN », toujours avec l'accent).
- **Logo** : `public/reels/logo/monogramme.svg`, plat et sans fond. Z et C géométriques
  mesurés sur le logo officiel, silhouette au micro décalquée (potrace), liseré or fin. Logo
  officiel créé par Lepolo avec ChatGPT (OpenAI) pour Zone-Chrétien ; le monogramme vectoriel
  en est une reproduction. En-tête :
  6,2 % de la largeur ; écran de fin : 24 %, avec la devise « Inspiré par la foi, animé par la
  Parole ».
- **Mise en page** : bloc (en-tête, texte, référence) centré sur l'image sans jamais sortir de
  la zone sûre ; écart constant entre un texte et sa référence ou son auteur.

Après une modification : `npm test`, puis `npm run apercus` dans `zone-chretien-studio` pour
vérifier tous les templates d'un coup (ou `npm run apercus -- --plan <plan.json> --sortie
<dossier>` pour des images précises, par exemple avec les textes de
`exemples/apercus-charte.json`), et relancer le studio.

## 7. Base de données

Une seule table ajoutée, `reel_projects` (migration `20260923120000_add_reel_projects`,
uniquement `CREATE TABLE` + 2 index) — **appliquée sur Turso production le 23/09/2026**.
Les props de chaque projet sont une chaîne JSON validée par le schéma zod du template.

**Sauvegarde de la base Turso** (avant une fusion ou une migration) :

1. app.turso.tech → base `zone-chretien-media` → **Create Token** → jeton **en lecture seule**.
2. À la racine du dépôt, fichier `.env.backup` (ignoré par Git grâce à la règle `.env*`) :
   `TURSO_BACKUP_URL="libsql://…turso.io"` et `TURSO_BACKUP_TOKEN="…"`.
3. **7-Zip en ligne de commande, sans installation** (une fois) : `outils\7zip\7za.exe`, dossier
   ignoré par Git et par Vercel. Sur <https://www.7-zip.org/download.html>, prendre `7zr.exe` et
   « 7-Zip Extra » (`7z<version>-extra.7z`), puis `7zr.exe e 7z<version>-extra.7z x64\7za.exe`
   et ranger `7za.exe` (et `License.txt`) dans `outils\7zip\`. Installé le 24/09/2026 :
   version 26.03, empreintes SHA-256 contrôlées avec celles de la publication GitHub officielle
   (`ip7z/7zip`).
4. **Dans PowerShell** (pas dans Git Bash : la saisie masquée demande un vrai terminal) :
   `npm run db:backup` → `Documents\Sauvegardes-Turso\<base>_<date>.7z` dans le profil Windows
   (ou `--out <dossier>`). Le script refuse tout dossier situé dans le dépôt Git ou dans la
   bibliothèque de médias du studio (`<lecteur>:\Zone-Chretien-Studio` sur n'importe quelle
   lettre, ou sous un `zc-studio.json`, y compris via un lien ou une jonction ; le reste du
   disque externe est accepté), vérifie la sauvegarde en la rechargeant (« Sauvegarde
   vérifiée »), puis la **chiffre** :
   - mot de passe demandé **deux fois**, rien ne s'affiche pendant la saisie (12 caractères
     minimum) ; il n'est jamais passé en argument de commande, écrit dans un fichier ni
     affiché : il est transmis à 7-Zip par son entrée standard ;
   - archive `.7z` en **AES-256** avec **noms de fichiers chiffrés** (`-mhe=on`) ;
   - archive testée (test d'intégrité, puis déchiffrement complet comparé octet pour octet au
     `.sql`) ; **seulement si le test réussit**, le `.sql` en clair est supprimé définitivement
     (pas de corbeille). Sinon il est conservé et le script l'indique clairement ;
   - `--copie <dossier>` (ex. `npm run db:backup -- --copie D:\Sauvegardes`) copie en plus
     l'archive chiffrée et vérifie la copie. Mêmes refus : jamais dans `Zone-Chretien-Studio`
     ni dans le dépôt. Rien n'est jamais écrasé.
   - **Vérification en échec** (« Sauvegarde INCOMPLÈTE ») : la sauvegarde est quand même
     chiffrée de la même façon, sous le nom `<base>_<date>_NON-VERIFIEE.7z`, et n'est pas
     copiée avec `--copie`. Si ce chiffrement est impossible (mot de passe non saisi, 7-Zip en
     échec), le `.sql` est **supprimé** : une sauvegarde non vérifiée ne reste jamais en clair.
     Dans les deux cas, corriger le problème affiché et relancer `npm run db:backup` ; une
     archive `…_NON-VERIFIEE.7z` ne sert qu'à examiner le problème, jamais à restaurer.

   ⚠ **Sans le mot de passe, la sauvegarde est irrécupérable.** Le noter dans un endroit sûr
   (gestionnaire de mots de passe), jamais dans le dépôt. Un mot de passe accentué fonctionne
   aussi dans la fenêtre de 7-Zip (7-Zip lit l'entrée en UTF-8).
5. **Sauvegardes `.sql` déjà présentes** : `npm run db:chiffrer` chiffre tous les `.sql` de
   `Documents\Sauvegardes-Turso` avec la même méthode (un seul mot de passe, demandé deux fois) ;
   options `--dossier <dossier>` et `--copie <dossier>`. Un `.sql` dont le `.7z` existe déjà
   est ignoré.
6. Restauration, toujours dans une nouvelle base : déchiffrer dans un dossier sûr (hors dépôt
   et hors `Zone-Chretien-Studio`) avec `outils\7zip\7za.exe e <archive.7z> -o<dossier>`
   (mot de passe demandé), puis
   `turso db create zone-chretien-media-restauree --from-dump <fichier.sql>`, et supprimer le
   `.sql` déchiffré ensuite.

**Base de prévisualisation** (déploiements Preview de la branche `reels-studio`) : base Turso
séparée `zone-chretien-media-preview` (même organisation et même groupe que la production),
remplie depuis une sauvegarde vérifiée :

1. Fichier `.env.preview-restore` (non versionné) : `TURSO_PREVIEW_URL` et `TURSO_PREVIEW_TOKEN`
   (jeton lecture/écriture de la base preview uniquement).
2. `npm run db:restore-preview -- --fichier <sauvegarde.sql>` (déchiffrer d'abord l'archive
   `.7z` comme pour une restauration, puis supprimer le `.sql`) : recharge d'abord la sauvegarde
   dans une base locale temporaire, puis la restaure et vérifie chaque table et la recherche
   biblique. Refuse l'URL de production, toute base qui ne s'appelle pas
   `zone-chretien-media-preview` et toute base non vide.
3. Vercel → variables `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (base preview) et `AUTH_SECRET`
   (distinct de la production) pour l'environnement **Preview, branche `reels-studio`**
   uniquement.

⚠ Ne pas utiliser `prisma migrate dev` dans ce dépôt : il propose de supprimer les tables de
recherche de la Bible (`bible_verses_fts*`), créées hors Prisma. Générer les migrations avec
`prisma migrate diff --from-schema <ancien> --to-schema prisma/schema.prisma --script`.

## 8. Dépendances (versions exactes)

| Paquet | Version | Où |
|---|---|---|
| remotion, @remotion/player, @remotion/fonts | 4.0.527 | CMS |
| remotion, @remotion/bundler, @remotion/renderer, @remotion/fonts | 4.0.527 | studio |
| react / react-dom | 19.1.0 | CMS et studio |
| zod | 4.4.3 | CMS et studio |
| tsx | 4.23.15 | studio |
| vitest | 4.1.11 | CMS et studio (tests) |
| typescript | 5.9.3 | CMS et studio |
| Node.js portable | 24 LTS (testé 24.21.0) | disque externe |

Navigateur de rendu : Chrome Headless Shell téléchargé par Remotion (une fois, ~115 Mo) ;
ffmpeg / ffprobe : ceux livrés avec Remotion.

**Licence Remotion** : gratuite pour un particulier, une association ou une entreprise de 3
personnes au plus ; au-delà, licence entreprise obligatoire (<https://remotion.dev/license>).
À vérifier par vous. Si éligible : `REMOTION_LICENSE_KEY=free-license` avant le rendu.

## 9. Tests

```bash
npx vitest run                      # CMS : templates, moteur, Bible, formulaire, sources
cd zone-chretien-studio && npx vitest run   # studio : disque, chemins, Range, CORS, file d'exports
```

## 10. Bilan

**Fonctionnel (testé)** : les 5 templates dans les 3 formats ; aperçu en direct identique au MP4 ;
export MP4 local avec progression et annulation ; studio local sécurisé (127.0.0.1, Host, CORS,
chemins) ; détection du disque quelle que soit sa lettre ; bibliothèque avec miniatures ;
fonds image / vidéo en boucle ; musique avec fondus et boucle ; voix off (fichier ou micro,
conversion .m4a) avec baisse automatique de la musique et durée calée ; Bible LSG 1910 hors
ligne avec analyseur de références ; « Transformer en Reel » pour 5 types de contenus ;
lanceurs sans droits administrateur.

**Hors périmètre V1 / à développer** : IA (textes Ollama, sous-titres Whisper, voix de
synthèse), timeline libre, Remotion Lambda, application mobile, publication automatique sur
les réseaux sociaux, template pour les articles.

**Limites connues**
- Ajustement du texte par estimation (pas de mesure dans le navigateur) : volontairement
  prudent, identique à l'aperçu et au rendu.
- Pas de normalisation du volume des voix off (réglage du volume à la main).
- Le studio prépare les templates au démarrage : relancer le studio après un `git pull`.
- Un export à la fois ; ~30 à 60 s par vidéo selon la durée et le PC.
- Chemins Windows limités à 260 caractères : garder le dépôt près de la racine du disque.
- Service worker du site : il laisse passer sans les intercepter les requêtes vers le studio
  local (`127.0.0.1`, `localhost`) ; sinon Chrome ne peut pas afficher la demande d'accès au
  réseau local et l'éditeur reste « Studio local non connecté » sur le site HTTPS.
- Accès au studio depuis le site HTTPS : Chrome / Edge demandent une autorisation ; Safari non
  pris en charge ; Firefox non testé.
- Numérotation des versets alignée sur le site (titres des psaumes inclus dans le verset 1).
- Le service worker du site (Serwist) reste actif en développement et peut servir des pages
  en cache : après une modification, recharger sans cache si l'affichage semble ancien.
