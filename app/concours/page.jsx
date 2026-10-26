import { Gallery, FaqAccordion } from "@/components/ui";
import { PHOTOS } from "@/components/photos";
import HeroConcours from "./HeroConcours";
import CompteARebours from "./CompteARebours";
import FormulaireConcours from "./FormulaireConcours";
import Reglement from "./Reglement";
import {
  TIRAGE_COURT, RABAIS_AVANT, VALEUR_PRIX, VILLES_CONCOURS, FIN_TEXTE, TIRAGE_TEXTE,
} from "@/lib/concours";

// /concours — la page d'atterrissage de la publicité Meta du concours, et
// son règlement officiel (en bas, #reglements).
//
// Ordre voulu (375 px d'abord) : la maison qui s'allume → le compte à
// rebours → ce qu'on fait → le 15 % → le formulaire → les vraies photos →
// la FAQ → le règlement. Le formulaire arrive tôt : la personne qui clique
// la pub est venue pour participer.
const DESCRIPTION =
  "Gagnez l'installation de vos lumières de Noël (valeur jusqu'à 1 000 $). Blainville, Sainte-Thérèse, Rosemère, Boisbriand. Tirage le 6 novembre.";

export const metadata = {
  title: "Concours — Gagnez votre installation 2026",
  description: DESCRIPTION,
  alternates: { canonical: "/concours" },
  openGraph: {
    type: "website",
    title: "Ça pourrait être votre maison, gratuitement cet hiver! | Solution Lumière de Noël",
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

const FAQ = [
  { q: "Qui peut participer?", a: `Les résidents de ${VILLES_CONCOURS.join(", ")}, âgés de 18 ans et plus, propriétaires ou avec la permission du propriétaire. Une participation par adresse et par numéro de téléphone. Inscriptions jusqu'au ${FIN_TEXTE}.` },
  { q: "Comment le gagnant est choisi?", a: `Par tirage au hasard parmi toutes les participations admissibles, le ${TIRAGE_TEXTE}, en direct sur Instagram. La personne gagnante devra répondre à une question d'habileté mathématique. Aucun achat requis.` },
  { q: "Et si j'ai déjà réservé?", a: `Vous participez quand même, et réserver ne change rien à vos chances. Si vous gagnez après avoir réservé, on vous rembourse la valeur du prix, jusqu'à ${VALEUR_PRIX}.` },
  { q: "Le 15 % est valide jusqu'à quand?", a: `Pour toute réservation faite avant le ${RABAIS_AVANT}, pour tous les participants.` },
];

export default function Concours() {
  // Pas de <main> ici : le layout en pose déjà un (un seul par page).
  return (
    <div className="concours">
      <HeroConcours />
      <CompteARebours />

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

      <section className="concours-section concours-section--offre" aria-labelledby="offre-titre">
        <div className="concours-largeur">
          <div className="concours-offre">
            <p className="concours-offre__gros" id="offre-titre">Tous les participants : <b>15 % de rabais</b> sur une réservation faite avant le 6 novembre.</p>
            <p>Réservez maintenant : si vous gagnez, on vous rembourse jusqu&apos;à {VALEUR_PRIX}. Vous ne perdez rien à réserver tôt.</p>
          </div>
        </div>
      </section>

      <section id="participer" className="concours-section concours-section--form" aria-labelledby="form-titre">
        <div className="concours-largeur concours-largeur--form">
          <h2 id="form-titre" className="concours-h2">Je participe</h2>
          <p className="concours-intro">Une minute, et vous êtes dans le tirage du {TIRAGE_COURT}.</p>
          <FormulaireConcours />
        </div>
      </section>

      <section className="concours-section" aria-labelledby="galerie-titre">
        <div className="concours-largeur">
          <h2 id="galerie-titre" className="concours-h2">Nos installations, en vrai</h2>
          <Gallery items={GALERIE} prechargees={0} />
        </div>
      </section>

      <section className="concours-section" aria-labelledby="faq-titre">
        <div className="concours-largeur">
          <h2 id="faq-titre" className="concours-h2">Questions</h2>
          <FaqAccordion items={FAQ} dark />
        </div>
      </section>

      <Reglement />
    </div>
  );
}
