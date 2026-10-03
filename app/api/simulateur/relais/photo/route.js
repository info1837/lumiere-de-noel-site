// Relais de la photo elle-même : le navigateur → ici → le CRM.
//
// POST → le TÉLÉPHONE dépose sa photo.
// GET  → l'ORDINATEUR la ramasse.
//
// Le téléphone n'a jamais la clé d'intake : c'est cette route qui l'ajoute.
// La page /simulateur/photo ne connaît donc que son code, qui ne vaut que
// quinze minutes et qu'une fois.

const CRM_BASE = (process.env.CRM_BASE_URL || 'https://palencia-crm.vercel.app').replace(/\/$/, '');
const CRM_URL = `${CRM_BASE}/api/public/lumiere/simulateur/relais/photo`;

// 4,2 Mo de base64 ≈ 3 Mo d'image, la borne du relais côté CRM. On refuse
// au-dessus sans appeler : un aller-retour inutile est un aller-retour qui
// échoue plus lentement.
const CORPS_MAX = Math.ceil(3 * 1024 * 1024 * 4 / 3) + 1024;

const ENTETES = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };
const json = (d, s = 200) => Response.json(d, { status: s, headers: ENTETES });

const INDISPO = 'Le transfert depuis le cellulaire est momentanément indisponible. Téléversez la photo depuis cet ordinateur.';

export async function POST(request) {
  const cle = process.env.LUMIERE_INTAKE_KEY;
  if (!cle) {
    console.error('[relais-photo] LUMIERE_INTAKE_KEY absente — dépôt impossible');
    return json({ ok: false, raison: 'non_configure', message: INDISPO });
  }

  let corps;
  try { corps = await request.json(); } catch { return json({ ok: false, raison: 'corps_illisible' }, 400); }

  const photo = typeof corps?.photo === 'string' ? corps.photo : '';
  if (photo.length > CORPS_MAX) {
    return json({ ok: false, raison: 'photo_trop_grosse',
      message: 'Cette photo est trop lourde. Reprenez-la ou choisissez-en une plus légère.' });
  }

  try {
    const r = await fetch(CRM_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-intake-key': cle },
      body: JSON.stringify({ code: String(corps?.code ?? '').slice(0, 24), photo }),
    });
    // Toujours 200 au navigateur : la page sait lire `ok` et `message`, et un
    // 502 lui ferait afficher une erreur technique.
    return json(await r.json().catch(() => ({ ok: false, raison: 'indisponible', message: INDISPO })));
  } catch (e) {
    console.error('[relais-photo] CRM injoignable :', e?.message);
    return json({ ok: false, raison: 'reseau', message: INDISPO });
  }
}

export async function GET(request) {
  const cle = process.env.LUMIERE_INTAKE_KEY;
  if (!cle) return json({ ok: false, raison: 'non_configure' }, 503);

  const code = (new URL(request.url).searchParams.get('code') || '').slice(0, 24);
  if (!code) return json({ ok: false, raison: 'code_absent' }, 400);

  let r;
  try {
    r = await fetch(`${CRM_URL}?code=${encodeURIComponent(code)}`, {
      headers: { 'x-intake-key': cle },
      cache: 'no-store',
    });
  } catch (e) {
    console.error('[relais-photo] CRM injoignable :', e?.message);
    return json({ ok: false, raison: 'reseau' }, 503);
  }
  if (!r.ok) return json({ ok: false, raison: 'indisponible' }, r.status);

  return new Response(r.body, {
    status: 200,
    headers: { ...ENTETES, 'Content-Type': r.headers.get('content-type') || 'image/jpeg' },
  });
}
