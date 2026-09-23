# Bible Louis Segond 1910 — données et licence

Le module Reels (et le site) utilise **uniquement** la Bible **Louis Segond 1910**.
La Segond 21, la Nouvelle Édition de Genève (NEG 1979) et toute autre version protégée
ne sont pas utilisées.

## Fichier

- `prisma/bible-data/lsg1910.json` — 66 livres, 1 189 chapitres, **31 102 versets**
  (≈ 5 Mo). C'est le même fichier que celui importé dans la base pour la section Bible du site.
- Provenance : export de la base de l'application Lepolo_Bible
  (`scripts/bible/export-from-lepolo.ts`), version `LSG1910`.
- En-tête du fichier : `{"code":"LSG1910","name":"Louis Segond 1910","language":"fr","license":"domaine public"}`.

## Licence

La traduction de Louis Segond (1810–1885), dans sa révision publiée en 1910, est dans le
**domaine public**. Référence : eBible.org, fiche « Louis Segond 1910 » (`fraLSG`) :
*« Cette Bible est dans le domaine public. Il n'est pas protégé par copyright. »*
(<https://ebible.org/find/details.php?id=fraLSG>, consulté le 23/09/2026).

## Vérification que le texte est bien la LSG 1910

L'étiquette du fichier ne suffisant pas, le texte a été comparé sur des versets qui
diffèrent entre les révisions (test automatique : `src/lib/bible/lsg1910.test.ts`) :

| Verset | LSG 1910 (ce fichier) | NEG 1979 / Segond 21 |
|---|---|---|
| 1 Corinthiens 13:4 | « **La charité** est patiente… » | « L'amour est patient… » |
| Psaume 23:1 | « **Cantique** de David… » | NEG : « Psaume de David… » |
| Genèse 1:1 | « …créa **les cieux** et la terre » | S21 : « le ciel et la terre » |
| Psaume 34:8 | « **Sentez** et voyez… » | S21 : « Goûtez et voyez… » |

## Numérotation des versets

La numérotation suit celle du fichier (et donc du site) : **alignée sur la numérotation
anglaise**, le titre des psaumes étant inclus dans le verset 1. Pour une partie des psaumes,
une Bible Segond imprimée décale d'un verset (ex. « Sentez et voyez » = Ps 34:8 ici,
Ps 34:9 dans l'édition papier ; le Psaume 51 compte 19 versets ici, 21 sur papier).
L'éditeur de Reels le signale quand un passage commence au verset 1 d'un psaume.

## Références acceptées par l'éditeur

Analyseur : `src/lib/bible/reference.ts` (livres et abréviations : `src/lib/bible/books.ts`).

- Noms complets et abréviations françaises : `Psaume 34:8`, `Ps 34.8`, `Jean 3:16-17`,
  `1 Co 13:4`, `1Co 13:4-7`, `I Corinthiens 13`, `1er Jean 4:8`, `Ésaïe 40:31` / `Is 40:31`…
- Séparateur chapitre / verset : `:`, `.`, `,`, `v` ou une espace (`Jn 3 16`).
- Intervalles : `-`, `–`, `à` ; passage sur deux chapitres : `Jean 3:16-4:2`.
- Chapitre entier : `Psaume 23` ; plusieurs chapitres : `Ps 23-24`.

La référence est remise en forme (`Psaume 34:8`, `1 Corinthiens 13:4`) et le texte est lu
dans le fichier du dépôt côté serveur (`src/lib/bible/lsg1910.ts`), sans aucun service externe.
Le texte inséré reste modifiable (retirer un titre de psaume, raccourcir…).
