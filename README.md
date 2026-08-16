# Zone-Chrétien Media

Plateforme chrétienne (chansons, artistes, dévotions, prières, versets, témoignages, blog) avec
CMS admin, module IA et PWA — Next.js 15, Prisma + Turso, NextAuth.

📖 **[Guide de déploiement en production (Vercel + Turso)](./DEPLOYMENT.md)** — pour mettre le
site en ligne gratuitement.

Ce projet a été initialisé avec [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Données de démonstration

Pour peupler la base avec du contenu de démonstration (20 chansons, 10 artistes, 20 inspirations,
20 dévotions, 20 prières, 20 versets, 10 témoignages, 20 articles, + catégories et tags) :

```bash
npm run db:seed
```

Le script est idempotent (basé sur `upsert`) : le relancer ne crée pas de doublons. Les images
utilisent [Picsum Photos](https://picsum.photos) (photos de démonstration libres, aucune clé API
requise), l'audio des extraits libres de droits ([SoundHelix](https://www.soundhelix.com)), et les
vidéos quelques liens YouTube publics réels. Toutes ces valeurs sont à remplacer par du vrai contenu
via le CMS (`/admin`) une fois prêt à publier.

## Lancer le CMS en un clic (Windows)

Pour démarrer le serveur et arriver directement sur la page de connexion du CMS admin sans taper de commande, deux options équivalentes (aucun droit administrateur requis) :

- **Double-cliquer sur `lance_app.bat`** à la racine du projet, depuis l'explorateur Windows.
- Ou, depuis un terminal : `npm run lance_app`

Le script :
1. démarre `npm run dev` dans sa propre fenêtre (à laisser ouverte pendant que vous travaillez) ;
2. attend que le serveur réponde sur `http://localhost:3000` ;
3. ouvre automatiquement votre navigateur par défaut sur `http://localhost:3000/admin/login`.

Pour vous connecter, vous devez avoir déjà créé un compte admin une fois via :

```bash
npm run admin:create -- votre@email.com "VotreMotDePasse" "Votre Nom"
```

Pour tout arrêter, fermez simplement la fenêtre "Zone-Chrétien - Serveur dev".

## Module IA (génération de contenu)

Le CMS admin propose un générateur IA (`/admin/ia`, ainsi qu'un bouton "Générer avec l'IA"
directement dans le formulaire d'une chanson) pour rédiger des brouillons de dévotion, prière,
verset du jour, message inspirant, description de chanson et publications Facebook/WhatsApp.

**Moteur** : [Gemini API](https://ai.google.dev) (Google), tier gratuit, aucune carte bancaire
requise. Ollama reste disponible comme alternative pour le développement local uniquement — voir
`src/lib/ai/get-provider.ts`, qui l'ignore automatiquement en production car il ne peut pas
tourner sur les fonctions serverless de Vercel.

### Où mettre votre clé API

La clé va dans le fichier **`.env`** à la racine du projet (déjà exclu de Git — jamais commité,
jamais codé en dur dans le code source) :

```
GEMINI_API_KEY="votre-clé-ici"
```

Ce fichier `.env` existe déjà dans ce projet (créé à l'étape 2 pour Turso/NextAuth) : ouvrez-le et
complétez simplement la ligne `GEMINI_API_KEY=""`. C'est l'équivalent exact d'un `.env.local` —
même comportement (jamais versionné, toujours chargé par Next.js en local), on garde un seul
fichier pour ne pas fragmenter la config entre plusieurs endroits. En production (Vercel), la
même variable se règle dans *Project Settings → Environment Variables*, jamais dans un fichier.

### Comment obtenir une clé Gemini gratuite

1. Aller sur **[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**.
2. Se connecter avec un compte Google.
3. Cliquer **"Create API key"** (Google crée un projet pour vous si besoin — environ 2 minutes).
4. Copier la clé générée et la coller dans `.env` comme indiqué ci-dessus.

Aucune carte bancaire n'est demandée pour le tier gratuit (sauf comptes situés dans l'UE/UK/Suisse,
où Google impose d'activer la facturation même pour rester sur le palier gratuit — vérifiez sur la
page ci-dessus si c'est votre cas). Le modèle utilisé par défaut est `gemini-2.5-flash`
(configurable via `GEMINI_MODEL` dans `.env` si Google fait évoluer sa gamme de modèles).

## SEO & PWA

- **SEO** : meta title/description par page, Open Graph et Twitter Cards propres à chaque page
  (voir `src/lib/seo.ts`), URLs canoniques, `sitemap.xml` et `robots.txt` générés automatiquement
  (`src/app/sitemap.ts`, `src/app/robots.ts`), données structurées Schema.org (JSON-LD) sur
  l'accueil, les chansons, artistes, articles, dévotions, prières, versets et témoignages. L'URL
  publique utilisée pour ces liens vient de `NEXT_PUBLIC_SITE_URL` (`.env`) — à mettre à jour avec
  le vrai domaine en production.
- **PWA** : le site est installable (Android "Ajouter à l'écran d'accueil", iOS Safari 16.4+),
  avec icônes générées automatiquement (`src/app/icon.tsx`, `apple-icon.tsx`,
  `src/app/icons/*/route.tsx`) et un service worker ([Serwist](https://serwist.pages.dev), la
  librairie recommandée par la documentation officielle Next.js) qui met en cache intelligemment
  les pages visitées pour un chargement plus rapide et un mode hors-ligne basique (page de secours
  `/offline`).

**Dépannage** : si après une modification de `next.config.ts`, du manifest ou des icônes, des
pages comme `/manifest.webmanifest`, `/robots.txt` ou `/sitemap.xml` renvoient une 404 en local,
supprimez le cache de build avant de relancer :

```bash
rm -rf .next node_modules/.cache
npm run build
```

(Cache de build local corrompu — n'arrive jamais sur un déploiement Vercel, qui build toujours
dans un environnement propre.)

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
