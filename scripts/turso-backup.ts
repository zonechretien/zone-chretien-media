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
 *   3. npm run db:backup     → Documents\Sauvegardes-Turso\<base>_<date>.sql (profil Windows)
 *      npm run db:backup -- --out <dossier>   (autre dossier, par ex. une clé USB dédiée)
 *
 * Le script n'exécute que des lectures sur la base. Le fichier produit contient
 * toutes les données (comptes, empreintes de mots de passe, newsletter…) : il
 * est REFUSÉ dans le dépôt Git et dans la bibliothèque de médias du studio
 * local (dossier <lecteur>:\Zone-Chretien-Studio, quelle que soit la lettre du
 * disque, et tout dossier situé sous un zc-studio.json) — à ranger dans un
 * endroit sûr.
 *
 * Restauration (dans une NOUVELLE base, jamais par-dessus la production) :
 *   turso db create zone-chretien-media-restauree --from-dump <fichier.sql>
 */
import { createClient, type Client, type InValue } from "@libsql/client";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type SchemaRow = { type: string; name: string; tbl_name: string; sql: string | null };

const REPO_ROOT = path.resolve(__dirname, "..");
/** Dossier par défaut : dans le profil Windows, jamais dans le dépôt ni sur le disque des médias. */
export const DEFAULT_OUT_DIR = path.join(os.homedir(), "Documents", "Sauvegardes-Turso");
/** Repère de la bibliothèque de médias servie par le studio local (voir zone-chretien-studio/src/drive.ts). */
const LIBRARY_MARKER = "zc-studio.json";
const STUDIO_DIR = path.join(REPO_ROOT, "zone-chretien-studio");

/**
 * Nom du dossier de la bibliothèque du studio, à la racine d'un lecteur
 * (config.json du studio → dossierBibliotheque, éventuellement changé par config.local.json).
 */
export function libraryFolderName(studioDir: string = STUDIO_DIR): string {
  let name = "Zone-Chretien-Studio";
  for (const file of ["config.json", "config.local.json"]) {
    try {
      const value = (JSON.parse(fs.readFileSync(path.join(studioDir, file), "utf8")) as { dossierBibliotheque?: unknown }).dossierBibliotheque;
      if (typeof value === "string" && value) name = value;
    } catch {
      // Fichier absent ou illisible : valeur précédente conservée.
    }
  }
  return name;
}

/** Chemin réel (liens symboliques et jonctions résolus) du plus proche parent existant, suivi du reste du chemin. */
function realPathOfNearest(p: string): string {
  const rest: string[] = [];
  let cur = p;
  while (!fs.existsSync(cur) && path.dirname(cur) !== cur) {
    rest.unshift(path.basename(cur));
    cur = path.dirname(cur);
  }
  try {
    cur = fs.realpathSync.native(cur);
  } catch {
    // Lecteur absent : chemin laissé tel quel.
  }
  return path.join(cur, ...rest);
}

function isInsideDir(parent: string, child: string): boolean {
  const norm = (p: string) => (process.platform === "win32" ? p.toLowerCase() : p);
  const rel = path.relative(norm(parent), norm(child));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/**
 * Raison de refuser un dossier de sortie, ou null s'il convient : le fichier
 * ne doit être ni dans le dépôt Git, ni dans la bibliothèque de médias du
 * studio, c'est-à-dire ni sous <lecteur>:\<dossierBibliotheque> (quelle que
 * soit la lettre), ni sous un dossier contenant zc-studio.json. Le chemin est
 * aussi vérifié après résolution des liens symboliques et jonctions.
 */
export function unsafeOutDirReason(outDir: string, repoRoot: string = REPO_ROOT, folderName: string = libraryFolderName()): string | null {
  const asGiven = path.resolve(outDir);
  for (const dir of new Set([asGiven, realPathOfNearest(asGiven)])) {
    if (isInsideDir(repoRoot, dir)) return "ce dossier est dans le dépôt Git";
    const libraryDir = path.join(path.parse(dir).root, folderName);
    if (isInsideDir(libraryDir, dir)) return `ce dossier est dans la bibliothèque de médias du studio (${libraryDir})`;
    for (let d = dir; ; d = path.dirname(d)) {
      const marker = path.join(d, LIBRARY_MARKER);
      if (fs.existsSync(marker)) return `ce dossier est dans la bibliothèque de médias du studio (${marker})`;
      if (path.dirname(d) === d) break;
    }
  }
  return null;
}

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

const unquote = (s: string) => s.trim().replace(/^(["'`[])([\s\S]*)[\]"'`]$/, "$2");

/**
 * Arguments d'un CREATE VIRTUAL TABLE … USING fts5(...) : colonnes indexées et
 * options (content, content_rowid, tokenize…), en respectant les guillemets.
 */
export function parseFts5(sql: string): { columns: string[]; options: Record<string, string> } {
  const body = sql.slice(sql.indexOf("(") + 1, sql.lastIndexOf(")"));
  const args: string[] = [];
  let cur = "";
  let quote: string | null = null;
  for (const ch of body) {
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
    } else if (ch === ",") {
      args.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) args.push(cur);
  const columns: string[] = [];
  const options: Record<string, string> = {};
  for (const a of args) {
    const opt = /^\s*(\w+)\s*=\s*([\s\S]*?)\s*$/.exec(a);
    if (opt) options[opt[1].toLowerCase()] = unquote(opt[2]);
    else if (a.trim()) columns.push(unquote(a.trim().split(/\s+(?=UNINDEXED\s*$)/i)[0]));
  }
  return { columns, options };
}

/**
 * Raison pour laquelle l'index FTS5 « external content » ne peut pas être
 * reconstruit depuis sa table source, ou null s'il le peut. Cas réel : la
 * production contient une table verses_fts orpheline (héritée de l'import
 * Lepolo_Bible) dont la table source « verses » est devenue celle des versets
 * du jour, sans colonne « texte » — son « rebuild » échoue (no such column: T.texte).
 */
async function ftsRebuildProblem(db: Client, content: string, rowid: string, columns: string[]): Promise<string | null> {
  const info = await db.execute(`PRAGMA table_info(${q(content)})`);
  if (info.rows.length === 0) return `la table source « ${content} » n'existe pas`;
  const have = new Set(info.rows.map((r) => String(r.name).toLowerCase()));
  const missing = columns.filter((c) => !have.has(c.toLowerCase()));
  if (missing.length > 0) return `la table source « ${content} » n'a pas la colonne ${missing.join(", ")}`;
  if (rowid.toLowerCase() !== "rowid" && !have.has(rowid.toLowerCase())) return `la table source « ${content} » n'a pas la colonne ${rowid}`;
  return null;
}

export async function dumpDatabase(db: Client): Promise<{ sql: string; counts: Record<string, number>; warnings: string[] }> {
  const schema = (await db.execute("SELECT type, name, tbl_name, sql FROM sqlite_master ORDER BY rowid")).rows as unknown as SchemaRow[];
  const virtualTables = schema.filter((s) => s.type === "table" && s.sql?.toUpperCase().startsWith("CREATE VIRTUAL TABLE")).map((s) => s.name);
  const tables = schema.filter((s) => s.type === "table" && s.sql && !isInternal(s.name) && !virtualTables.includes(s.name) && !isShadowOf(s.name, virtualTables));

  const out: string[] = [
    `-- Sauvegarde Zone-Chrétien Media — ${new Date().toISOString()}`,
    "-- Ordre : tables, données, index plein texte (reconstruit), index, déclencheurs, vues.",
    "-- Les tables internes des index FTS5 (_data, _idx, _docsize, _config, _content) ne sont",
    "-- pas copiées : SQLite les recrée avec la table virtuelle, puis l'index est reconstruit.",
    "PRAGMA foreign_keys=OFF;",
    "BEGIN TRANSACTION;",
  ];
  const counts: Record<string, number> = {};
  const warnings: string[] = [];
  /** Reconstructions d'index dont la table source est une vue : après la création des vues. */
  const afterViews: string[] = [];

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

  // 3. Tables virtuelles, après les tables ordinaires et leurs données : FTS5
  //    « external content » recréée vide puis reconstruite depuis sa table
  //    source ; FTS5 qui stocke lui-même son contenu : lignes recopiées.
  for (const vt of schema.filter((s) => virtualTables.includes(s.name))) {
    const vtSql = vt.sql ?? "";
    out.push(`${vtSql};`);
    const isFts5 = /USING\s+fts5\s*\(/i.test(vtSql);
    const { columns, options } = isFts5 ? parseFts5(vtSql) : { columns: [], options: {} as Record<string, string> };
    if (isFts5 && "content" in options) {
      const content = options.content;
      const problem = content === "" ? "index sans contenu (content='') : rien à partir de quoi le reconstruire" : await ftsRebuildProblem(db, content, options.content_rowid ?? "rowid", columns);
      if (problem) {
        warnings.push(`index plein texte « ${vt.name} » restauré vide (structure conservée) : ${problem}.`);
        out.push(`-- ${vt.name} : non reconstruit, ${problem}.`);
      } else {
        const rebuild = `INSERT INTO ${q(vt.name)}(${q(vt.name)}) VALUES('rebuild');`;
        if (schema.some((s) => s.type === "view" && s.name === content)) afterViews.push(rebuild);
        else out.push(rebuild);
      }
    } else {
      const { columns: cols, rows } = await tableRows(db, vt.name);
      for (const row of rows) out.push(`INSERT INTO ${q(vt.name)} (${cols.map(q).join(",")}) VALUES (${row.map(sqlLiteral).join(",")});`);
    }
  }

  // 4. Index, déclencheurs et vues (sql NULL = index automatique de clé primaire).
  for (const type of ["index", "trigger", "view"]) {
    for (const s of schema.filter((x) => x.type === type && x.sql && !isInternal(x.name) && !isShadowOf(x.tbl_name, virtualTables))) {
      out.push(`${s.sql};`);
    }
  }
  out.push(...afterViews);

  out.push("COMMIT;", "");
  return { sql: out.join("\n"), counts, warnings };
}

/**
 * Découpe une sauvegarde produite par dumpDatabase en instructions SQL, sans
 * les commentaires ni PRAGMA / BEGIN / COMMIT. Tient compte des chaînes
 * ('…' et "…", qui peuvent contenir « ; ») et des corps de déclencheurs
 * (BEGIN … END;). Sert à restaurer par lots sur une base distante.
 */
export function splitDump(sql: string): string[] {
  const statements: string[] = [];
  let cur = "";
  let quote: string | null = null;
  let lineComment = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "-" && sql[i + 1] === "-" && cur.trim() === "") {
      lineComment = true;
      continue;
    }
    if (ch === "'" || ch === '"') quote = ch;
    cur += ch;
    if (ch !== ";") continue;
    const stmt = cur.trim();
    // Dans un déclencheur, les « ; » du corps ne terminent pas l'instruction : seul « END; » la termine.
    if (/^CREATE\s+(TEMP\w*\s+)?TRIGGER\b/i.test(stmt) && !/\bEND\s*;$/i.test(stmt)) continue;
    cur = "";
    if (/^(PRAGMA\s+foreign_keys|BEGIN\s+TRANSACTION|COMMIT)\b/i.test(stmt)) continue;
    statements.push(stmt.replace(/;$/, ""));
  }
  if (quote || cur.trim()) throw new Error("sauvegarde tronquée : dernière instruction incomplète");
  return statements;
}

/** Nombre de lignes attendu par table, d'après les INSERT de la sauvegarde (hors reconstructions d'index et compteurs). */
export function expectedCounts(statements: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of statements) {
    const create = /^CREATE TABLE\s+("(?:[^"]|"")+"|\S+)/i.exec(s);
    if (create) counts[unquote(create[1]).replace(/""/g, '"')] ??= 0;
    const ins = /^INSERT INTO\s+("(?:[^"]|"")+"|[^\s(]+)\s*\(/i.exec(s);
    if (!ins) continue;
    const table = unquote(ins[1]).replace(/""/g, '"');
    if (table === "sqlite_sequence" || /VALUES\s*\(\s*'rebuild'\s*\)$/i.test(s)) continue;
    counts[table] = (counts[table] ?? 0) + 1;
  }
  return counts;
}

type VerifyRequest ={ dbFile: string; sqlFile: string; expected: Record<string, number>; ftsTable: string | null };

/** Restauration + contrôles, exécutés dans le processus enfant (voir verifyDump). */
async function runVerification({ dbFile, sqlFile, expected, ftsTable }: VerifyRequest): Promise<string[]> {
  const copy = createClient({ url: `file:${dbFile}` });
  const problems: string[] = [];
  try {
    await copy.executeMultiple(fs.readFileSync(sqlFile, "utf8"));
    for (const [table, n] of Object.entries(expected)) {
      const rs = await copy.execute(`SELECT count(*) AS n FROM ${q(table)}`);
      const got = Number(rs.rows[0].n);
      if (got !== n) problems.push(`${table} : ${got} lignes au lieu de ${n}`);
    }
    if (ftsTable) {
      const rs = await copy.execute(`SELECT count(*) AS n FROM ${q(ftsTable)} WHERE ${q(ftsTable)} MATCH 'berger'`);
      if (Number(rs.rows[0].n) === 0) problems.push(`recherche biblique (${ftsTable}) vide après restauration`);
    }
  } catch (err) {
    problems.push(`restauration impossible : ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    copy.close();
  }
  return problems;
}

/**
 * Recharge la sauvegarde dans une base temporaire et compare les nombres de lignes.
 * La restauration tourne dans un processus enfant : après une erreur SQL, libSQL
 * garde le fichier ouvert jusqu'à la fin du processus (même après close()), ce
 * qui empêchait sa suppression sous Windows. Une fois l'enfant terminé, le
 * dossier temporaire est toujours supprimé, que la vérification réussisse ou non.
 */
export function verifyDump(sqlFile: string, expected: Record<string, number>, ftsTable: string | null): string[] {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zc-verification-"));
  try {
    const request: VerifyRequest = { dbFile: path.join(dir, "restauration.db"), sqlFile, expected, ftsTable };
    const child = spawnSync(process.execPath, [...process.execArgv, __filename, "--verificateur"], {
      input: JSON.stringify(request),
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
    const last = child.stdout?.trim().split("\n").pop() ?? "";
    try {
      return JSON.parse(last) as string[];
    } catch {
      const detail = (child.error?.message ?? child.stderr ?? "").trim() || `code de sortie ${child.status}`;
      return [`vérification interrompue : ${detail}`];
    }
  } finally {
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    } catch {
      console.warn(`ATTENTION : dossier temporaire non supprimé (contient une copie des données) : ${dir}`);
    }
  }
}

async function main() {
  const url = process.env.TURSO_BACKUP_URL?.trim();
  const authToken = process.env.TURSO_BACKUP_TOKEN?.trim();
  if (!url) {
    console.error("TURSO_BACKUP_URL manquant : créez le fichier .env.backup (voir l'en-tête de scripts/turso-backup.ts).");
    process.exit(2);
  }

  const outDir = path.resolve(arg("out") ?? DEFAULT_OUT_DIR);
  const refusal = unsafeOutDirReason(outDir);
  if (refusal) {
    console.error(`Refusé : ${outDir} — ${refusal}. Choisissez un dossier en dehors (la sauvegarde contient des données personnelles).`);
    process.exit(2);
  }

  const dbName = url.startsWith("file:") ? path.parse(url.slice(5)).name : new URL(url).hostname.split(".")[0];
  const now = new Date();
  const p2 = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}_${p2(now.getHours())}-${p2(now.getMinutes())}`;
  const file = path.join(outDir, `${dbName}_${stamp}.sql`);

  const db = createClient({ url, authToken, intMode: "bigint" });
  console.log(`Lecture de la base ${dbName}…`);
  const { sql, counts, warnings } = await dumpDatabase(db);
  db.close();

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(file, sql, { flag: "wx" });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`Sauvegarde écrite : ${file} (${(fs.statSync(file).size / 1024 / 1024).toFixed(1)} Mo, ${Object.keys(counts).length} tables, ${total} lignes)`);

  console.log("Vérification : restauration dans une base temporaire…");
  const fts = /CREATE VIRTUAL TABLE "?bible_verses_fts"?/i.test(sql) ? "bible_verses_fts" : null;
  for (const w of warnings) console.warn(`Avertissement : ${w}`);
  const problems = verifyDump(file, counts, fts);
  if (problems.length > 0) {
    console.error("Sauvegarde INCOMPLÈTE :");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log("Sauvegarde vérifiée : toutes les tables ont le bon nombre de lignes" + (fts ? ", recherche biblique fonctionnelle." : "."));
  for (const [t, n] of Object.entries(counts)) console.log(`  ${t.padEnd(28)} ${n}`);
}

if (require.main === module && process.argv.includes("--verificateur")) {
  // Processus enfant de verifyDump : requête JSON sur stdin, problèmes en JSON sur stdout.
  runVerification(JSON.parse(fs.readFileSync(0, "utf8")) as VerifyRequest)
    .then((problems) => console.log(JSON.stringify(problems)))
    .catch((err) => console.log(JSON.stringify([`vérification impossible : ${err instanceof Error ? err.message : String(err)}`])));
} else if (require.main === module) {
  main().catch((err) => {
    console.error(`Sauvegarde impossible : ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
