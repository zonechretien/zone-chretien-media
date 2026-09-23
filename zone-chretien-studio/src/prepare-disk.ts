/**
 * Prépare un disque pour Zone-Chrétien : crée le fichier repère
 * zc-studio.json et les dossiers de la bibliothèque à la racine du disque.
 *
 *   npm run preparer-disque            → disque où se trouve le studio
 *   npm run preparer-disque -- G:      → autre disque
 *
 * Ne supprime et n'écrase jamais rien.
 */
import fs from "node:fs";
import path from "node:path";
import { APP_ID } from "./config";
import { LIBRARY_FOLDERS, MARKER_FILE, ensureLibraryFolders, type Marker } from "./drive";
import { STUDIO_DIR } from "./paths";

const target = process.argv[2];
const root = target ? path.parse(path.resolve(target.endsWith(":") ? `${target}\\` : target)).root : path.parse(STUDIO_DIR).root;

if (!fs.existsSync(root)) {
  console.error(`Disque introuvable : ${root}`);
  process.exit(1);
}

const markerPath = path.join(root, MARKER_FILE);
if (fs.existsSync(markerPath)) {
  console.log(`Repère déjà présent : ${markerPath} (non modifié).`);
} else {
  const marker: Marker = { application: APP_ID, nom: "Bibliothèque Zone-Chrétien", version: 1 };
  fs.writeFileSync(markerPath, `${JSON.stringify(marker, null, 2)}\n`, { flag: "wx" });
  console.log(`Repère créé : ${markerPath}`);
}
ensureLibraryFolders(root);
console.log(`Dossiers prêts : ${LIBRARY_FOLDERS.join(", ")}`);
