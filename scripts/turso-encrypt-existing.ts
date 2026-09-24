/**
 * Chiffre les sauvegardes .sql déjà présentes (par défaut dans
 * Documents\Sauvegardes-Turso), avec la même méthode que npm run db:backup :
 * archive .7z AES-256 aux noms chiffrés, test par déchiffrement complet, puis
 * suppression du .sql en clair seulement si le test réussit.
 *
 *   npm run db:chiffrer
 *   npm run db:chiffrer -- --dossier <dossier>          (autre dossier de sauvegardes)
 *   npm run db:chiffrer -- --copie D:\Sauvegardes        (copie en plus chaque archive)
 *
 * Un seul mot de passe (demandé deux fois, non affiché) pour tous les fichiers.
 * Un .sql dont l'archive .7z existe déjà est laissé tel quel (rien n'est écrasé).
 */
import fs from "node:fs";
import path from "node:path";
import { archivePathFor, sevenZipPath } from "./backup-crypto";
import { DEFAULT_OUT_DIR, copyDestination, encryptBackups } from "./turso-backup";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const dir = path.resolve(arg("dossier") ?? DEFAULT_OUT_DIR);
  const copyDir = copyDestination(arg("copie"));
  sevenZipPath();
  if (!fs.existsSync(dir)) {
    console.error(`Dossier introuvable : ${dir}`);
    process.exit(2);
  }
  const all = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".sql")).sort().map((f) => path.join(dir, f));
  const skipped = all.filter((f) => fs.existsSync(archivePathFor(f)));
  const files = all.filter((f) => !skipped.includes(f));
  for (const f of skipped) console.log(`Ignoré (archive déjà présente, rien n'est écrasé) : ${path.basename(f)}`);
  if (files.length === 0) {
    console.log(`Aucun fichier .sql à chiffrer dans ${dir}.`);
    return;
  }
  console.log(`${files.length} sauvegarde(s) à chiffrer dans ${dir} :`);
  for (const f of files) console.log(`  ${path.basename(f)} (${(fs.statSync(f).size / 1024 / 1024).toFixed(1)} Mo)`);
  await encryptBackups(files, copyDir);
  console.log("Terminé : toutes les sauvegardes listées sont chiffrées et testées.");
}

main().catch((err) => {
  console.error(`Chiffrement impossible : ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
