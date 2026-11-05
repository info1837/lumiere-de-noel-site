// =============================================================================
// POST /api/formation/resultat — le résultat du test, vers Ops › Lumière
// =============================================================================
// La page n'envoie que le nom et les réponses : le score et les questions
// manquées sont recalculés ici, donc le nom est le seul texte libre qui puisse
// arriver dans le groupe.
//
// La publication passe par le CRM (palencia-crm app/api/formation/resultat) :
// le bot de ce site n'est pas membre du groupe Ops, celui du CRM oui. La clé
// reste sur le serveur, comme le jeton du bot reste dans le CRM.
//
// Variables (Vercel) : LUMIERE_INTAKE_KEY, CRM_BASE_URL (facultative)
// =============================================================================

import { alerter } from '@/lib/alerte';
import { composerMessage, corriger, dateFin, nettoyerNom } from '@/lib/formation-resultat';

const CRM_BASE = (process.env.CRM_BASE_URL || 'https://palencia-crm.vercel.app').replace(/\/$/, '');
const CRM_RESULTAT = `${CRM_BASE}/api/formation/resultat`;

const json = (d, status = 200) => Response.json(d, { status });

function ipClient(request) {
  const h = request.headers;
  return (h.get('cf-connecting-ip')
    || h.get('x-real-ip')
    || (h.get('x-forwarded-for') || '').split(',')[0]
    || '').trim();
}

function memeOrigine(request) {
  try {
    return new URL(request.headers.get('origin')).host === request.headers.get('host');
  } catch {
    return false;
  }
}

// Une équipe peut passer le test sur le même Wi-Fi : la limite est large, elle
// ne sert qu'à empêcher une boucle de noyer le sujet.
const VUS = new Map();
const FENETRE_MS = 60 * 60 * 1000;
const MAX_PAR_FENETRE = 20;
function tropDeResultats(cle) {
  const now = Date.now();
  for (const [k, l] of VUS) {
    const gardes = l.filter((t) => now - t < FENETRE_MS);
    if (gardes.length) VUS.set(k, gardes); else VUS.delete(k);
  }
  const liste = VUS.get(cle) || [];
  if (liste.length >= MAX_PAR_FENETRE) return true;
  VUS.set(cle, [...liste, now]);
  return false;
}

export async function POST(request) {
  if (!memeOrigine(request)) return json({ ok: false }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false }, 400); }

  const nom = nettoyerNom(body?.nom);
  const resultat = corriger(body?.reponses);
  if (!nom || !resultat) return json({ ok: false }, 400);

  if (tropDeResultats(ipClient(request) || 'inconnue')) return json({ ok: false }, 429);

  const key = process.env.LUMIERE_INTAKE_KEY;
  if (!key) return json({ ok: false }, 503);

  try {
    const res = await fetch(CRM_RESULTAT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-intake-key': key },
      body: JSON.stringify({ texte: composerMessage({ nom, resultat, date: dateFin(body?.finiLe) }) }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || !d.ok) throw new Error(`${res.status} ${d.erreur || ''}`);
    return json({ ok: true, messageId: d.messageId, sujet: d.sujet });
  } catch (e) {
    await alerter('formation-resultat', `Résultat de formation non publié dans Ops.\n\n${e.message}`);
    return json({ ok: false }, 502);
  }
}

export async function GET() { return json({ error: 'method_not_allowed' }, 405); }
