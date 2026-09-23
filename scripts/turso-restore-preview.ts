/**
 * Restaure une sauvegarde vérifiée (npm run db:backup) dans la base Turso de
 * prévisualisation, puis vérifie le nombre de lignes de chaque table et la
 * recherche biblique (FTS5).
 *
 * Usage :
 *   1. Fichier .env.preview-restore à la racine du dépôt (jamais versionné) :
 *        TURSO_PREVIEW_URL="libsql://zone-chretien-media-preview-….turso.io"
 *        TURSO_PREVIEW_TOKEN="<jeton lecture/écriture de la base preview>"
 *   2. npm run db:restore-preview -- --fichier <sauvegarde.sql>
 *
 * Sécurités :
 *   - refuse toute base dont le nom n'est pas exactement zone-chretien-media-preview,
 *     et toute URL identique à celle de la production (.env / .env.backup) ;
 *   - refuse une base qui contient déjà des tables (à recréer vide) ;
 *   - la sauvegarde est d'abord rechargée dans une base locale temporaire,
 *     exactement comme la vérification de db:backup.
 */
import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { expectedCounts, splitDump, verifyDump } from "./turso-backup";

const PREVIEW_DB = "zone-chretien-media-preview";
const REPO_ROOT = path.resolve(__dirname, "..");
/** Instructions par requête : assez pour aller vite, assez peu pour rester sous les limites de taille. */
const BATCH_SIZE = 400;

const q = (name: string) => `"${name.replace(/"/g, '""')}"`;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** URL des fichiers .env du dépôt qui désignent la production (valeurs jamais affichées). */
function productionUrls(): string[] {
  const urls: string[] = [];
  for (const [file, key] of [[".env", "TURSO_DATABASE_URL"], [".env.backup", "TURSO_BACKUP_URL"]] as const) {
    const p = path.join(REPO_ROOT, file);
    if (!fs.existsSync(p)) continue;
    const m = new RegExp(`^${key}\\s*=\\s*"?([^"\\r\\n]*)"?`, "m").exec(fs.readFileSync(p, "utf8"));
    if (m?.[1].trim()) urls.push(m[1].trim());
  }
  return urls;
}

/** Raison de refuser l'URL cible, ou null si c'est bien la base de prévisualisation. */
export function refuseTarget(url: string, prodUrls: string[]): string | null {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return "URL invalide";
  }
  const sameHost = (u: string) => {
    try {
      return new URL(u).hostname === host;
    } catch {
      return false;
    }
  };
  if (prodUrls.some(sameHost)) return "c'est l'URL de la base de production";
  if (!/^libsql:|^https:/.test(url)) return "seules les bases Turso distantes (libsql:// ou https://) sont acceptées";
  const first = host.split(".")[0];
  if (!first.startsWith(`${PREVIEW_DB}-`)) return `la base cible doit s'appeler ${PREVIEW_DB} (hôte reçu : ${host})`;
  return null;
}

async function main() {
  const url = process.env.TURSO_PREVIEW_URL?.trim();
  const authToken = process.env.TURSO_PREVIEW_TOKEN?.trim();
  const file = arg("fichier");
  if (!url || !authToken) {
    console.error("TURSO_PREVIEW_URL / TURSO_PREVIEW_TOKEN manquants : voir l'en-tête de scripts/turso-restore-preview.ts.");
    process.exit(2);
  }
  if (!file || !fs.existsSync(file)) {
    console.error("Indiquez la sauvegarde vérifiée : npm run db:restore-preview -- --fichier <sauvegarde.sql>");
    process.exit(2);
  }
  const refusal = refuseTarget(url, productionUrls());
  if (refusal) {
    console.error(`Refusé : ${refusal}.`);
    process.exit(2);
  }

  const sql = fs.readFileSync(file, "utf8");
  const statements = splitDump(sql);
  const expected = expectedCounts(statements);
  const hasBibleFts = statements.some((s) => /^CREATE VIRTUAL TABLE\s+"?bible_verses_fts"?/i.test(s));
  const ftsTable = hasBibleFts ? "bible_verses_fts" : null;
  const total = Object.values(expected).reduce((a, b) => a + b, 0);
  console.log(`Sauvegarde : ${file} (${statements.length} instructions, ${Object.keys(expected).length} tables, ${total} lignes)`);

  console.log("1/3 Vérification de la sauvegarde dans une base locale temporaire…");
  const localProblems = verifyDump(file, expected, ftsTable);
  if (localProblems.length > 0) {
    console.error("Sauvegarde non restaurable, rien n'a été envoyé :");
    for (const p of localProblems) console.error(`  - ${p}`);
    process.exit(1);
  }

  const db = createClient({ url, authToken });
  try {
    const existing = await db.execute("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%' AND name NOT LIKE '_litestream%'");
    if (Number(existing.rows[0].n) > 0) {
      console.error(`Refusé : la base cible contient déjà ${existing.rows[0].n} tables. Elle doit être vide (la recréer).`);
      process.exit(2);
    }

    console.log(`2/3 Restauration dans ${new URL(url).hostname}…`);
    for (let i = 0; i < statements.length; i += BATCH_SIZE) {
      // migrate() : lot transactionnel, clés étrangères désactivées (comme PRAGMA foreign_keys=OFF de la sauvegarde).
      await db.migrate(statements.slice(i, i + BATCH_SIZE));
      process.stdout.write(`\r   ${Math.min(i + BATCH_SIZE, statements.length)} / ${statements.length}`);
    }
    process.stdout.write("\n");

    console.log("3/3 Vérification de la base preview…");
    const problems: string[] = [];
    for (const [table, n] of Object.entries(expected)) {
      const rs = await db.execute(`SELECT count(*) AS n FROM ${q(table)}`);
      const got = Number(rs.rows[0].n);
      if (got !== n) problems.push(`${table} : ${got} lignes au lieu de ${n}`);
    }
    if (ftsTable) {
      const rs = await db.execute(`SELECT count(*) AS n FROM ${q(ftsTable)} WHERE ${q(ftsTable)} MATCH 'berger'`);
      if (Number(rs.rows[0].n) === 0) problems.push(`recherche biblique (${ftsTable}) vide après restauration`);
    }
    if (problems.length > 0) {
      console.error("Restauration INCOMPLÈTE :");
      for (const p of problems) console.error(`  - ${p}`);
      process.exit(1);
    }
    console.log("Restauration vérifiée : toutes les tables ont le bon nombre de lignes" + (ftsTable ? ", recherche biblique fonctionnelle." : "."));
    for (const [t, n] of Object.entries(expected)) console.log(`  ${t.padEnd(28)} ${n}`);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Restauration impossible : ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
