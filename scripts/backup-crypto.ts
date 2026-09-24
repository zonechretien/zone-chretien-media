/**
 * Chiffrement des sauvegardes Turso : archive .7z en AES-256, noms de fichiers
 * chiffrés (-mhe=on), avec le 7-Zip autonome en ligne de commande (7za.exe,
 * sans installation) rangé dans outils/7zip/ (non versionné, voir docs/REELS-STUDIO.md).
 *
 * Le mot de passe est saisi dans le terminal sans être affiché, puis transmis
 * à 7-Zip par son entrée standard : jamais en argument de commande (visible dans
 * la liste des processus), jamais écrit dans un fichier ni dans un journal.
 * « -sccUTF-8 » : 7-Zip lit l'entrée en UTF-8, ce qui donne la même clé que le
 * même mot de passe (accents compris) tapé plus tard dans la fenêtre de 7-Zip.
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");
export const SEVEN_ZIP = path.join(REPO_ROOT, "outils", "7zip", "7za.exe");
export const MIN_PASSWORD_LENGTH = 12;

export class BackupCryptoError extends Error {}

export function sevenZipPath(): string {
  if (!fs.existsSync(SEVEN_ZIP)) {
    throw new BackupCryptoError(
      `7-Zip en ligne de commande introuvable (${SEVEN_ZIP}). Voir docs/REELS-STUDIO.md, section « Sauvegarde de la base Turso ».`,
    );
  }
  return SEVEN_ZIP;
}

/** Saisie masquée dans le terminal (rien n'est affiché, pas même des étoiles). */
export function askHidden(question: string): Promise<string> {
  const stdin = process.stdin;
  if (!stdin.isTTY) {
    return Promise.reject(
      new BackupCryptoError("Le mot de passe doit être saisi dans un terminal interactif (PowerShell ou Invite de commandes)."),
    );
  }
  process.stdout.write(question);
  stdin.setRawMode(true);
  stdin.setEncoding("utf8");
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write("\n");
    };
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          finish();
          return resolve(value);
        }
        if (ch === "\u0003") {
          finish();
          return reject(new BackupCryptoError("Saisie annulée (Ctrl+C)."));
        }
        if (ch === "\u007f" || ch === "\b") value = Array.from(value).slice(0, -1).join("");
        else if (ch >= " ") value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

/** Raison de refuser un mot de passe, ou null s'il convient. */
export function passwordProblem(password: string): string | null {
  if (Array.from(password).length < MIN_PASSWORD_LENGTH) return `au moins ${MIN_PASSWORD_LENGTH} caractères`;
  if (password.trim() !== password) return "pas d'espace au début ni à la fin";
  return null;
}

/** Demande le mot de passe deux fois (jusqu'à 3 essais). */
export async function askNewPassword(): Promise<string> {
  console.log("");
  console.log("Chiffrement de la sauvegarde (AES-256). Le mot de passe ne s'affiche pas pendant la saisie.");
  console.log("⚠ Sans ce mot de passe, la sauvegarde est irrécupérable : notez-le dans un endroit sûr.");
  for (let attempt = 1; attempt <= 3; attempt++) {
    const first = await askHidden("Mot de passe : ");
    const problem = passwordProblem(first);
    if (problem) {
      console.log(`Mot de passe refusé : ${problem}.`);
      continue;
    }
    const second = await askHidden("Confirmez le mot de passe : ");
    if (first === second) return first;
    console.log("Les deux saisies sont différentes.");
  }
  throw new BackupCryptoError("Mot de passe non confirmé après 3 essais.");
}

function run7z(args: string[], passwordInput: string) {
  const r = spawnSync(sevenZipPath(), ["-sccUTF-8", "-bso0", "-bsp0", ...args], {
    input: Buffer.from(passwordInput, "utf8"),
    maxBuffer: 1024 * 1024 * 1024,
    windowsHide: true,
  });
  const stderr = r.stderr?.toString("utf8").trim() ?? "";
  return { ok: r.status === 0 && !r.error, stdout: r.stdout, detail: r.error?.message ?? stderr.split("\n").filter(Boolean).slice(-2).join(" ") };
}

export function sha256File(file: string): string {
  const hash = crypto.createHash("sha256");
  const fd = fs.openSync(file, "r");
  try {
    const buf = Buffer.alloc(1024 * 1024);
    let n: number;
    while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) hash.update(buf.subarray(0, n));
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest("hex");
}

/** Chemin de l'archive chiffrée correspondant à un fichier .sql. */
export const archivePathFor = (sqlFile: string) => sqlFile.replace(/\.sql$/i, "") + ".7z";

/**
 * Chiffre sqlFile dans <nom>.7z, vérifie l'archive (test d'intégrité puis
 * déchiffrement complet comparé octet pour octet par SHA-256), et seulement
 * alors supprime définitivement le .sql. En cas d'échec, le .sql est gardé.
 */
export function encryptAndRemove(sqlFile: string, password: string): string {
  const archive = archivePathFor(sqlFile);
  if (fs.existsSync(archive)) {
    throw new BackupCryptoError(`${archive} existe déjà : rien n'est écrasé. Le fichier .sql est conservé.`);
  }
  const dir = path.dirname(sqlFile);
  const name = path.basename(sqlFile);
  let expected: string;
  try {
    expected = sha256File(sqlFile);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    throw new BackupCryptoError(
      `lecture impossible${code === "EBUSY" || code === "EPERM" ? " (fichier ouvert par un autre programme ?)" : ""}. Le fichier .sql est conservé : ${sqlFile}`,
    );
  }

  // Création : 7-Zip demande le mot de passe puis sa confirmation, lus sur l'entrée standard.
  const created = run7z(["a", "-t7z", "-mhe=on", "-mx=9", "-p", archive, path.join(dir, name)], `${password}\n${password}\n`);
  if (!created.ok) {
    fs.rmSync(archive, { force: true });
    throw new BackupCryptoError(`Chiffrement impossible (${created.detail}). Le fichier .sql est conservé : ${sqlFile}`);
  }

  const tested = run7z(["t", archive], `${password}\n`);
  const extracted = tested.ok ? run7z(["e", "-so", archive], `${password}\n`) : null;
  const same = extracted?.ok && crypto.createHash("sha256").update(extracted.stdout).digest("hex") === expected;
  if (!tested.ok || !same) {
    throw new BackupCryptoError(
      `Le test de l'archive a échoué (${tested.ok ? "contenu déchiffré différent de la sauvegarde" : tested.detail}). ` +
        `Le fichier .sql est conservé : ${sqlFile} — archive à vérifier ou supprimer : ${archive}`,
    );
  }
  fs.rmSync(sqlFile);
  return archive;
}

/** Copie l'archive dans destDir (jamais d'écrasement) et vérifie la copie. */
export function copyArchive(archive: string, destDir: string): string {
  fs.mkdirSync(destDir, { recursive: true });
  const target = path.join(destDir, path.basename(archive));
  fs.copyFileSync(archive, target, fs.constants.COPYFILE_EXCL);
  if (sha256File(target) !== sha256File(archive)) {
    fs.rmSync(target, { force: true });
    throw new BackupCryptoError(`Copie vers ${destDir} incorrecte (contenu différent) : copie supprimée, l'original est intact.`);
  }
  return target;
}
