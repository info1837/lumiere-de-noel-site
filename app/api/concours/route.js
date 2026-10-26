// Inscription au concours → CRM (POST /api/concours/inscription).
//
// Même contrat que app/api/lead/route.js : le navigateur ne voit jamais la
// clé d'intake ; cette route serveur relaie avec elle. Le CRM refait toutes
// les validations (4 villes, adresse, doublons, limite par IP) et rend
// { ok, statut: 'inscrit' | 'deja_inscrit' } ou { ok: false, erreur }.
//
// L'IP du visiteur part en `x-client-ip` : c'est elle que le CRM limite
// (6 essais / heure), hachée — jamais gardée en clair.
//
// Variable requise (Vercel) : LUMIERE_INTAKE_KEY

const CRM_BASE = (process.env.CRM_BASE_URL || "https://palencia-crm.vercel.app").replace(/\/$/, "");

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }
  const key = process.env.LUMIERE_INTAKE_KEY;
  if (!key) {
    console.error("[concours] LUMIERE_INTAKE_KEY absente — inscription NON transmise");
    return Response.json({ ok: false, erreur: "intake_not_configured" }, { status: 500 });
  }
  const ip = (request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  try {
    const res = await fetch(`${CRM_BASE}/api/concours/inscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-intake-key": key, ...(ip ? { "x-client-ip": ip } : {}) },
      body: JSON.stringify(body || {}),
    });
    const j = await res.json().catch(() => ({ ok: false, erreur: "reponse_illisible" }));
    return Response.json(j, { status: res.status });
  } catch (e) {
    console.error("[concours] échec réseau:", e?.message);
    return Response.json({ ok: false, erreur: "network" }, { status: 502 });
  }
}
