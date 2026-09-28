// Meta Pixel — événement « Lead » avec event_id.
//
// Porté depuis palencia-site (2026-09-28), où la chaîne tourne depuis le
// 2026-09-14. Sur lumieredenoelinc.com le pixel était CODÉ mais mort :
// NEXT_PUBLIC_META_PIXEL_ID n'existait pas dans Vercel, donc
// PIXEL_ENABLED valait false et les quatre `fbq('track','Lead')` des
// formulaires tapaient dans le vide. Aucun Lead n'a jamais été compté.
//
// Chaque soumission génère UN event_id. Le navigateur l'envoie au pixel
// (fbq('track','Lead', …, { eventID })) et le même id part au CRM dans le
// bloc `meta_pixel` : le CRM renvoie le jumeau serveur (API Conversions)
// avec cet id, Meta déduplique. Si un bloqueur coupe le pixel, la
// conversion serveur reste. Utilisable côté client seulement (cookies,
// window) — les routes API du site ne font que relayer le bloc.

export function newLeadEventId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `lead-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function readCookie(name) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

// _fbp / _fbc tels que le pixel les pose. Sans _fbc mais avec un fbclid
// dans l'URL (clic sur une pub), on le reconstruit au format Meta.
export function readMetaCookies() {
  const fbp = readCookie("_fbp");
  let fbc = readCookie("_fbc");
  if (!fbc && typeof window !== "undefined") {
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
  }
  return { fbp, fbc };
}

// Le bloc à joindre au corps de la soumission (relayé tel quel au CRM).
export function metaPixelBlock(eventId) {
  const { fbp, fbc } = readMetaCookies();
  return {
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    fbp,
    fbc,
    event_source_url: typeof window !== "undefined" ? window.location.href : "",
  };
}

// fbq('track','Lead') avec l'eventID — jamais sans (sinon pas de dédup).
export function trackLead(eventId, params = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "Lead", params, { eventID: eventId });
    }
  } catch {}
}

// URL de /merci avec l'event_id : la page y rejoue Lead avec le MÊME id
// (dédupliqué) au lieu d'en compter un deuxième.
export function merciUrl(service, eventId) {
  const qs = new URLSearchParams();
  if (service) qs.set("service", service);
  if (eventId) qs.set("eid", eventId);
  const s = qs.toString();
  return `/merci${s ? `?${s}` : ""}`;
}
