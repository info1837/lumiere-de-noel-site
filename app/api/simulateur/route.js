// Relais : le navigateur → ici → le CRM.
//
// Le site n'appelle JAMAIS la route de génération directement depuis le
// navigateur : la clé d'intake resterait lisible dans le JavaScript public,
// et n'importe qui pourrait brûler le plafond quotidien de Yahir.
//
// Même motif que app/api/lead/route.js, avec une différence : le corps porte
// une photo. On la borne ICI aussi, pour que le CRM ne reçoive jamais un
// corps de 40 Mo qu'il devrait décoder avant de le refuser.

import { createHash } from 'node:crypto';

// Surchargeable pour tester une préversion du CRM avant de la fusionner.
// En production la variable n'existe pas et la valeur par défaut s'applique.
const CRM_BASE = (process.env.CRM_BASE_URL || 'https://palencia-crm.vercel.app').replace(/\/$/, '');
const CRM_URL = `${CRM_BASE}/api/public/lumiere/simulateur`;

// 11 Mo de base64 ≈ 8 Mo d'image, la borne du CRM. On refuse au-dessus sans
// même appeler : un aller-retour inutile est un aller-retour qui échoue plus
// lentement.
const CORPS_MAX = 11 * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────────
// LE PLAFOND, ET CE QU'IL VAUT VRAIMENT
// ─────────────────────────────────────────────────────────────────────────
// ⚠️ CE COMPTEUR EST UN RALENTISSEUR, PAS UN COFFRE.
//
// Il vit dans la mémoire de l'instance. Sur Vercel, il y a plusieurs
// instances et elles redémarrent à froid : un visiteur déterminé qui tombe
// sur une autre instance repart à zéro. Le dire franchement vaut mieux que
// de laisser croire à une garantie — LE vrai plafond, celui qui protège la
// facture, est celui du CRM, à côté de l'appel au modèle.
//
// Ce compteur-ci attrape le cas courant et c'est déjà beaucoup : le même
// visiteur qui réappuie dix fois sur « voir ma maison illuminée ».
//
// Une limite partagée demanderait un magasin externe (Vercel KV, Upstash) ;
// aucun n'est installé sur ce projet, et en ajouter un pour trois
// générations par jour serait une dépendance de plus à maintenir.
const PAR_JOUR = 3;
const JOUR_MS = 24 * 60 * 60 * 1000;

/** ip → { n, reprise } */
const compteur = new Map();

/** clé → { quand, reponse } — le cache de génération. */
const cache = new Map();
const CACHE_MS = 60 * 60 * 1000; // une heure
const CACHE_MAX = 60;            // borne la mémoire de l'instance

const json = (d, s = 200) => Response.json(d, {
  status: s,
  headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
});

/**
 * L'IP du visiteur, telle que Vercel la transmet.
 *
 * `x-forwarded-for` peut porter une chaîne de mandataires ; la première
 * entrée est le client. En local, rien de tout ça n'existe — on retombe sur
 * une clé unique, donc le plafond s'applique à tout le monde ensemble, ce
 * qui est le bon comportement pour un poste de développement.
 */
function ipDe(request) {
  const xff = request.headers.get('x-forwarded-for') || '';
  const premiere = xff.split(',')[0].trim();
  return premiere || request.headers.get('x-real-ip') || 'locale';
}

function trop(ip) {
  const maintenant = Date.now();
  const e = compteur.get(ip);
  if (!e || maintenant > e.reprise) {
    compteur.set(ip, { n: 1, reprise: maintenant + JOUR_MS });
    return false;
  }
  if (e.n >= PAR_JOUR) return true;
  e.n += 1;
  return false;
}

/** On rend la place quand la génération n'a RIEN coûté (échec amont). */
function rembourser(ip) {
  const e = compteur.get(ip);
  if (e && e.n > 0) e.n -= 1;
}

/**
 * La clé de cache.
 *
 * ⚠️ L'IP EN FAIT PARTIE, ET CE N'EST PAS DE LA PRUDENCE EXCESSIVE.
 *
 * La consigne était « cacher par adresse + style ». Prise au mot, elle
 * ferait servir à un visiteur B la simulation de son voisin A qui a tapé la
 * même adresse — or la réponse contient le `jeton` qui ouvre la lecture des
 * images de la fiche de A. Les simulations sont privées (la page le dit, la
 * route d'image pose X-Robots-Tag: noindex). L'IP borne le cache à la
 * personne, ce qui suffit pour l'objectif réel : ne pas payer deux fois la
 * même génération.
 *
 * La PHOTO entre aussi dans la clé : deux photos différentes de la même
 * adresse donnent deux résultats différents, et servir l'ancien serait
 * servir la façade d'avant.
 */
function cleDe(ip, c) {
  const empreinte = createHash('sha256')
    .update(String(c.photo || '').slice(0, 4096))
    .digest('hex')
    .slice(0, 16);
  return [
    ip,
    String(c.adresse || '').toLowerCase().replace(/\s+/g, ' ').trim(),
    c.style, c.arbres ? 'a' : '-', c.etages,
    empreinte,
  ].join('|');
}

export async function POST(request) {
  const cle = process.env.LUMIERE_INTAKE_KEY;
  if (!cle) {
    // Échec BRUYANT côté serveur, message doux côté visiteur.
    console.error('[simulateur] LUMIERE_INTAKE_KEY absente — génération impossible');
    return json({ ok: false, raison: 'non_configure',
      message: 'Notre simulateur est momentanément indisponible. Yahir vous envoie votre simulation par texto sous peu.' });
  }

  let corps;
  try { corps = await request.json(); } catch { return json({ ok: false, raison: 'corps_illisible' }, 400); }

  const photo = typeof corps?.photo === 'string' ? corps.photo : '';
  if (photo.length > CORPS_MAX) {
    return json({ ok: false, raison: 'photo_trop_grosse',
      message: 'Cette photo est trop lourde. Reprenez-la ou choisissez-en une plus légère.' });
  }

  const ip = ipDe(request);
  const cleCache = cleDe(ip, { ...corps, photo });

  // ── Le cache AVANT le plafond ──────────────────────────────────────
  // Une réponse déjà payée ne doit pas consommer une place du quota : le
  // visiteur qui revient sur « précédent » puis « suivant » verrait son
  // troisième essai refusé pour une image qu'on ne régénère même pas.
  const vu = cache.get(cleCache);
  if (vu && Date.now() - vu.quand < CACHE_MS) {
    return json({ ...vu.reponse, cache: true });
  }

  if (trop(ip)) {
    return json({ ok: false, raison: 'plafond',
      message: `Vous avez utilisé vos ${PAR_JOUR} simulations du jour. Écrivez-nous et Yahir vous en prépare une à la main.` });
  }

  try {
    const r = await fetch(CRM_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-intake-key': cle },
      // Liste blanche : on ne relaie QUE ce que la route attend. Relayer le
      // corps tel quel laisserait passer un champ qu'on ajouterait plus tard
      // au formulaire sans y penser.
      body: JSON.stringify({
        // ⚠️ `leadId` PEUT ÊTRE VIDE, et c'est le changement de fond.
        //
        // L'ancien parcours créait la fiche au premier écran, donc la
        // génération en avait toujours une. Le nouveau montre d'abord le
        // résultat et ne demande les coordonnées qu'après : à cet instant,
        // il n'y a pas encore de fiche. Si le CRM exige `leadId` pour
        // stocker l'image et émettre le jeton, il répondra une erreur — et
        // le navigateur basculera alors sur « coordonnées d'abord » tout
        // seul (voir Simulateur.jsx, `besoinFiche`). Rien ne casse, mais le
        // vrai « wow d'abord » demande une modification côté CRM. C'est
        // écrit dans la PR.
        leadId: String(corps?.leadId ?? '').slice(0, 64),
        telephone: String(corps?.telephone ?? '').slice(0, 40),
        adresse: String(corps?.adresse ?? '').slice(0, 240),
        style: String(corps?.style ?? '').slice(0, 20),
        arbres: corps?.arbres === true,
        etages: String(corps?.etages ?? '').slice(0, 4),
        photo,
      }),
    });
    const j = await r.json().catch(() => ({}));

    if (j && j.ok) {
      if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
      cache.set(cleCache, { quand: Date.now(), reponse: j });
    } else {
      // Rien n'a été généré : la place retourne au quota.
      rembourser(ip);
    }

    // On rend TOUJOURS 200 au navigateur : la page sait lire `ok` et
    // `message`, et un 502 lui ferait afficher une erreur technique.
    return json(j);
  } catch (e) {
    console.error('[simulateur] CRM injoignable :', e?.message);
    rembourser(ip);
    return json({ ok: false, raison: 'reseau',
      message: 'Quelque chose a bloqué de notre côté. Yahir vous envoie votre simulation par texto sous peu.' });
  }
}
