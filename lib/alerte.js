// =============================================================================
// Alerte Telegram — pour les pannes que personne ne verrait autrement
// =============================================================================
// Ce dépôt n'avait AUCUN mécanisme d'alerte : six `console.*`, dont trois
// dans le navigateur du visiteur. Une panne du relais CRM se lisait donc
// comme un succès — le client voyait « Merci ! », et personne n'apprenait
// que le lead n'était arrivé nulle part.
//
// POURQUOI LE SITE ALERTE LUI-MÊME, ET NON VIA LE CRM
// La panne qu'on veut voir est précisément « le CRM ne répond pas ». Une
// alerte qui passerait par le CRM se tairait exactement quand elle compte.
//
// Ne lève jamais : un rapporteur qui plante en rapportant une panne serait
// une plaisanterie. Reprend la fenêtre anti-répétition de
// palencia-crm/lib/loud-failure.js — une même panne alerte au plus une
// fois par demi-heure, pour qu'une panne durable ne noie pas le signal.
//
// Variables (Vercel, ce projet) : TELEGRAM_BOT_TOKEN, LUMIERE_TELEGRAM_CHAT_ID
// =============================================================================

const RECENTES = new Map();
const FENETRE_MS = 30 * 60 * 1000;

/**
 * @param {string} signature  regroupe les répétitions d'une même panne
 * @param {string} texte      ce qu'un humain doit lire
 * @returns {Promise<boolean>} true si un message est parti
 */
export async function alerter(signature, texte) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.LUMIERE_TELEGRAM_CHAT_ID;

    // Toujours dans les journaux, même sans Telegram configuré.
    console.error(`[lumiere/alerte] ${signature}\n${texte}`);

    if (!token || !chat) return false;

    const derniere = RECENTES.get(signature) || 0;
    if (Date.now() - derniere < FENETRE_MS) return false;
    RECENTES.set(signature, Date.now());
    if (RECENTES.size > 200) RECENTES.clear();

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat,
        text: `🔴 Site Lumière de Noël\n\n${texte}`,
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch {
    return false; // ne jamais lever depuis le rapporteur
  }
}
