// Relais du code de photo : le navigateur → ici → le CRM.
//
// POST → crée un code, et rend le QR DÉJÀ DESSINÉ.
// GET  → dit où en est le code.
//
// Deux raisons de passer par le site plutôt que d'appeler le CRM depuis le
// navigateur : la clé d'intake reste côté serveur, et l'adresse du CRM
// n'apparaît pas dans le HTML public. Même motif que app/api/simulateur.
//
// ⚠️ LE QR EST DESSINÉ ICI, PAS CHEZ UN TIERS.
//
// Les générateurs d'images QR en ligne (api.qrserver.com, Google Charts, et
// les autres) prennent le contenu à encoder DANS L'URL de l'image. Utiliser
// l'un d'eux enverrait le code — qui ouvre le droit d'écrire une photo sur la
// fiche d'un client — dans les journaux d'un service qu'on ne contrôle pas.
// La bibliothèque `qrcode` tourne dans cette fonction ; rien ne sort.

import QRCode from 'qrcode';

const CRM_BASE = (process.env.CRM_BASE_URL || 'https://palencia-crm.vercel.app').replace(/\/$/, '');
const CRM_URL = `${CRM_BASE}/api/public/lumiere/simulateur/relais`;

const json = (d, s = 200) => Response.json(d, {
  status: s,
  headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
});

const SANS_CLE = {
  ok: false, raison: 'non_configure',
  message: 'Le transfert depuis le cellulaire est momentanément indisponible. Téléversez la photo depuis cet ordinateur.',
};

/**
 * L'origine à mettre dans le QR.
 *
 * L'hôte de la REQUÊTE, pas le domaine canonique : le téléphone doit atterrir
 * sur le même déploiement que l'ordinateur. Sinon un QR scanné depuis une
 * préversion — ou depuis localhost pendant un test — mènerait en production,
 * où le code existe mais où `CRM_BASE_URL` peut pointer ailleurs.
 */
function origineDe(request) {
  const host = (request.headers.get('host') || '').trim();
  if (!host) return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lumieredenoelinc.com').replace(/\/$/, '');
  const local = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(host);
  const proto = request.headers.get('x-forwarded-proto') || (local ? 'http' : 'https');
  return `${proto}://${host}`;
}

/** « K7M2P-R4TXQ » — dicté au téléphone sans faire répéter. */
const lisible = (c) => (c && c.length === 10 ? `${c.slice(0, 5)}-${c.slice(5)}` : c || '');

export async function POST(request) {
  const cle = process.env.LUMIERE_INTAKE_KEY;
  if (!cle) {
    console.error('[relais-photo] LUMIERE_INTAKE_KEY absente — code impossible');
    return json(SANS_CLE);
  }

  let corps;
  try { corps = await request.json(); } catch { return json({ ok: false, raison: 'corps_illisible' }, 400); }

  let j;
  try {
    const r = await fetch(CRM_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-intake-key': cle },
      // Liste blanche : on ne relaie QUE ce que la route attend.
      body: JSON.stringify({
        leadId: String(corps?.leadId ?? '').slice(0, 64),
        telephone: String(corps?.telephone ?? '').slice(0, 40),
      }),
    });
    j = await r.json().catch(() => ({}));
  } catch (e) {
    console.error('[relais-photo] CRM injoignable :', e?.message);
    return json({ ok: false, raison: 'reseau', message: SANS_CLE.message });
  }

  if (!j?.ok || !j?.code) return json({ ok: false, raison: j?.raison || 'indisponible', message: j?.message || SANS_CLE.message });

  const origine = origineDe(request);
  const hote = origine.replace(/^https?:\/\//, '');
  // Le QR porte le chemin complet, tel que demandé. Le lien montré en TEXTE
  // passe par /p/CODE : « lumieredenoelinc.com/p/K7M2P-R4TXQ » se tape sur un
  // clavier de téléphone, « /simulateur/photo?t=… » ne se tape pas.
  const url = `${origine}/simulateur/photo?t=${j.code}`;
  const lienCourt = `${origine}/p/${j.code}`;

  let qr = null;
  try {
    qr = await QRCode.toString(url, {
      type: 'svg', errorCorrectionLevel: 'M', margin: 1, width: 208,
      color: { dark: '#0b1a2b', light: '#ffffff' },
    });
  } catch (e) {
    // Sans image, le lien en texte suffit encore à finir le parcours.
    console.error('[relais-photo] QR non dessiné —', e?.message);
  }

  return json({
    ok: true,
    code: j.code,
    codeLisible: lisible(j.code),
    url,
    lienCourt,
    // Ce qu'on AFFICHE sous le QR, en DEUX morceaux. Rendu d'un seul tenant,
    // « lumieredenoelinc.com/p/K7M2P-R4TXQ » dépasse la colonne et le
    // navigateur le coupe où il veut — mesuré : « …/p/J47F7-Q » puis « ZREZ ».
    // Un code coupé en deux est un code qu'on recopie de travers. La page
    // renvoie donc l'hôte et le chemin séparément, chacun insécable : si ça
    // ne tient pas, ça passe à la ligne ENTRE les deux.
    lienHote: hote,
    lienChemin: `/p/${lisible(j.code)}`,
    qr,
    expire_a: j.expire_a || null,
    duree_ms: j.duree_ms || null,
  });
}

export async function GET(request) {
  const cle = process.env.LUMIERE_INTAKE_KEY;
  if (!cle) return json(SANS_CLE);

  const code = (new URL(request.url).searchParams.get('code') || '').slice(0, 24);
  if (!code) return json({ ok: false, raison: 'code_absent' }, 400);

  try {
    const r = await fetch(`${CRM_URL}?code=${encodeURIComponent(code)}`, {
      headers: { 'x-intake-key': cle },
      cache: 'no-store',
    });
    return json(await r.json().catch(() => ({ ok: false, raison: 'indisponible' })));
  } catch (e) {
    console.error('[relais-photo] CRM injoignable :', e?.message);
    return json({ ok: false, raison: 'reseau' });
  }
}
