# PROMPT CLAUDE CODE — ZONE-CHRÉTIEN REELS STUDIO (V1)

> À placer dans le dépôt du CMS sous le nom `zone-chretien/docs/SPEC-REELS-STUDIO.md`, puis à donner à Claude Code **une étape à la fois**, en lançant toujours Claude Code depuis la racine `zone-chretien/`.
>
> **Avant de lancer Claude Code :** créer la branche `reels-studio` (`git checkout -b reels-studio`) depuis `zone-chretien/`.
>
> **Première consigne à donner :** « Lis docs/SPEC-REELS-STUDIO.md et réalise uniquement l'étape 0. Le dossier du studio local s'appelle zone-chretien-studio et il est déjà créé à la racine. »

---

## Rôle

Tu es un développeur senior spécialisé en Next.js, React, Remotion et Node.js. Tu travailles sur le dépôt existant du CMS **Zone-Chrétien Media** (Next.js 15, Prisma, Turso, déployé sur Vercel). Tu ajoutes un module de création de Reels. Tu ne casses rien de l'existant.

## Objectif

Permettre de créer des Reels professionnels de **prière, dévotion, verset / inspiration, citation et annonce d'événement** à partir de templates, avec un aperçu en direct dans l'administration du CMS et un export MP4 réalisé **sur le PC local**, jamais sur Vercel.

Le rendu doit être très professionnel : typographie soignée, animations sobres et fluides, identité visuelle Zone-Chrétien cohérente sur chaque vidéo.

---

## Contraintes absolues

1. **Aucun droit administrateur sur le PC Windows.** Rien ne doit nécessiter d'installation système, de modification du registre, de service Windows, de variable d'environnement système ou de droits élevés. Node.js est utilisé en **version portable** (ZIP décompressé). Tout se lance par un fichier `.bat`.
2. **Portabilité totale.** Node portable, le studio local et la bibliothèque de médias doivent pouvoir vivre **sur un disque dur externe**. La lettre du disque peut changer (E:, F:, G:…). Aucun chemin absolu n'est jamais enregistré.
3. **Vercel ne touche jamais aux vidéos.** Vercel héberge uniquement l'éditeur, l'aperçu et les données des projets (dans Turso). Aucun rendu, aucun upload de média vers Vercel.
4. **Offline pour le rendu.** Une fois les dépendances installées et le navigateur de rendu Remotion téléchargé, l'export MP4 doit fonctionner sans connexion Internet. Les polices sont des fichiers locaux, jamais chargées depuis Google Fonts au moment du rendu.
5. **Pas de faux boutons.** Toute fonction non implémentée affiche clairement « Fonction en développement » et ne fait semblant de rien.
6. **Identité développeur.** Identifiant technique `com.lepolo.zc-studio` pour le studio local, et signature visible « Développé par Lepolo » dans l'écran À propos du studio et en pied de page de l'éditeur de Reels.

---

## Organisation du dépôt et du travail

- **Un seul dépôt** : tout le projet vit dans le dépôt du CMS, dossier racine `zone-chretien/`.
- **Claude Code est lancé depuis la racine `zone-chretien/`**, jamais depuis un sous-dossier, car le projet modifie aussi le CMS (pages d'administration, dossier `remotion/`, schéma Prisma, configuration du build).
- **Le dossier `zone-chretien-studio/` existe déjà à la racine.** C'est le studio local (serveur et moteur de rendu sur le PC). Utilise ce nom partout ; ne crée pas d'autre dossier pour ce rôle.
- **Ce qui fait partie du CMS** : le dossier `remotion/` (templates) et les pages `/admin/reels`. Les templates doivent être partagés entre l'aperçu du CMS et le rendu local, pour que l'aperçu soit identique au MP4.
- **Ce qui est séparé du CMS** : `zone-chretien-studio/` a son propre `package.json`. Ses dépendances de rendu (`@remotion/renderer`, `@remotion/bundler`, etc.) ne doivent jamais être installées ni compilées par Vercel.
- **Exclusion du build Vercel et de Next.js** : exclure `zone-chretien-studio/` via `.vercelignore`, du `tsconfig.json` du CMS (vérification TypeScript), et de l'ESLint du CMS si nécessaire. Vérifier que `next build` passe sans ce dossier.
- **Git** : ajouter au `.gitignore` les `node_modules` du studio, les exports MP4, les caches de rendu, le navigateur de rendu téléchargé et le Node portable. Aucun média ni aucune vidéo ne va dans Git.
- **Branche de travail** : tout le travail se fait sur la branche `reels-studio`, jamais directement sur la branche principale. Vercel génère des déploiements de prévisualisation pour tester ; le site en production n'est pas touché avant ma validation et la fusion.
- **Sur le disque externe** : un clone du dépôt, le Node portable (`runtime/node/`) et la bibliothèque de médias. Pour mettre à jour les templates sur le disque : `git pull`. Si Git n'est pas installé sur le PC, utiliser **PortableGit** (fonctionne sans droits administrateur). Documenter cette procédure.

---

## Architecture

```
[CMS sur Vercel — navigateur]
  /admin/reels : liste, création, formulaire, aperçu (@remotion/player)
  Données des projets → Prisma / Turso
        │
        │  fetch vers http://127.0.0.1:<port>
        ▼
[Studio local sur le PC — Node portable]
  - Détecte le disque externe (fichier repère)
  - Sert les médias au navigateur (lecture seule, sécurisé)
  - Reçoit les demandes d'export, rend le MP4 avec @remotion/renderer
  - Enregistre les MP4 dans le dossier Exports du disque
        │
        ▼
[Disque externe]
  zc-studio.json (repère), Fonds/, Musiques/, VoixOff/, Logos/, Polices/, Exports/, runtime/
```

### Organisation du code (à adapter à la structure réelle du dépôt)

```
remotion/                 ← templates partagés (aperçu CMS ET rendu local)
  Root.tsx
  brand.ts                ← couleurs, polices, logo, marges, zones sûres
  compositions/
    Priere.tsx
    Devotion.tsx
    Verset.tsx
    Citation.tsx
    Evenement.tsx
  components/             ← titres animés, fond, logo, barre de marque, etc.
  schemas.ts              ← schémas zod des props de chaque template
zone-chretien-studio/     ← studio local : serveur et moteur de rendu (dossier déjà créé)
  package.json            ← dépendances propres, séparées de celles du CMS
  server.ts
  drive.ts                ← détection du disque + résolution des chemins
  render.ts
  LANCER-STUDIO.bat
src/app/admin/reels/...   ← pages d'administration (adapter au routage existant)
data/bible/lsg1910.json   ← Bible Louis Segond 1910 (domaine public)
```

Les compositions dans `remotion/` sont **la seule source de vérité** : le même code sert à l'aperçu et à l'export, pour que l'aperçu soit identique au MP4 final.

---

## Détails techniques obligatoires

### Remotion
- Utilise la **dernière version stable** de Remotion. Vérifie la documentation actuelle avant d'écrire du code. Toutes les dépendances `remotion` et `@remotion/*` doivent avoir **exactement la même version**.
- Vérifie la compatibilité de `@remotion/player` avec Next.js 15 (composant client uniquement).
- Signale dans ton rapport les conditions de la licence Remotion pour que je les vérifie.

### Détection du disque externe
- Un fichier `zc-studio.json` à la racine du disque sert de repère (nom de la bibliothèque, version).
- Au démarrage, le studio parcourt les lettres de lecteur disponibles et trouve ce fichier.
- Tous les médias sont référencés par **chemin relatif** à cette racine (ex. `Musiques/adoration-douce.mp3`).
- Si le disque n'est pas trouvé, message clair : « Disque Zone-Chrétien non détecté. Branche le disque puis clique sur Réessayer. »

### Serveur local
- Écoute **uniquement sur 127.0.0.1**, jamais sur 0.0.0.0 (pas de pare-feu, pas d'exposition réseau).
- CORS limité aux origines autorisées : le domaine Vercel du CMS, le futur domaine zone-chretien.org ; `http://localhost:3000` pour le développement uniquement dans `config.local.json` (non versionné). Liste configurable.
- Vérifie et gère le comportement actuel des navigateurs pour les requêtes d'un site HTTPS public vers 127.0.0.1 (Private Network Access / Local Network Access, en-têtes et autorisation éventuelle de l'utilisateur). Documente ce que je dois accepter dans le navigateur.
- **Protection contre la traversée de chemins** : impossible de lire un fichier en dehors de la bibliothèque (`../`, chemins absolus, liens symboliques).
- Support des requêtes HTTP Range pour la lecture des vidéos et des musiques dans l'aperçu.
- Endpoints : état du studio, liste de la bibliothèque (par catégorie, avec miniatures générées et mises en cache), service des médias, lancement d'un rendu, progression, annulation, réception d'une voix off enregistrée.

### Lanceur sans droits admin
- `LANCER-STUDIO.bat` utilise le Node portable présent sur le disque (dossier `runtime/node/`), définit le PATH **uniquement pour la session du script**, démarre le serveur et affiche l'adresse.
- Le navigateur de rendu de Remotion est téléchargé une seule fois et stocké sur le disque.
- Documente pas à pas l'installation initiale sans droits admin.

### Données (Prisma / Turso)
Modèle `ReelProject` (adapter aux conventions du schéma existant) :
- `id`, `title`, `templateId`, `format` (9:16, 1:1, 16:9)
- `data` : props du template en JSON (si le type `Json` n'est pas supporté avec la configuration Prisma + Turso actuelle, stocker une chaîne JSON validée par zod)
- `sourceType` / `sourceId` : lien optionnel vers un contenu existant du CMS (article, dévotion, événement)
- `status` : brouillon, prêt, exporté
- `lastExportPath` (chemin relatif), `lastExportAt`, `createdAt`, `updatedAt`

Crée une migration propre et vérifie qu'elle ne modifie aucune table existante.

### Templates V1
Chaque template définit : schéma zod des props, durée par défaut, formats supportés, fond (image, vidéo, couleur ou dégradé), textes, animations, musique optionnelle, voix off optionnelle, logo.

1. **Prière** : titre court, texte de prière, verset optionnel, ambiance douce.
2. **Dévotion** : titre, verset, réflexion courte, appel à l'action final.
3. **Verset / Inspiration** : référence et texte du verset mis en valeur.
4. **Citation** : citation et auteur.
5. **Annonce d'événement** : nom, date, heure, lieu, visuel, appel à l'action.

Règles de qualité :
- Format principal 1080×1920 à 30 i/s.
- Les **3 premières secondes** doivent accrocher (titre fort, mouvement dès la première image).
- Respect des **zones sûres** des Reels / TikTok / Shorts (texte hors des zones couvertes par l'interface des applications). Option d'affichage des zones sûres dans l'aperçu.
- Texte long : ajustement automatique de la taille et découpage en plusieurs écrans si nécessaire, jamais de texte qui déborde.
- Animations sobres : fondu, montée légère, apparition mot par mot. Pas d'effets tape-à-l'œil.
- Fin de chaque vidéo : logo et « zone-chretien.org ».

### Bible Louis Segond 1910
- Trouve une source de la **LSG 1910 (domaine public)** en JSON ou convertible, vérifie et documente sa licence, stocke-la localement dans le dépôt.
- Analyseur de références en français : noms complets et abréviations (« Psaume 34:8 », « Ps 34.8 », « Jean 3:16-17 », « 1 Co 13:4 »).
- Insertion automatique du texte dans le template, avec la référence formatée.
- **N'utilise pas** la Segond 21, la NEG ou toute autre version protégée.

### Audio
- Musique : volume, fondu d'entrée et de sortie.
- Voix off : enregistrement dans le navigateur (MediaRecorder), envoi au studio local qui la sauvegarde dans `VoixOff/`.
- Quand une voix off est présente, la musique baisse automatiquement pendant la voix.
- Option : durée de la vidéo calée automatiquement sur la durée de la voix off.

### Gestion des erreurs
Messages compréhensibles en français pour : studio local non lancé, disque non branché, média introuvable, format non supporté, espace disque insuffisant, rendu échoué ou annulé, navigateur de rendu absent.

---

## Hors périmètre V1 (afficher « Fonction en développement » si visible)
IA (textes Ollama, sous-titres Whisper, voix de synthèse), timeline libre, Remotion Lambda, application mobile, publication automatique sur les réseaux sociaux.

---

## Méthode de travail

Travaille **étape par étape**. À la fin de chaque étape : vérifie les dépendances, lance le build et les tests, corrige les erreurs, puis donne un rapport court (fichiers créés ou modifiés, ce qui fonctionne réellement, limites). **Arrête-toi et attends ma validation** avant l'étape suivante.

Écris des tests (Vitest ou l'outil déjà présent dans le dépôt) pour la logique pure : analyseur de références bibliques, résolution des chemins relatifs, protection contre la traversée de chemins, détection du disque, validation des schémas.

Si un package est obsolète ou incompatible, adapte l'implémentation à la version actuelle au lieu de laisser du code cassé.

### Étape 0 — Analyse (aucune modification)
Vérifie d'abord que tu es bien lancé depuis la racine `zone-chretien/` et sur la branche `reels-studio` (sinon, arrête-toi et dis-le-moi). Vérifie comment exclure `zone-chretien-studio/` du build Vercel, de la vérification TypeScript et du lint de Next.js, et propose les modifications exactes.
Analyse le dépôt : structure, routage de l'administration, authentification admin, schéma Prisma, modèles de contenus (articles, dévotions, événements), conventions de style. Propose l'emplacement exact des nouveaux dossiers et signale tout risque.

### Étape 1 — Templates Remotion + premier rendu
Crée `remotion/`, `brand.ts` (valeurs provisoires clairement marquées, que je remplacerai par la charte Zone-Chrétien), le template **Verset**, et vérifie un rendu MP4 en ligne de commande avec Node portable, sans droits admin.

### Étape 2 — Studio local
Serveur 127.0.0.1, détection du disque, bibliothèque et miniatures, service sécurisé des médias, export avec progression et annulation, `LANCER-STUDIO.bat`, guide d'installation.

### Étape 3 — Intégration dans l'administration du CMS
Pages `/admin/reels` : liste des projets, création (choix du template et du format), formulaire généré depuis le schéma zod, aperçu en direct avec `@remotion/player`, indicateur « Studio local connecté / non connecté », bouton Exporter, sauvegarde dans Turso.

### Étape 4 — Bible LSG 1910 hors ligne
Données, analyseur de références, insertion dans les templates.

### Étape 5 — « Transformer en Reel »
Bouton sur les contenus existants du CMS (adapter aux vrais modèles trouvés à l'étape 0) qui crée un projet de Reel prérempli.

### Étape 6 — Voix off et audio
Enregistrement, sauvegarde sur le disque, baisse automatique de la musique, durée calée sur la voix.

### Étape 7 — Les 5 templates et finitions
Templates Prière, Dévotion, Citation et Événement, formats 1:1 et 16:9, zones sûres, ajustement du texte, README complet (installation sans droits admin, utilisation, limites connues).

---

## Livrables finaux
- Structure complète des fichiers ajoutés
- Dépendances et versions exactes
- Procédure d'installation et de lancement sans droits admin
- Liste des fonctions réellement fonctionnelles
- Fonctions restant à développer
- Limites techniques connues
