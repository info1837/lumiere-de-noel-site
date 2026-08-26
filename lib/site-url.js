// Résolution de l'origine du site pour les URLs absolues (canonicals, og:image,
// JSON-LD, sitemap, robots). L'ordre de priorité :
//   1. NEXT_PUBLIC_SITE_URL — override explicite (prod, staging, custom)
//   2. NEXT_PUBLIC_VERCEL_URL / VERCEL_URL — URL du déploiement (preview)
//   3. Fallback : le domaine de production
//
// Quand le domaine change (ex. bascule .ca → .com), il suffit de mettre
// NEXT_PUBLIC_SITE_URL sur Vercel — pas de commit nécessaire.
const FALLBACK = "https://lumieredenoelinc.com";

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    FALLBACK;
  return raw.replace(/\/+$/, "");
}
