/** Page « État et À propos » servie à http://127.0.0.1:<port>/ (aucune ressource externe). */

type Status = {
  version: string;
  application: string;
  disque: { detecte: true; lettre: string; dossier: string; nom: string } | { detecte: false; message: string };
  navigateurRendu: { etat: string; message: string | null };
  rendusEnCours: number;
  synchronisation: { etat: "pret"; modele: string } | { etat: "absent"; message: string };
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function aboutPage(s: Status, origins: string[]): string {
  const disque = s.disque.detecte
    ? `<span class="ok">Branché</span> — ${esc(s.disque.nom)} (${esc(s.disque.dossier)})`
    : `<span class="ko">${esc(s.disque.message)}</span>`;
  const navigateur =
    s.navigateurRendu.etat === "pret"
      ? `<span class="ok">Prêt</span>`
      : s.navigateurRendu.etat === "verification"
        ? "Vérification en cours…"
        : `<span class="ko">${esc(s.navigateurRendu.message ?? "Absent")}</span>`;
  const synchro =
    s.synchronisation.etat === "pret"
      ? `<span class="ok">Prête</span> — Whisper, modèle ${esc(s.synchronisation.modele)}`
      : `<span class="ko">${esc(s.synchronisation.message)}</span>`;

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Zone-Chrétien Reels Studio</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body{margin:0;font:15px/1.5 system-ui,sans-serif;background:#050E1F;color:#F8F5EE;padding:32px 16px}
  main{max-width:640px;margin:0 auto}
  h1{font-size:22px;margin:0 0 4px}
  .sub{color:#E9D48C;margin:0 0 24px}
  dl{display:grid;grid-template-columns:max-content 1fr;gap:8px 16px;background:#0B1E3D;padding:16px 20px;border-radius:12px}
  dt{color:rgba(248,245,238,.7)}
  dd{margin:0}
  .ok{color:#7ee2a8}.ko{color:#ff9b8a}
  button{margin-top:16px;background:#D4AF37;color:#050E1F;border:0;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer}
  footer{margin-top:32px;color:rgba(248,245,238,.6);font-size:13px}
  code{font-size:13px}
</style></head>
<body><main>
  <h1>Zone-Chrétien Reels Studio</h1>
  <p class="sub">Serveur local de rendu des Reels — version ${esc(s.version)}</p>
  <dl>
    <dt>Disque</dt><dd>${disque}</dd>
    <dt>Navigateur de rendu</dt><dd>${navigateur}</dd>
    <dt>Synchronisation</dt><dd>${synchro}</dd>
    <dt>Rendus en cours</dt><dd>${s.rendusEnCours}</dd>
    <dt>Identifiant</dt><dd><code>${esc(s.application)}</code></dd>
    <dt>Sites autorisés</dt><dd>${origins.map((o) => `<code>${esc(o)}</code>`).join("<br>")}</dd>
  </dl>
  <button id="retry" type="button">Réessayer la détection du disque</button>
  <footer>À propos : ce studio rend les vidéos sur ce PC, jamais sur Internet. Développé par Lepolo.</footer>
</main>
<script>
  document.getElementById("retry").addEventListener("click", async () => {
    await fetch("/api/disque/detecter", { method: "POST", headers: { "X-ZC-Studio": "1" } });
    location.reload();
  });
</script>
</body></html>`;
}
