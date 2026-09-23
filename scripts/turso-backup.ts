/**
 * Sauvegarde complète de la base Turso (schéma + données) dans un fichier .sql,
 * puis vérification automatique de ce fichier.
 *
 * Usage :
 *   1. Dans le tableau de bord Turso (app.turso.tech → base zone-chretien-media →
 *      Create Token), créer un jeton EN LECTURE SEULE.
 *   2. Créer le fichier .env.backup à la racine du dépôt (jamais versionné) :
 *        TURSO_BACKUP_URL="libsql://zone-chretien-media-….turso.io"
 *        TURSO_BACKUP_TOKEN="<le jeton en lecture seule>"
 *   3. npm run db:backup                       → ../sauvegardes-turso/<base>_<date>.sql
 *      npm run db:backup -- --out G:\Sauvegardes   (dossier au choix, hors du dépôt)
 *
 * Le script n'exécute que des lectures sur la base. Le fichier produit contient
 * toutes les données (comptes, empreintes de mots de passe, newsletter…) : il
 * est refusé dans le dépôt Git, à ranger dans un endroit sûr.
 *
 * Restauration (dans une NOUVELLE base, jamais par-dessus la production) :
 *   turso db create zone-chretien-media-restauree --from-dump <fichier.sql>
 */
import { createClient, type Client, type InValue } from "@libsql/client";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type SchemaRow = { type: string; name: string; tbl_name: string; sql: string | null };

const REPO_ROOT = path.resolve(__dirname, "..");

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const q = (name: string) => `"${name.replace(/"/g, '""')}"`;

/** Valeur SQL littérale (texte, nombre, entier long, blob, NULL). */
export function sqlLiteral(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof ArrayBuffer || ArrayBuffer.isView(v)) {
    const bytes = v instanceof ArrayBuffer ? new Uint8Array(v) : new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
    return `X'${Buffer.from(bytes).toString("hex")}'`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}

/** Tables internes de SQLite / libSQL, jamais sauvegardées comme des tables ordinaires. */
const isInternal = (name: string) => name.startsWith("sqlite_") || name.startsWith("libsql_") || name.startsWith("_litestream");

/** Tables techniques d'un index plein texte FTS5 (reconstruites, pas copiées). */
function isShadowOf(name: string, virtualTables: string[]): boolean {
  return virtualTables.some((vt) => ["_data", "_idx", "_docsize", "_config", "_content"].some((suffix) => name === `${vt}${suffix}`));
}

async function tableRows(db: Client, table: string) {
  const rs = await db.execute(`SELECT * FROM ${q(table)}`);
  return { columns: rs.columns, rows: rs.rows.map((r) => rs.columns.map((_, i) => r[i] as InValue)) };
}

export async function dumpDatabase(db: Client): Promise<{ sql: string; counts: Record<string, number> }> {
  const schema = (await db.execute("SELECT type, name, tbl_name, sql FROM sqlite_master ORDER BY rowid")).rows as unknown as SchemaRow[];
  const virtualTables = schema.filter((s) => s.type === "table" && s.sql?.toUpperCase().startsWith("CREATE VIRTUAL TABLE")).map((s) => s.name);
  const tables = schema.filter((s) => s.type === "table" && s.sql && !isInternal(s.name) && !virtualTables.includes(s.name) && !isShadowOf(s.name, virtualTables));

  const out: string[] = [
    `-- Sauvegarde Zone-Chrétien Media — ${new Date().toISOString()}`,
    "-- Ordre : tables, données, index plein texte (reconstruit), index, déclencheurs, vues.",
    "PRAGMA foreign_keys=OFF;",
    "BEGIN TRANSACTION;",
  ];
  const counts: Record<string, number> = {};

  // 1. Tables ordinaires puis leurs données (les déclencheurs ne sont pas encore créés).
  for (const t of tables) out.push(`${t.sql};`);
  for (const t of tables) {
    const { columns, rows } = await tableRows(db, t.name);
    counts[t.name] = rows.length;
    const cols = columns.map(q).join(",");
    for (const row of rows) out.push(`INSERT INTO ${q(t.name)} (${cols}) VALUES (${row.map(sqlLiteral).join(",")});`);
  }

  // 2. Compteurs AUTOINCREMENT.
  if (schema.some((s) => s.name === "sqlite_sequence")) {
    const seq = await db.execute("SELECT name, seq FROM sqlite_sequence");
    for (const r of seq.rows) out.push(`INSERT INTO sqlite_sequence (name, seq) VALUES (${sqlLiteral(r.name)}, ${sqlLiteral(r.seq)});`);
  }

  // 3. Index plein texte : recréé puis reconstruit depuis sa table source (FTS5
  //    « external content »), ou recopié s'il stocke lui-même son contenu.
  for (const vt of schema.filter((s) => virtualTables.includes(s.name))) {
    out.push(`${vt.sql};`);
    if (/content\s*=/i.test(vt.sql ?? "")) {
      out.push(`INSERT INTO ${q(vt.name)}(${q(vt.name)}) VALUES('rebuild');`);
    } else {
      const { columns, rows } = await tableRows(db, vt.name);
      for (const row of rows) out.push(`INSERT INTO ${q(vt.name)} (${columns.map(q).join(",")}) VALUES (${row.map(sqlLiteral).join(",")});`);
    }
  }

  // 4. Index, déclencheurs et vues (sql NULL = index automatique de clé primaire).
  for (const type of ["index", "trigger", "view"]) {
    for (const s of schema.filter((x) => x.type === type && x.sql && !isInternal(x.name) && !isShadowOf(x.tbl_name, virtualTables))) {
      out.push(`${s.sql};`);
    }
  }

  out.push("COMMIT;", "");
  return { sql: out.join("\n"), counts };
}

/** Recharge la sauvegarde dans une base temporaire et compare les nombres de lignes. */
export async function verifyDump(sql: string, expected: Record<string, number>, ftsTable: string | null): Promise<string[]> {
  const tmp = path.join(os.tmpdir(), `zc-verification-${process.pid}-${Date.now()}.db`);
  const copy = createClient({ url: `file:${tmp}` });
  const problems: string[] = [];
  try {
    await copy.executeMultiple(sql);
    for (const [table, n] of Object.entries(expected)) {
      const rs = await copy.execute(`SELECT count(*) AS n FROM ${q(table)}`);
      const got = Number(rs.rows[0].n);
      if (got !== n) problems.push(`${table} : ${got} lignes au lieu de ${n}`);
    }
    if (ftsTable) {
      const rs = await copy.execute(`SELECT count(*) AS n FROM ${q(ftsTable)} WHERE ${q(ftsTable)} MATCH 'berger'`);
      if (Number(rs.rows[0].n) === 0) problems.push(`recherche biblique (${ftsTable}) vide après restauration`);
    }
  } finally {
    copy.close();
    // Sous Windows, le fichier reste verrouillé un court instant après la fermeture.
    for (const f of [tmp, `${tmp}-wal`, `${tmp}-shm`]) {
      try {
        fs.rmSync(f, { force: true, maxRetries: 10, retryDelay: 200 });
      } catch {
        console.warn(`(fichier temporaire non supprimé, sans conséquence : ${f})`);
      }
    }
  }
  return problems;
}

async function main() {
  const url = process.env.TURSO_BACKUP_URL?.trim();
  const authToken = process.env.TURSO_BACKUP_TOKEN?.trim();
  if (!url) {
    console.error("TURSO_BACKUP_URL manquant : créez le fichier .env.backup (voir l'en-tête de scripts/turso-backup.ts).");
    process.exit(2);
  }

  const outDir = path.resolve(arg("out") ?? path.join(REPO_ROOT, "..", "sauvegardes-turso"));
  const rel = path.relative(REPO_ROOT, outDir);
  if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
    console.error(`Refusé : ${outDir} est dans le dépôt Git. Choisissez un dossier en dehors (la sauvegarde contient des données personnelles).`);
    process.exit(2);
  }

  const dbName = url.startsWith("file:") ? path.parse(url.slice(5)).name : new URL(url).hostname.split(".")[0];
  const now = new Date();
  const p2 = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}_${p2(now.getHours())}-${p2(now.getMinutes())}`;
  const file = path.join(outDir, `${dbName}_${stamp}.sql`);

  const db = createClient({ url, authToken, intMode: "bigint" });
  console.log(`Lecture de la base ${dbName}…`);
  const { sql, counts } = await dumpDatabase(db);
  db.close();

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(file, sql, { flag: "wx" });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`Sauvegarde écrite : ${file} (${(fs.statSync(file).size / 1024 / 1024).toFixed(1)} Mo, ${Object.keys(counts).length} tables, ${total} lignes)`);

  console.log("Vérification : restauration dans une base temporaire…");
  const fts = /CREATE VIRTUAL TABLE "?bible_verses_fts"?/i.test(sql) ? "bible_verses_fts" : null;
  const problems = await verifyDump(sql, counts, fts);
  if (problems.length > 0) {
    console.error("Sauvegarde INCOMPLÈTE :");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log("Sauvegarde vérifiée : toutes les tables ont le bon nombre de lignes" + (fts ? ", recherche biblique fonctionnelle." : "."));
  for (const [t, n] of Object.entries(counts)) console.log(`  ${t.padEnd(28)} ${n}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Sauvegarde impossible : ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
