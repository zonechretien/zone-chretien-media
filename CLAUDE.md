# CLAUDE.md — Zone-Chrétien Media

Consignes pour les assistants de code travaillant sur ce dépôt (CMS Next.js 15, Prisma, Turso,
déployé sur Vercel, et studio local de Reels dans `zone-chretien-studio/`).

## Règles importantes du projet

1. **Ne jamais utiliser `prisma migrate dev`.** Cette commande propose de supprimer les tables
   de recherche de la Bible (`bible_verses_fts*`), créées en dehors de Prisma. Les migrations
   doivent toujours être générées avec :

   ```bash
   prisma migrate diff --from-schema <ancien> --to-schema prisma/schema.prisma --script
   ```

   (`<ancien>` : le schéma avant modification, par ex. extrait avec
   `git show HEAD:prisma/schema.prisma`.)

2. **Toujours travailler sur une branche dédiée**, jamais directement sur `master`.

3. **`zone-chretien-studio/` est exclu** du build Vercel (`.vercelignore`), de la vérification
   TypeScript du CMS (`exclude` de `tsconfig.json`) et du lint de Next.js (`ignores` de
   `eslint.config.mjs`). Le studio a son propre `package.json` : ses dépendances de rendu ne
   doivent jamais être installées ni compilées par Vercel.

4. **Les sauvegardes Turso ne doivent jamais être créées dans le dépôt Git ni dans la
   bibliothèque de médias du studio** : le dossier dédié `<lecteur>:\Zone-Chretien-Studio`
   (quelle que soit la lettre ; nom réglable par `dossierBibliotheque` dans la configuration
   du studio) et tout dossier situé sous un `zc-studio.json`. Utiliser `npm run db:backup`,
   qui écrit par défaut dans `Documents\Sauvegardes-Turso` et refuse ces emplacements.
   **Les sauvegardes ne restent jamais en clair** : après « Sauvegarde vérifiée », elles sont
   chiffrées en `.7z` AES-256 (noms chiffrés) avec `outils\7zip\7za.exe`, archive testée,
   puis `.sql` supprimé ; si la vérification échoue, chiffrées quand même en
   `…_NON-VERIFIEE.7z` (ou `.sql` supprimé si le chiffrement est impossible) ;
   `npm run db:chiffrer` pour les anciens `.sql` ; `--copie <dossier>`
   pour une copie (mêmes refus). Le mot de passe est saisi par l'utilisateur dans son
   terminal : ne jamais le demander, l'écrire, le passer en argument de commande ni le
   journaliser.

5. **Aucun fichier `.env` ne doit être commité** (`.env`, `.env.backup`, etc. — règle `.env*`
   du `.gitignore`).

6. **Le PC n'a pas de droits administrateur** : aucune solution ne doit en nécessiter
   (pas d'installateur, de service Windows, de modification du registre ni de variable
   d'environnement système ; Node.js est utilisé en version portable, lancé par des `.bat`).

7. **Toujours répondre en français à l'utilisateur.**
