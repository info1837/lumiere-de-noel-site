// =============================================================================
// POST /api/formation/resultat — le résultat du test, vers Ops › Lumière
// =============================================================================
// Le jeton du bot reste ici. La page n'envoie que le nom et les réponses : le
// score et les questions manquées sont recalculés sur le serveur, donc le nom
// est le seul texte libre qui puisse arriver dans le groupe. Texte simple, sans
// parse_mode.
//
// Le groupe et le sujet ne sont pas des secrets : ce sont ceux de
// palencia-crm lib/telegram-sujets.js.
//
// Variable (Vercel) : TELEGRAM_BOT_TOKEN
// =============================================================================

import { alerter } from '@/lib/alerte';
import { composerMessage, corriger, dateFin, nettoyerNom } from '@/lib/formation-resultat';

const OPS_CHAT_ID = '-1003809205118';
const SUJET_LUMIERE = 4;

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

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return json({ ok: false }, 503);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: OPS_CHAT_ID,
        message_thread_id: SUJET_LUMIERE,
        text: composerMessage({ nom, resultat, date: dateFin(body?.finiLe) }),
        disable_web_page_preview: true,
      }),
    });
    const d = await res.json();
    if (!d.ok) throw new Error(`${res.status} ${d.description || ''}`);
    return json({ ok: true, messageId: d.result?.message_id, sujet: d.result?.message_thread_id ?? null });
  } catch (e) {
    await alerter('formation-resultat', `Résultat de formation non publié dans Ops.\n\n${e.message}`);
    return json({ ok: false }, 502);
  }
}

export async function GET() { return json({ error: 'method_not_allowed' }, 405); }
