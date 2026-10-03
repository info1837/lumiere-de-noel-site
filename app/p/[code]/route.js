// /p/CODE → /simulateur/photo?t=CODE
//
// Le QR porte le chemin complet ; ce raccourci existe pour la ligne de texte
// affichée SOUS le QR, à l'intention de qui préfère taper plutôt que scanner.
// « lumieredenoelinc.com/p/K7M2P-R4TXQ » se tape sur un clavier de téléphone ;
// « /simulateur/photo?t=… » ne se tape pas.
//
// Le tiret de lisibilité et la casse sont absorbés ici : le CRM normalise de
// toute façon, mais autant que l'URL finale soit propre.

export const dynamic = 'force-dynamic';

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

export async function GET(request, { params }) {
  const brut = String(params?.code ?? '').toUpperCase();
  const code = brut.split('').filter((c) => ALPHABET.includes(c)).join('');
  const cible = code.length === 10 ? `/simulateur/photo?t=${code}` : '/simulateur/photo';
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL(cible, request.url).toString(),
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
