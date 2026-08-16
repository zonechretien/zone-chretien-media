# Guide de déploiement — Vercel Hobby + Turso

Ce guide déploie Zone-Chrétien Media en production, gratuitement, sans carte bancaire :
**GitHub** (code) + **Turso** (base de données) + **Vercel Hobby** (hébergement).

Compter environ 20-30 minutes la première fois. Tout se fait par navigateur, aucune ligne de
commande avancée n'est requise (le CLI Turso n'est d'ailleurs pas utilisable nativement sur
Windows — ce guide passe par les tableaux de bord web).

> ⚠️ Le plan Vercel Hobby est réservé à un usage personnel/non commercial par un développeur
> unique. Un site vitrine d'église/ministère à but non lucratif rentre generalement dans ce
> cadre ; en cas de doute (site avec des ventes, une équipe de plusieurs développeurs, un fort
> trafic commercial), vérifiez les [conditions Vercel](https://vercel.com/docs/limits) — le plan
> Pro reste payant mais lève ces restrictions.

---

## 1. Prérequis

- Un compte [GitHub](https://github.com) (gratuit).
- Un compte [Vercel](https://vercel.com/signup) (gratuit, se crée en connectant votre compte GitHub).
- Un compte [Turso](https://turso.tech) (gratuit, aucune carte bancaire).
- Optionnel mais recommandé : une clé [Gemini API](https://aistudio.google.com/app/apikey)
  gratuite pour le module IA (voir README, section "Module IA").

---

## 2. Pousser le code sur GitHub

Si le projet n'est pas encore dans un dépôt Git :

```bash
git init
git add .
git commit -m "Initial commit"
```

Créez un nouveau dépôt sur [github.com/new](https://github.com/new) (public ou privé, les deux
fonctionnent avec Vercel Hobby), puis :

```bash
git remote add origin https://github.com/<votre-compte>/<votre-repo>.git
git branch -M main
git push -u origin main
```

Le fichier `.gitignore` exclut déjà `.env`, `node_modules`, `.next`, les fichiers `.db` locaux et
le service worker généré — rien de sensible ne part sur GitHub.

---

## 3. Créer la base Turso de production

1. Allez sur **[dashboard.turso.tech](https://dashboard.turso.tech)** et connectez-vous (compte
   GitHub par exemple).
2. Cliquez **"Create Database"**.
   - Nom : par exemple `zone-chretien-media`.
   - Région : choisissez la plus proche de vos visiteurs (ex. Paris/Francfort pour un public
     francophone).
3. Une fois créée, ouvrez la base et récupérez deux informations :
   - **L'URL de connexion** (format `libsql://zone-chretien-media-<org>.turso.io`) — visible dans
     l'onglet de la base.
   - **Un token d'authentification** : bouton "Create Token" (ou "Tokens" dans les paramètres de
     la base) → générez un token en lecture/écriture, sans expiration (ou une expiration longue,
     à renouveler plus tard si besoin).

Gardez ces deux valeurs de côté, elles servent aux étapes 4 et 6.

> Rappel du tier gratuit Turso (aucune carte bancaire) : 100 bases de données, 5 Go de stockage,
> 500 millions de lignes lues et 10 millions de lignes écrites par mois — largement suffisant pour
> ce site.

---

## 4. Appliquer le schéma à la base Turso

Le moteur de migration de Prisma ne pilote pas encore nativement les bases libSQL distantes : le
schéma a déjà été généré en local (étape 2 du projet) sous forme de SQL dans
`prisma/migrations/<horodatage>_init/migration.sql`. Il faut exécuter ce SQL une fois sur la base
Turso de production.

**Sur Windows, sans CLI Turso**, le plus simple est le tableau de bord web :

1. Dans [dashboard.turso.tech](https://dashboard.turso.tech), ouvrez votre base → onglet
   **"Console"** (ou "SQL Shell"/"Query").
2. Ouvrez le fichier `prisma/migrations/<horodatage>_init/migration.sql` de votre projet dans un
   éditeur de texte, copiez tout son contenu.
3. Collez-le dans la console SQL du dashboard et exécutez.
4. Vérifiez que les tables sont créées (le dashboard liste généralement les tables dans un onglet
   "Tables" ou "Schema") : vous devez voir `users`, `songs`, `artists`, `articles`, `settings`,
   etc. (18 tables + 2 tables de jointure many-to-many).

**Si vous avez accès à macOS/Linux/WSL** (le CLI Turso n'a pas de binaire Windows natif), une
alternative en une commande :

```bash
turso auth login
turso db shell zone-chretien-media < prisma/migrations/<horodatage>_init/migration.sql
```

---

## 5. Créer le projet sur Vercel

1. Sur [vercel.com/new](https://vercel.com/new), cliquez **"Import Git Repository"**.
2. Autorisez Vercel à accéder à votre compte GitHub si demandé, puis sélectionnez le dépôt du
   projet.
3. Vercel détecte automatiquement Next.js — **ne changez rien** aux commandes de build
   (`npm run build`) ni au framework preset.
4. **Ne cliquez pas encore sur "Deploy"** : ouvrez d'abord la section "Environment Variables"
   ci-dessous (étape 6), sinon le tout premier build échouera faute de base de données accessible.

---

## 6. Configurer les variables d'environnement

Toujours sur l'écran de configuration du nouveau projet (section **"Environment Variables"**),
ajoutez chaque variable ci-dessous. Ce sont exactement les mêmes clés que dans votre `.env` local
(voir `.env.example`) — copiez les valeurs de **production**, pas celles de dev.

| Variable | Valeur en production |
|---|---|
| `TURSO_DATABASE_URL` | L'URL Turso récupérée à l'étape 3 (`libsql://...turso.io`) |
| `TURSO_AUTH_TOKEN` | Le token Turso récupéré à l'étape 3 |
| `AUTH_SECRET` | **Une nouvelle valeur**, différente de celle du `.env` local (voir ci-dessous) |
| `AI_PROVIDER` | `gemini` |
| `GEMINI_API_KEY` | Votre clé API Gemini (voir README) |
| `GEMINI_MODEL` | `gemini-2.5-flash` (ou laisser vide pour la valeur par défaut) |
| `NEXT_PUBLIC_SITE_URL` | L'URL finale du site, ex. `https://zone-chretien-media.vercel.app` ou votre domaine personnalisé |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Optionnel, si vous utilisez Google AdSense |

**Ne définissez pas** `OLLAMA_BASE_URL`/`OLLAMA_MODEL` en production : Ollama ne fonctionne pas
sur Vercel serverless et le module IA bascule automatiquement sur Gemini si `AI_PROVIDER=ollama`
était sélectionné par erreur (voir `src/lib/ai/get-provider.ts`).

**Générer un `AUTH_SECRET` de production** (à exécuter en local, dans un terminal) :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Ne réutilisez jamais le secret de développement en production — un secret différent par
environnement limite l'impact en cas de fuite.

---

## 7. Déployer

Cliquez **"Deploy"**. Vercel installe les dépendances, exécute `prisma generate` (via le script
`postinstall`), puis `npm run build`. Le build interroge la base Turso pour générer certaines
pages (accueil, sitemap, manifest) — c'est pourquoi les variables Turso doivent être en place
*avant* ce premier build.

Le déploiement prend 2 à 4 minutes. À la fin, Vercel affiche l'URL du site
(`https://<nom-du-projet>.vercel.app`).

---

## 8. Créer le premier compte administrateur

Le compte admin ne se crée pas via une interface web (par sécurité) mais via le script fourni,
**exécuté en local en pointant temporairement vers la base Turso de production** :

1. Ouvrez votre `.env` local et **notez vos valeurs actuelles** de `TURSO_DATABASE_URL` /
   `TURSO_AUTH_TOKEN` (pour les remettre après).
2. Remplacez-les temporairement par les valeurs de production (étape 3).
3. Exécutez :

   ```bash
   npm run admin:create -- votre@email.com "VotreMotDePasseSolide" "Votre Nom"
   ```

4. **Remettez immédiatement** `.env` sur vos valeurs de développement locales, pour ne pas
   continuer à travailler en local contre la base de production par erreur.

Connectez-vous ensuite sur `https://<votre-site>.vercel.app/admin/login`.

---

## 9. Données de démonstration (optionnel)

Pour un premier aperçu du site déjà rempli, vous pouvez charger les données de démonstration
(20 chansons, 10 artistes, etc. — voir README) sur la base de production avec la même méthode que
l'étape 8 (pointer temporairement `.env` vers Turso prod, lancer `npm run db:seed`, puis remettre
`.env` en local).

**Recommandé** : ne gardez pas les données de démonstration sur un site public durable — une fois
votre vrai contenu prêt, supprimez les éléments de démo depuis le CMS (`/admin`) avant de
communiquer l'URL du site.

---

## 10. Vérifier le déploiement

Une fois en ligne, contrôlez :

- `https://<votre-site>/` — la page d'accueil s'affiche.
- `https://<votre-site>/admin/login` — la connexion admin fonctionne.
- `https://<votre-site>/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` — répondent en 200.
- Sur mobile (Chrome Android ou Safari iOS) : le site propose l'installation ("Ajouter à l'écran
  d'accueil").
- [PageSpeed Insights](https://pagespeed.web.dev) sur l'URL de production, pour confirmer les
  scores Lighthouse visés par le cahier des charges.

---

## 11. Domaine personnalisé (optionnel)

Dans le projet Vercel → **Settings → Domains**, ajoutez votre nom de domaine et suivez les
instructions DNS affichées (Vercel fournit un certificat HTTPS automatiquement, gratuit). Pensez
ensuite à **mettre à jour `NEXT_PUBLIC_SITE_URL`** dans les variables d'environnement Vercel avec
la nouvelle URL, puis à redéployer (Deployments → ⋯ → Redeploy) pour que le sitemap, les URLs
canoniques et les partages sociaux utilisent le bon domaine.

---

## 12. Mises à jour futures

- **Déploiement continu** : chaque `git push` sur la branche `main` redéploie automatiquement.
- **Nouvelle migration de schéma** (si vous modifiez `prisma/schema.prisma`) :
  1. En local : `npm run db:migrate` (génère un nouveau dossier dans `prisma/migrations/`).
  2. Appliquez le nouveau `migration.sql` généré à la base Turso de production, comme à l'étape 4
     (console web ou `turso db shell`).
  3. Commitez et poussez le code — Vercel redéploie avec le nouveau schéma déjà en place côté
     base.
- **Ajout/rotation de variables d'environnement** : Project Settings → Environment Variables sur
  Vercel, puis redéployer pour que le changement prenne effet sur un build déjà existant.

---

## 13. Dépannage

**Le build Vercel échoue en cherchant à joindre la base de données**
→ Vérifiez que `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN` sont bien renseignés dans les
Environment Variables du projet Vercel *avant* le déploiement, et que le schéma a bien été
appliqué à la base (étape 4).

**`/manifest.webmanifest`, `/robots.txt` ou `/sitemap.xml` renvoient une 404 après déploiement**
→ Rare, déjà rencontré en développement local suite à un cache de build corrompu (voir README).
Sur Vercel cela ne devrait jamais arriver car chaque build part d'un environnement propre ; si le
cas se présente, forcez un nouveau déploiement (Deployments → ⋯ → Redeploy → "Use existing Build
Cache" décoché).

**Connexion admin impossible en production**
→ Vérifiez que le compte a bien été créé contre la base de *production* (étape 8), pas contre une
base locale par erreur (vérifiez `TURSO_DATABASE_URL` au moment de lancer `admin:create`).

**Le module IA renvoie une erreur "GEMINI_API_KEY est manquante"**
→ La variable n'a pas été ajoutée (ou pas encore redéployée) sur Vercel. Ajoutez-la dans
Environment Variables puis redéployez.

**J'ai dépassé le quota gratuit Vercel ou Turso**
→ Peu probable pour un site de cette taille, mais si cela arrive : Vercel Hobby suspend le
déploiement jusqu'au mois suivant sans surcoût automatique (pas de facturation surprise) ; Turso
affiche un avertissement dans son dashboard avant la limite. Les deux plans gratuits restent
largement dimensionnés pour ce projet.
