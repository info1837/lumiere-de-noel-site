// =============================================================================
// POST /api/calc-telemetry — les pannes de la calculatrice, côté visiteur
// =============================================================================
// La calculatrice tournait sans aucun témoin : quand elle échouait chez un
// visiteur (et elle échouait, voir le bug d'inertie Safari), personne ne
// l'apprenait. Le visiteur repartait, c'est tout.
//
// Cette route reçoit les erreurs attrapées dans le navigateur et les fait
// suivre à l'alerte Telegram existante. Elle ne stocke rien.
//
// CE QU'ELLE N'ENVOIE PAS : ni l'adresse complète, ni le nom, ni le
// téléphone. Seulement la ville — assez pour reconnaître un secteur, pas
// assez pour identifier quelqu'un qui n'a pas encore soumis de formulaire.
//
// Variables (Vercel) : TELEGRAM_BOT_TOKEN + LUMIERE_TELEGRAM_CHAT_ID
// =============================================================================

import { alerter } from '@/lib/alerte';
// Pas de lib/intake-hardening dans ce dépôt : l'IP réelle se lit à la main,
// dans l'ordre où Cloudflare puis Vercel la posent.
function ipClient(request) {
  const h = request.headers;
  return (h.get('cf-connecting-ip')
    || h.get('x-real-ip')
    || (h.get('x-forwarded-for') || '').split(',')[0]
    || '').trim();
}

const propre = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const json = (d, status = 200) => Response.json(d, { status });

// Un seul signalement par minute et par client. Une page qui part en boucle
// d'erreurs ne doit pas noyer le fil Telegram — c'est la même logique que la
// fenêtre anti-répétition de lib/alerte.js, mais côté émetteur.
const VUS = new Map();
const FENETRE_MS = 60 * 1000;
function tropTot(cle) {
  const now = Date.now();
  for (const [k, t] of VUS) if (now - t > FENETRE_MS) VUS.delete(k);
  if (VUS.has(cle)) return true;
  VUS.set(cle, now);
  return false;
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false }, 400); }

  const etape = propre(body.step, 40) || 'inconnue';
  const message = propre(body.message, 400) || '(sans message)';
  const ua = propre(body.userAgent, 200);
  const viewport = propre(body.viewport, 40);
  const ville = propre(body.city, 80);
  const horodatage = propre(body.timestamp, 40) || new Date().toISOString();

  const ip = ipClient(request) || 'inconnue';
  if (tropTot(ip)) return json({ ok: true, limite: true });

  // La signature regroupe étape + message : dix visiteurs qui butent sur le
  // même mur produisent une alerte, pas dix.
  await alerter(`calc-${etape}-${message.slice(0, 40)}`,
    `⚠️ CALCULATRICE — échec côté visiteur\n\n`
    + `Étape    : ${etape}\n`
    + `Message  : ${message}\n`
    + `Ville    : ${ville || 'non renseignée'}\n`
    + `Écran    : ${viewport || '?'}\n`
    + `Heure    : ${horodatage}\n`
    + `Navigateur : ${ua || '?'}`);

  return json({ ok: true });
}

export async function GET() { return json({ error: 'method_not_allowed' }, 405); }
