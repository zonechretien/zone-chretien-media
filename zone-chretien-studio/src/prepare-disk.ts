/**
 * Prépare un disque pour Zone-Chrétien : crée, à la racine du disque, le
 * dossier dédié de la bibliothèque (config.json → dossierBibliotheque, par
 * défaut Zone-Chretien-Studio), son fichier repère zc-studio.json et ses
 * sous-dossiers. Rien d'autre n'est créé ni modifié sur le disque.
 *
 *   npm run preparer-disque            → disque où se trouve le studio
 *   npm run preparer-disque -- G:      → autre disque
 *
 * Ne supprime et n'écrase jamais rien.
 */
import fs from "node:fs";
import path from "node:path";
import { APP_ID, loadConfig } from "./config";
import { LIBRARY_FOLDERS, MARKER_FILE, ensureLibraryFolders, type Marker } from "./drive";
import { STUDIO_DIR } from "./paths";

const target = process.argv[2];
const driveRoot = target ? path.parse(path.resolve(target.endsWith(":") ? `${target}\\` : target)).root : path.parse(STUDIO_DIR).root;

if (!fs.existsSync(driveRoot)) {
  console.error(`Disque introuvable : ${driveRoot}`);
  process.exit(1);
}

const root = path.join(driveRoot, loadConfig().dossierBibliotheque);
if (fs.existsSync(root) && !fs.lstatSync(root).isDirectory()) {
  console.error(`Refusé : ${root} existe mais n'est pas un vrai dossier (fichier, lien symbolique ou jonction).`);
  process.exit(1);
}
fs.mkdirSync(root, { recursive: true });

const markerPath = path.join(root, MARKER_FILE);
if (fs.existsSync(markerPath)) {
  console.log(`Repère déjà présent : ${markerPath} (non modifié).`);
} else {
  const marker: Marker = { application: APP_ID, nom: "Bibliothèque Zone-Chrétien", version: 1 };
  fs.writeFileSync(markerPath, `${JSON.stringify(marker, null, 2)}\n`, { flag: "wx" });
  console.log(`Repère créé : ${markerPath}`);
}
ensureLibraryFolders(root);
console.log(`Bibliothèque prête : ${root} (${LIBRARY_FOLDERS.join(", ")})`);
