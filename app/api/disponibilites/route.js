// Les disponibilités, relayées sur NOTRE domaine.
//
// ⚠️ POURQUOI CETTE ROUTE EXISTE — le bug des « 26 places / 30 places ».
//
// Le bandeau est rendu sur le serveur, et `lib/disponibilites.js` met la
// réponse du CRM en cache une heure. Le cache de DONNÉES est bien partagé
// entre les routes ; le cache de PAGE, lui, ne l'est pas. Chaque route garde
// son HTML prérendu avec l'instantané qu'elle avait au moment de sa propre
// régénération. Résultat observé : l'accueil affichait « 26 places » pendant
// que /simulateur affichait encore « 30 places » — deux pages du même site,
// deux chiffres, et le visiteur qui ouvre les deux onglets voit la rareté
// se contredire.
//
// Le CRM n'autorise pas le domaine du site en CORS, donc le navigateur ne
// peut pas aller lire la source lui-même. Cette route est le relais
// same-origin qui le lui permet : chaque page, après hydratation, se
// resynchronise sur la MÊME valeur. L'HTML serveur reste la première
// peinture (bon pour le SEO et le sans-JavaScript) ; la valeur vivante
// arrive un tick plus tard, identique partout.
//
// Elle ne rend JAMAIS un nombre inventé : quand le CRM se tait, elle rend
// `rarete: null`, et le bandeau disparaît comme il le fait déjà.

import { lireDisponibilites, messageRarete, FRAICHEUR_SECONDES } from '@/lib/disponibilites';

// Le cache du CDN porte la fraîcheur, pas le client : un visiteur qui change
// de page ne doit pas rouvrir une connexion au CRM.
export const revalidate = FRAICHEUR_SECONDES;

export async function GET() {
  const rarete = messageRarete(await lireDisponibilites());
  return Response.json(
    { rarete },
    {
      headers: {
        // `stale-while-revalidate` : la page s'affiche tout de suite avec la
        // valeur en cache pendant qu'on rafraîchit derrière.
        'cache-control': `public, s-maxage=${FRAICHEUR_SECONDES}, stale-while-revalidate=300`,
      },
    },
  );
}
