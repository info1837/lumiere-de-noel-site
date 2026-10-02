// Relais d'image : le navigateur → ici → le CRM.
//
// Le <img src> du comparateur ne peut pas porter d'en-tête, donc le jeton
// voyage dans l'URL — c'est une URL-capacité, longue et non devinable. Le
// CRM vérifie que la clé demandée appartient bien à la fiche de ce jeton.
//
// On passe par le site plutôt que de pointer le navigateur vers le CRM :
// ça garde le domaine du visiteur, et ça évite d'annoncer l'adresse du CRM
// dans le HTML public.

const CRM_BASE = (process.env.CRM_BASE_URL || 'https://palencia-crm.vercel.app').replace(/\/$/, '');
const CRM_IMAGE = `${CRM_BASE}/api/public/lumiere/simulateur/image`;

export async function GET(request) {
  const u = new URL(request.url);
  const cle = u.searchParams.get('cle') || '';
  const jeton = u.searchParams.get('jeton') || '';
  if (!cle || !jeton) return new Response('paramètres manquants', { status: 400 });

  const r = await fetch(`${CRM_IMAGE}?cle=${encodeURIComponent(cle)}&jeton=${encodeURIComponent(jeton)}`);
  if (!r.ok) return new Response('indisponible', { status: r.status });

  return new Response(r.body, {
    status: 200,
    headers: {
      'Content-Type': r.headers.get('content-type') || 'image/jpeg',
      // Privé et court : l'URL porte un jeton. Elle ne doit traîner ni dans
      // un cache partagé ni dans un index.
      'Cache-Control': 'private, max-age=300',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
