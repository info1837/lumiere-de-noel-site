import { Gallery } from "@/components/ui";
import { PHOTOS } from "@/components/photos";
import Link from "next/link";
import { company } from "@/components/data";
import HeroConcours from "./HeroConcours";
import Reglement from "./Reglement";
import { FIN_TEXTE, TIRAGE_TEXTE } from "@/lib/concours";

// /concours — le concours 2026 est TERMINÉ (2026-11-11, demande de Yahir).
//
// Inscriptions fermées le 5 novembre, tirage fait le 6 : la page ne montre
// plus de compte à rebours, de formulaire ni le 15 % (valide jusqu'au
// 6 novembre). Elle dit clairement que c'est fini, renvoie vers la
// réservation, et garde le règlement officiel (#reglements, avec la mention
// Meta). Ne jamais refaire de tirage d'ici : le gagnant est déjà choisi.
const DESCRIPTION =
  "Le concours 2026 de Solution Lumière de Noël est terminé : le tirage a eu lieu le 6 novembre 2026. Réservez votre installation pour cet hiver.";

export const metadata = {
  title: "Concours 2026 — terminé",
  description: DESCRIPTION,
  alternates: { canonical: "/concours" },
  openGraph: {
    type: "website",
    title: "Le concours 2026 est terminé | Solution Lumière de Noël",
    description: DESCRIPTION,
    url: "/concours",
    images: [PHOTOS["lery-01"].src],
  },
};

const BLOCS = [
  { t: "On installe", d: "Ligne de toit soulignée, posée par notre équipe, en sécurité.", icone: (
    <path d="M3 11 12 4l9 7M5 10v10h14V10M9 20v-5h6v5" /> ) },
  { t: "On entretient tout l'hiver", d: "Une lumière s'éteint? On s'en occupe, c'est compris.", icone: (
    <path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5 4.9 17.5M9 3.5l3 2 3-2M9 20.5l3-2 3 2" /> ) },
  { t: "On démonte et on entrepose", d: "Après les Fêtes, tout est retiré et rangé chez nous.", icone: (
    <path d="M3 8l9-5 9 5v8l-9 5-9-5V8zM3 8l9 5 9-5M12 13v8" /> ) },
];

const GALERIE = ["blainville-01", "residentiel-01", "st-jerome-01", "mirabel-01", "ste-julienne-01", "arbres-01"]
  .map((k) => ({ image: PHOTOS[k].src, alt: PHOTOS[k].alt }));

export default function Concours() {
  // Pas de <main> ici : le layout en pose déjà un (un seul par page).
  return (
    <div className="concours">
      <HeroConcours />

      <section className="concours-section concours-section--offre concours-termine" aria-labelledby="termine-titre">
        <div className="concours-largeur">
          <div className="concours-offre">
            <h2 className="concours-offre__gros" id="termine-titre">Le concours 2026 est <b>terminé</b>.</h2>
            <p>
              Les inscriptions ont fermé le {FIN_TEXTE} et le tirage a eu lieu le {TIRAGE_TEXTE}, en direct sur{" "}
              <a href={company.social.instagram.href} target="_blank" rel="noopener noreferrer">Instagram ({company.social.instagram.handle})</a>.
              Merci à tous les participants!
            </p>
            <p>Vous voulez quand même une maison illuminée cet hiver? Réservez votre date : pose, entretien et retrait inclus.</p>
            <p className="concours-termine__actions">
              <Link href="/soumission" className="concours-bouton">Réserver ma date</Link>
              <Link href="/realisations" className="concours-termine__lien">Voir nos réalisations →</Link>
            </p>
          </div>
        </div>
      </section>

      <section className="concours-section" aria-label="Le service compris dans le prix">
        <div className="concours-largeur concours-blocs">
          {BLOCS.map((b) => (
            <div key={b.t} className="concours-bloc">
              <svg className="concours-bloc__icone" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor"
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{b.icone}</svg>
              <h2 className="concours-bloc__titre">{b.t}</h2>
              <p>{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="concours-section" aria-labelledby="galerie-titre">
        <div className="concours-largeur">
          <h2 id="galerie-titre" className="concours-h2">Nos installations, en vrai</h2>
          <Gallery items={GALERIE} prechargees={0} />
        </div>
      </section>

      <Reglement />
    </div>
  );
}
