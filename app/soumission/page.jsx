import Link from "next/link";
import QuoteForm from "@/components/QuoteForm";
import Testimonials from "@/components/Testimonials";
import { SectionTag } from "@/components/ui";
import { company, navy, ivory, serviceOptions, processSteps } from "@/components/data";
import { PHOTOS } from "@/components/photos";

export const metadata = {
  title: "Réserver ma date",
  description:
    "Réservez votre date pour vos lumières de Noël ou votre éclairage architectural permanent. Un nombre limité de propriétés chaque saison.",
  alternates: { canonical: "/soumission" },
  openGraph: {
    title: { absolute: "Réserver ma date | Solution Lumière de Noël" },
    description: "Réservez votre date pour vos lumières de Noël ou votre éclairage permanent. Un nombre limité de propriétés chaque saison.",
    url: "/soumission",
    images: [PHOTOS["blainville-01"].src],
  },
};

// Colonne de gauche — mini-étapes après l'envoi (réduit le doute).
// Le MÊME parcours que Sophie et que la frise de l'accueil (data.js →
// processSteps) : texto, appel, prix ferme. Aucune visite.
const nextSteps = processSteps.slice(0, 3).map((e) => ({ n: e.num, title: e.title, body: e.desc }));

export default function Soumission({ searchParams }) {
  // ⚠️ La liste d'attente passe par le MÊME formulaire et le MÊME envoi.
  //
  // Seule la `source` change. C'est elle qui porte l'étiquette jusque dans
  // le CRM, et le consentement en dérive — il reste donc exact : « accordé
  // le … via Liste d'attente ». Rien d'autre n'est touché : ni le pixel,
  // ni l'event_id, ni /api/lead.
  //
  // Un deuxième formulaire aurait voulu dire un deuxième consentement, un
  // deuxième envoi et deux endroits où une correction peut être oubliée.
  const listeAttente = String(searchParams?.["liste-attente"] || "") === "1";
  const sourceFormulaire = listeAttente
    ? "Liste d'attente — site Lumière"
    : "Formulaire de soumission (complet)";

  // ?service=commercial — présélectionne l'option du menu déroulant. La
  // valeur vient de serviceOptions, pas d'une chaîne écrite ici : si
  // l'option est renommée, elle bouge d'un seul endroit.
  const serviceDemande = String(searchParams?.service || "");
  const serviceInitial = serviceDemande === "commercial"
    ? serviceOptions.find((o) => /commercial/i.test(o)) || null
    : null;
  // ── Ce qui arrive du simulateur ────────────────────────────────────
  //
  // /simulateur envoie ?nom=&tel=&adresse=&style= après la révélation. Le
  // visiteur vient de taper tout ça pour débloquer son image : le
  // formulaire doit arriver rempli, sinon le bouton « Réserver ma date »
  // le fait recommencer au moment précis où il est le plus décidé.
  //
  // Les valeurs sont BORNÉES ici : ce sont des paramètres d'URL, donc du
  // texte fourni par qui veut. Elles finissent dans un champ de
  // formulaire, puis dans le CRM. Même traitement que dans
  // app/api/lead/route.js, où `clean()` borne déjà tout.
  const borne = (v, max) => String(v ?? "").slice(0, max);
  const styleSim = borne(searchParams?.style, 60);
  const prerempli = (searchParams?.nom || searchParams?.tel || searchParams?.adresse)
    ? {
      nom: borne(searchParams?.nom, 120),
      telephone: borne(searchParams?.tel, 40),
      adresse: borne(searchParams?.adresse, 240),
      message: styleSim ? `Style choisi au simulateur : ${styleSim}` : "",
    }
    : null;
  // La source dit d'où vient la fiche : Yahir voit dans le CRM que
  // celle-ci a vu sa maison illuminée avant d'écrire.
  const sourceFinale = prerempli ? "Simulateur — réservation" : sourceFormulaire;

  // 2 photos représentatives (Rive-Nord + Rive-Sud) pour la colonne de gauche.
  // ⚠️ LE FORMULAIRE D'ABORD (partie 3). Il était à 1,5 écran de haut sur
  // téléphone, derrière un bloc d'étapes et deux photos : quelqu'un qui
  // arrive sur « Réserver ma date » a déjà décidé. Le H1, une phrase, le
  // formulaire — puis ce qui rassure, pour qui hésite encore.
  return (
    <>
      <section style={{ background: navy, paddingTop: "calc(var(--entete-total) + 40px)" }}>
        <div className="container bloc-formulaire">
          <div style={{ marginBottom: 14 }}>
            <Link href="/renouvellement" className="lien-pastille">
              Vous étiez client l&apos;an dernier ? Réservez votre date →
            </Link>
          </div>
          <SectionTag dark>Réservation</SectionTag>
          <h1 style={{ color: ivory, marginBottom: 14 }}>
            {listeAttente ? "Liste d’attente" : "Réservez votre date"}
          </h1>
          <p style={{ color: "rgba(243,233,210,0.86)", fontSize: 18, marginBottom: 26 }}>
            {listeAttente
              ? "La saison est complète. Laissez-nous vos coordonnées : on vous appelle dès qu’une date se libère, et en priorité l’an prochain."
              : "Nous confirmons votre place et votre prix après un court appel."}
          </p>
          <QuoteForm source={sourceFinale} serviceInitial={serviceInitial} prerempli={prerempli} variante="sombre" />
        </div>
      </section>

      <section style={{ background: "#060E18" }}>
        <div className="container rassurance">
          <div>
            <SectionTag dark>Ce qui se passe ensuite</SectionTag>
            <ol className="rassurance-etapes">
              {nextSteps.map((st) => (
                <li key={st.n}>
                  <span className="rassurance-num" aria-hidden="true">{st.n}</span>
                  <span>
                    <strong>{st.title}</strong>
                    {st.body}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="rassurance-rappels">
              <span aria-hidden="true">✓</span>
              Ampoule brûlée ou section tombée ? On repasse sans frais, autant de fois qu&apos;il le faut — de la pose au retrait.
            </p>
            <p className="rassurance-contact">
              <a href={company.phoneHref} className="rassurance-tel">{company.phoneDisplay}</a>
              <a href={company.emailHref}>{company.email}</a>
              <span>{company.region}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Témoignages — invisible tant que REVIEWS_PENDING = true dans reviews.js */}
      <Testimonials limit={6} variant="dark" />
    </>
  );
}
