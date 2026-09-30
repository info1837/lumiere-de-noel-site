import Link from "next/link";
import { lireDisponibilites, messageRarete, dateEnFrancais } from "@/lib/disponibilites";

// Le bandeau de rareté — le premier chiffre que le visiteur voit.
//
// ⚠️ IL N'EXISTE QUE S'IL EST VRAI.
//
// Quand le CRM ne répond pas, ou que la capacité n'est pas configurée,
// ce composant rend `null` : pas de bandeau, pas de squelette, pas de
// « quelques dates encore disponibles ». Une page sans bandeau ne dit rien ;
// une page avec un chiffre inventé dit quelque chose de faux, et le
// visiteur qui s'en aperçoit doute ensuite du prix.
//
// Rendu sur le SERVEUR (composant asynchrone) : la route du CRM n'autorise
// pas le domaine du site en CORS, et le rafraîchissement horaire vient de
// `revalidate`.
export default async function BandeauRarete() {
  const dispos = await lireDisponibilites();
  const msg = messageRarete(dispos);
  if (!msg) return null;

  const fermeture = dateEnFrancais(msg.fermetureLe);

  return (
    <div className="bandeau-rarete" role="status" aria-live="polite">
      <div className="bandeau-rarete__contenu">
        <span className="bandeau-rarete__pastille" aria-hidden="true" />
        {/* Un segment par mois, le rabais collé à celui qui y a droit.
            Avant, « Octobre » apparaissait deux fois : une dans le mois,
            une dans la mention du rabais posée à côté. */}
        {msg.segments.map((seg, i) => (
          <strong key={seg} className={i === 0 ? "bandeau-rarete__texte" : "bandeau-rarete__mois"}>{seg}</strong>
        ))}
        {fermeture && !msg.complet && (
          <span className="bandeau-rarete__note">Réservations fermées le {fermeture}</span>
        )}
        {msg.listeAttente && (
          <Link href="/soumission?liste-attente=1" className="bandeau-rarete__lien">
            Liste d’attente
          </Link>
        )}
      </div>
    </div>
  );
}
