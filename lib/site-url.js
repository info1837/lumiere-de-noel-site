// Résolution de l'origine du site pour les URLs absolues (canonicals, og:image,
// JSON-LD, sitemap, robots). L'ordre de priorité :
//   1. NEXT_PUBLIC_SITE_URL — override explicite (prod, staging, custom)
//   2. NEXT_PUBLIC_VERCEL_URL / VERCEL_URL — URL du déploiement (preview)
//   3. Fallback : le domaine de production
//
// Quand le domaine change (ex. bascule .ca → .com), il suffit de mettre
// NEXT_PUBLIC_SITE_URL sur Vercel — pas de commit nécessaire.
// SEO P0 §3.1 — LE bug qui coûtait le référencement du site.
//
// L'ordre de priorité plaçait VERCEL_URL avant le domaine de production.
// En Production, VERCEL_URL vaut l'URL du déploiement
// (lumiere-de-noel-site-xxxxx.vercel.app) : Google recevait donc, sur
// CHAQUE page, un canonical, un og:url, un og:image et des URLs JSON-LD
// pointant vers une adresse protégée par le SSO Vercel, qu'il ne peut pas
// charger. Les partages Facebook/Messenger n'avaient pas d'image non plus.
//
// Le domaine canonique est désormais écrit en dur. NEXT_PUBLIC_SITE_URL
// reste le seul levier (bascule de domaine), et VERCEL_URL n'entre plus
// jamais dans une URL publique — un preview annonce volontairement les
// canonicals de la production, ce qui est le comportement voulu.
const CANONIQUE = "https://www.lumieredenoelinc.com";

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || CANONIQUE;
  return raw.replace(/\/+$/, "");
}
