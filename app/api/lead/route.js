// Intake des leads du site → CRM.
//
// Le site n'appelle JAMAIS le CRM directement depuis le navigateur : la
// clé d'intake resterait visible dans le JavaScript public. Le formulaire
// poste ici, et cette route serveur relaie avec la clé.
//
// La clé détermine SEULE l'entreprise, et c'est le CRM qui la résout
// contre son plan de contrôle. On n'envoie aucun identifiant d'entreprise
// — même si on le faisait, le CRM l'ignorerait. La clé est à la fois le
// laissez-passer et la décision de routage.
//
// Variable requise (Vercel, sur ce projet) : LUMIERE_INTAKE_KEY

const CRM_BASE = (process.env.CRM_BASE_URL || 'https://palencia-crm.vercel.app').replace(/\/$/, '');
const CRM_INTAKE_URL = `${CRM_BASE}/api/leads`;

function clean(v, max = 500) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }

  const name = clean(body.nom || body.name, 120);
  const phone = clean(body.telephone || body.phone, 40);
  const email = clean(body.courriel || body.email, 160);
  if (!name || (!phone && !email)) {
    return Response.json({ ok: false, error: 'nom et (téléphone ou courriel) requis' }, { status: 400 });
  }

  const key = process.env.LUMIERE_INTAKE_KEY;
  if (!key) {
    // Échec bruyant : mieux vaut une erreur visible qu'un lead avalé.
    console.error('[lumiere/intake] LUMIERE_INTAKE_KEY absente — lead NON transmis au CRM');
    return Response.json({ ok: false, error: 'intake_not_configured' }, { status: 500 });
  }

  // ── LES UTM DU VISITEUR ──────────────────────────────────────────
  //
  // Retenus par lib/utm.js pour la durée de la visite, parce que le code
  // QR de l'accroche-porte mène à `/?utm_campaign=voisin_2026` et que le
  // visiteur remplit le formulaire deux écrans plus loin, quand l'URL ne
  // porte plus rien.
  //
  // ⚠️ NETTOYÉS COMME LE RESTE. C'est une valeur d'URL fournie par le
  // visiteur : elle atterrit dans la base et s'affiche dans Operatr. Un
  // `utm_campaign` de 4 000 caractères n'est pas une campagne.
  const utm = {};
  for (const c of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'landing']) {
    const v = clean(body?.utm?.[c], 120);
    if (v) utm[c] = v;
  }

  // Notes : le CRM n'a pas encore de colonnes pour budget/service Noël
  // (étape 7). On les met dans les notes pour ne rien perdre.
  const notes = [
    body.service ? `Service: ${clean(body.service, 120)}` : '',
    body.budget ? `Budget: ${clean(body.budget, 60)}` : '',
    body.message ? `Message: ${clean(body.message, 1000)}` : '',
    // TRACE DE CONSENTEMENT (Loi 25 / LCAP). Les deux formulaires
    // EXIGENT la case avant d'envoyer, et fabriquent une trace horodatee
    // (« accorde le 2026-09-27 via le formulaire du hero »). Cette trace
    // etait jetee ici : la preuve du consentement n'existait donc nulle
    // part dans le CRM, alors que c'est elle qui autorise les SMS.
    body.consentement ? `Consentement: ${clean(body.consentement, 160)}` : '',
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch(CRM_INTAKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-intake-key': key },
      body: JSON.stringify({
        name, phone, email,
        address: clean(body.adresse || body.address, 240),
        // `ville` etait COLLECTE par le formulaire hero et jete ici : il
        // n'apparaissait ni dans le payload, ni dans les notes. Le lead
        // arrivait donc au CRM avec city = null, et Sophie B redemandait
        // une information que le client venait d'ecrire. Trouve le
        // 2026-09-27 pendant le test de bout en bout de Yahir.
        //
        // Le CRM accepte `city` (voir la liste de champs de
        // /api/leads). Le formulaire complet, lui, envoie `adresse`.
        city: clean(body.ville || body.city, 120),
        // Bloc du pixel (event_id, _fbp, _fbc, url de la page). Le CRM
        // renvoie le jumeau serveur avec le MEME event_id : Meta
        // deduplique, et si un bloqueur coupe le pixel du navigateur la
        // conversion survit quand meme. Relaye tel quel, jamais fabrique
        // ici : ces cookies n'existent que dans le navigateur du visiteur.
        ...(body.meta_pixel && typeof body.meta_pixel === 'object' ? { meta_pixel: body.meta_pixel } : {}),
        service: clean(body.service, 120) || 'Lumières de Noël',
        source: clean(body.source, 80) || 'Site — Lumière de Noël',
        notes,
        language: 'fr',
        // Les UTM partent dans `formAnswers`, la colonne JSON que le CRM
        // persiste déjà : aucune migration, aucune colonne neuve.
        // `lib/offre-voisin.js` y lit `utm_campaign` et pose l'étiquette
        // « Offre voisin 250 $ » sur la fiche. Omis quand il n'y en a
        // pas — `formAnswers: {}` écraserait ce qu'un autre chemin
        // aurait pu y mettre.
        ...(Object.keys(utm).length ? { formAnswers: utm } : {}),
        // Aucun business_id ici, volontairement : le CRM le déduit de la
        // clé. Un champ envoyé par le client serait ignoré de toute façon.
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[lumiere/intake] CRM a refusé:', res.status, detail.slice(0, 200));
      return Response.json({ ok: false, error: 'crm_rejected', status: res.status }, { status: 502 });
    }
    // L'id de la fiche remonte jusqu'au navigateur.
    //
    // ⚠️ L'ORDRE DU SIMULATEUR A CHANGÉ. Il créait la fiche à l'écran 1 et
    // rattachait la photo à l'écran 2. Il montre maintenant le résultat
    // d'abord et ne crée la fiche qu'à l'écran 4, derrière l'image floutée.
    // L'id reste nécessaire : c'est par lui que la génération se rattache à
    // la bonne fiche. Retrouver celle-ci par téléphone suffirait à
    // accrocher une image à la fiche de quelqu'un d'autre.
    const corpsCrm = await res.json().catch(() => ({}));
    return Response.json({ ok: true, id: corpsCrm?.id ?? null });
  } catch (e) {
    console.error('[lumiere/intake] échec réseau:', e?.message);
    return Response.json({ ok: false, error: 'network' }, { status: 502 });
  }
}
