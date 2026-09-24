// Point d'entrée du bundle Remotion (rendu par le studio local uniquement).
// Le CMS n'importe jamais ce fichier : il importe directement templates.ts.
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
