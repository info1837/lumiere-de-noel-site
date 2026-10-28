// Google Ads — balise, conversion « Request quote », provenance « Google Ads ».
//
// Campagne « Lumières de Noël Rive-Nord 2026 ». Les identifiants sont publics
// (ils sont lisibles dans le HTML de n'importe quel site qui porte la balise).
//
// TROIS CHOSES, ET RIEN D'AUTRE :
//   1. la balise gtag.js, chargée une fois dans app/layout.jsx ;
//   2. trackQuoteConversion() — appelée par chaque formulaire de soumission
//      APRÈS la réponse positive du CRM, jamais au clic ni sur une erreur ;
//   3. la provenance : un visiteur arrivé par une pub Google (gclid dans
//      l'URL, ou utm_source=google) est retenu 90 jours, premier contact, et
//      le formulaire envoie « Google Ads » + le gclid brut au CRM.
//
// ⚠️ AUCUNE BANNIÈRE DE TÉMOINS sur le site (2026-10-28). La balise se charge
// donc normalement. Le jour où une bannière arrive (Loi 25), brancher le Mode
// de consentement v2 ici : `gtag('consent','default',{…denied})` AVANT la
// config, puis `gtag('consent','update',{…granted})` à l'acceptation.

export const GOOGLE_ADS_ID = "AW-18543107650";
// Action de conversion « Request quote ».
export const CONVERSION_SOUMISSION = "AW-18543107650/RrdiCIysn60dEMK8hYpF";

// ── Provenance ─────────────────────────────────────────────────────────
//
// localStorage, et pas sessionStorage comme les UTM (lib/utm.js) : un clic
// payé se convertit souvent des jours plus tard. Premier contact : un retour
// par une autre pub Google n'écrase pas le gclid d'origine tant qu'il vit.
const CLE = "lum_gads";
const DUREE_MS = 90 * 24 * 60 * 60 * 1000;
const NETTOYER = (v) => String(v || "").trim().replace(/[^\w.-]/g, "").slice(0, 200);

function stockage() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    window.localStorage.getItem(CLE); // lève en navigation privée stricte
    return window.localStorage;
  } catch { return null; }
}

/** Ce qu'on a retenu, ou null (rien, expiré, stockage bloqué). */
export function lireGoogleAds() {
  const s = stockage();
  if (!s) return null;
  try {
    const v = JSON.parse(s.getItem(CLE) || "null");
    if (!v || typeof v !== "object" || !v.at || Date.now() - v.at > DUREE_MS) return null;
    return v;
  } catch { return null; }
}

/** À appeler une fois au chargement de chaque page (app/ClientLayout.jsx). */
export function capturerGoogleAds() {
  if (typeof window === "undefined") return null;
  const deja = lireGoogleAds();
  if (deja) return deja;
  let p;
  try { p = new URLSearchParams(window.location.search); } catch { return null; }
  const gclid = NETTOYER(p.get("gclid"));
  const gbraid = NETTOYER(p.get("gbraid"));
  const wbraid = NETTOYER(p.get("wbraid"));
  const google = (p.get("utm_source") || "").trim().toLowerCase() === "google";
  if (!gclid && !gbraid && !wbraid && !google) return null;
  const v = {
    at: Date.now(),
    ...(gclid ? { gclid } : {}),
    ...(gbraid ? { gbraid } : {}),
    ...(wbraid ? { wbraid } : {}),
    landing: window.location.pathname.slice(0, 120),
  };
  try { stockage()?.setItem(CLE, JSON.stringify(v)); } catch {}
  return v;
}

/**
 * Côté SERVEUR (routes API) : le bloc `google_ads` que le navigateur a joint,
 * nettoyé. Rend null s'il n'y en a pas. Une valeur venue du visiteur : on ne
 * garde que des identifiants courts, jamais du texte libre.
 */
export function attributionGoogleAds(bloc) {
  if (!bloc || typeof bloc !== "object") return null;
  const gclid = NETTOYER(bloc.gclid);
  const gbraid = NETTOYER(bloc.gbraid);
  const wbraid = NETTOYER(bloc.wbraid);
  return {
    lead_source: "Google Ads",
    ...(gclid ? { gclid } : {}),
    ...(gbraid ? { gbraid } : {}),
    ...(wbraid ? { wbraid } : {}),
  };
}

/**
 * La source envoyée au CRM, avec « — Google Ads » en SUFFIXE.
 *
 * ⚠️ JAMAIS « Google Ads » seul. Le CRM inscrit Sophie d'après le DÉBUT de la
 * source (palencia-crm lib/business-config.js, autoEnrollPrefixes de Lumière :
 * « Formulaire », « Calculatrice », « Simulateur »). Une source « Google Ads »
 * créerait une fiche que Sophie n'écrit jamais. Le suffixe garde le préfixe,
 * le pipeline principal, et s'affiche tel quel dans l'alerte « Source : … ».
 */
export function sourceAvecGoogleAds(source, attribution) {
  return attribution ? `${source} — Google Ads`.slice(0, 120) : source;
}

/** La ligne de notes : visible sur la fiche, pour Yahir et pour Sophie. */
export function noteGoogleAds(attribution) {
  if (!attribution) return "";
  return `Source: Google Ads${attribution.gclid ? ` (gclid: ${attribution.gclid})` : ""}`;
}

// ── Conversion ─────────────────────────────────────────────────────────

// « 450 555-1234 » → « +14505551234 ». null si ce n'est pas un numéro nord-américain.
export function telephoneE164(tel) {
  const d = String(tel || "").replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}

/**
 * La conversion « Request quote ». Rend une promesse résolue quand Google a
 * reçu l'événement (event_callback) ou au plus tard après `limiteMs` : les
 * formulaires qui redirigent vers /merci l'ATTENDENT, sinon la navigation
 * coupe la requête.
 *
 * `transactionId` = l'event_id de la soumission : Google déduplique une même
 * soumission comptée deux fois.
 *
 * `honeypot` : la valeur du champ piège (HONEYPOT_FIELD) du formulaire.
 *
 * Conversions améliorées : courriel et téléphone (E.164) posés juste avant,
 * seulement ceux qui existent. gtag les hache lui-même avant l'envoi.
 */
export function trackQuoteConversion({ email, phone, transactionId, honeypot } = {}, limiteMs = 2500) {
  // Le piège à robots rempli : sendLead rend « succès » sans rien envoyer.
  // Ce n'est pas une demande, Google ne doit pas l'apprendre comme telle.
  if (honeypot) return Promise.resolve(false);
  if (typeof window === "undefined" || typeof window.gtag !== "function") return Promise.resolve(false);
  return new Promise((resolve) => {
    let fini = false;
    const terminer = (v) => { if (!fini) { fini = true; resolve(v); } };
    try {
      const courriel = String(email || "").trim().toLowerCase();
      const tel = telephoneE164(phone);
      const userData = {
        ...(courriel && courriel.includes("@") ? { email: courriel } : {}),
        ...(tel ? { phone_number: tel } : {}),
      };
      if (Object.keys(userData).length) window.gtag("set", "user_data", userData);
      window.gtag("event", "conversion", {
        send_to: CONVERSION_SOUMISSION,
        value: 1.0,
        currency: "CAD",
        ...(transactionId ? { transaction_id: String(transactionId) } : {}),
        event_callback: () => terminer(true),
      });
    } catch { terminer(false); return; }
    setTimeout(() => terminer(false), limiteMs);
  });
}
