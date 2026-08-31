// =============================================================================
// POST /api/calc-noel — la calculatrice de toiture, côté serveur
// =============================================================================
// Le navigateur envoie les POINTS que le visiteur a tracés. Il n'envoie
// jamais une distance, et s'il en envoyait une on ne la lirait pas : une
// longueur venue du client est une longueur choisie par le client, et ici
// elle deviendrait un prix.
//
// LE CHEMIN
//   navigateur ──► /api/calc-noel  (ici)
//                    │ recalcule les pi linéaires (haversine, lib/geo.js)
//                    │ x-intake-key, serveur→serveur, jamais exposée
//                    ▼
//                  CRM /api/quote/lumiere ──► quoteLumiere()
//
// La clé d'intake est une clé d'ÉCRITURE sur plusieurs surfaces du CRM.
// Elle ne doit jamais atteindre le navigateur : elle vit dans l'env serveur
// de ce projet, et seul ce fichier la lit.
//
// Variables (Vercel) : LUMIERE_INTAKE_KEY
//                      TELEGRAM_BOT_TOKEN + LUMIERE_TELEGRAM_CHAT_ID (alertes)
// =============================================================================

import { piLineaires, lignesMesurables } from '@/lib/geo';
import { alerter } from '@/lib/alerte';

const CRM = 'https://palencia-crm.vercel.app';
const URL_DEVIS = `${CRM}/api/quote/lumiere`;
const URL_LEADS = `${CRM}/api/leads`;

// L'entreprise à laquelle ce site DOIT parler. Le CRM échoue le businessId
// qu'il a résolu depuis la clé ; s'il ne dit pas « lumiere », la clé pointe
// ailleurs et les leads partiraient dans la mauvaise base — silencieusement.
const ENTREPRISE_ATTENDUE = 'lumiere';

const propre = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const json = (d, status = 200) => Response.json(d, { status });

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }

  // Pot de miel : un robot remplit tous les champs, un humain ne voit pas
  // celui-ci. On répond 200 pour ne rien lui apprendre.
  if (propre(body.website)) return json({ ok: true, quotable: false });

  const cle = process.env.LUMIERE_INTAKE_KEY;
  if (!cle) {
    await alerter('cle-intake-absente',
      "LUMIERE_INTAKE_KEY absente : la calculatrice ne peut ni chiffrer ni "
      + "enregistrer un lead. Chaque visiteur qui trace sa toiture repart sans rien.");
    return json({ ok: false, error: 'non_configure' }, 500);
  }

  // --- 1. La mesure, recalculée ici ---------------------------------------
  const lignes = Array.isArray(body.lines) ? body.lines : [];
  const nbLignes = lignesMesurables(lignes);
  const linearFt = piLineaires(lignes);

  const contact = body.contact || {};
  const nom = propre(contact.nom || contact.name, 120);
  const telephone = propre(contact.telephone || contact.phone, 40);
  const courriel = propre(contact.courriel || contact.email, 160);
  const adresse = propre(body.address || body.adresse, 240);

  // Colonnes, arbres, arbustes : ils ne changent JAMAIS le prix. Ils
  // basculent la soumission en « évaluation sur place » et se disent au
  // vendeur. Les guirlandes et couronnes n'existent pas ici du tout.
  const extras = body.extras || {};
  const surPlace = ['colonnes', 'arbres', 'arbustes'].filter((k) => extras[k] === true);

  // --- 2. Le prix vient du CRM, jamais d'ici -------------------------------
  let devis = null;
  try {
    const res = await fetch(URL_DEVIS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-intake-key': cle },
      body: JSON.stringify({ linearFt, needsOnSiteAssessment: surPlace.length > 0 }),
    });
    if (!res.ok) {
      await alerter(`devis-refuse-${res.status}`,
        `Le CRM a refusé une demande de prix (HTTP ${res.status}).\n`
        + `Mesure : ${linearFt} pi linéaires, ${nbLignes} section(s).\n`
        + (res.status === 401
          ? "401 → la clé n'est pas reconnue. Vérifier LUMIERE_INTAKE_KEY : un "
            + "espace ou un retour à la ligne en trop suffit, la clé est hachée."
          : ''));
      return json({ ok: false, error: 'devis_indisponible' }, 502);
    }
    devis = await res.json();
  } catch (e) {
    await alerter('devis-reseau',
      `Le CRM est injoignable pour le calcul de prix : ${e?.message || 'réseau'}.\n`
      + `Le visiteur ne voit aucun prix.`);
    return json({ ok: false, error: 'devis_indisponible' }, 502);
  }

  // --- 3. Vérifier À QUI on vient de parler --------------------------------
  // Sans ce contrôle, une clé mal collée enverrait tout chez Palencia sans
  // que rien ne le dise — l'angle mort documenté dans TRACKED_ISSUES.
  if (devis.businessId && devis.businessId !== ENTREPRISE_ATTENDUE) {
    await alerter('mauvaise-entreprise',
      `⛔ LA CLÉ POINTE VERS LA MAUVAISE ENTREPRISE.\n\n`
      + `Le CRM a répondu businessId="${devis.businessId}", attendu "${ENTREPRISE_ATTENDUE}".\n`
      + `LUMIERE_INTAKE_KEY sur ce projet Vercel est probablement celle de ${devis.businessId}.\n`
      + `Tant que ce n'est pas corrigé, les leads de Lumière atterrissent dans la mauvaise base.`);
    return json({ ok: false, error: 'mauvaise_entreprise' }, 502);
  }

  // --- 4. Le lead, avec la mesure et la phrase que le client a vue ---------
  let leadEnregistre = false;
  if (nom && (telephone || courriel)) {
    const notes = [
      `Calculatrice toiture : ${linearFt} pi linéaires sur ${nbLignes} section(s).`,
      devis.quotable ? `Prix affiché au client : ${devis.total} $.` : `Aucun prix affiché (évaluation).`,
      // La même phrase que le client a lue à l'écran — pour que Yahir
      // ouvre le lead et voie exactement ce qui lui a été montré.
      devis.note ? `Note affichée : ${devis.note}` : '',
      surPlace.length ? `À évaluer sur place : ${surPlace.join(', ')}.` : '',
      propre(body.message, 800) ? `Message : ${propre(body.message, 800)}` : '',
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch(URL_LEADS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-intake-key': cle },
        body: JSON.stringify({
          name: nom, phone: telephone, email: courriel,
          address: adresse,
          service: 'Lumières de Noël',
          source: 'Calculatrice toiture — site Lumière',
          notes, language: 'fr',
          // Colonnes déjà présentes sur `leads` et acceptées par /api/leads.
          linear_ft: linearFt,
          measure_method: 'map',
          line_count: nbLignes,
        }),
      });
      leadEnregistre = res.ok;
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        await alerter(`lead-refuse-${res.status}`,
          `⚠️ UN LEAD DE LA CALCULATRICE N'A PAS ÉTÉ ENREGISTRÉ (HTTP ${res.status}).\n\n`
          + `${nom} — ${telephone || courriel}\n${adresse || 'adresse non fournie'}\n`
          + `${linearFt} pi linéaires${devis.quotable ? `, prix affiché ${devis.total} $` : ''}\n\n`
          + `Rappeler cette personne à la main : elle a vu un prix et croit être inscrite.\n`
          + `${detail.slice(0, 200)}`);
      }
    } catch (e) {
      await alerter('lead-reseau',
        `⚠️ UN LEAD DE LA CALCULATRICE EST PERDU (réseau).\n\n`
        + `${nom} — ${telephone || courriel}\n${adresse || 'adresse non fournie'}\n`
        + `${linearFt} pi linéaires\n\nRappeler à la main. ${e?.message || ''}`);
    }
  }

  // --- 5. Ce que le navigateur reçoit --------------------------------------
  // Exactement ce que le CRM a autorisé, plus l'état d'enregistrement. On ne
  // recompose aucun prix ici : ce fichier ne connaît ni tarif ni plancher.
  return json({
    ok: true,
    quotable: devis.quotable === true,
    total: devis.total ?? null,
    linearFt: devis.linearFt ?? linearFt,
    note: devis.note || null,
    includes: Array.isArray(devis.includes) ? devis.includes : [],
    needsOnSiteAssessment: devis.needsOnSiteAssessment === true,
    surPlace,
    reason: devis.reason || null,
    leadEnregistre,
  });
}

export async function GET() {
  return json({ error: 'method_not_allowed' }, 405);
}
