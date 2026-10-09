import Link from "next/link";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import QuoteForm from "@/components/QuoteForm";
import RevelationLumiere from "@/components/RevelationLumiere";
import VitrineDefilante from "@/components/VitrineDefilante";
import { lireDisponibilites, messageRarete, dateEnFrancais } from "@/lib/disponibilites";
import { CTAButton, SectionTag, SectionTitle, FaqAccordion } from "@/components/ui";
import { paireAvantApres } from "@/components/photos";
import { faqHome, company, homeVitrine, navy, creme } from "@/components/data";

// =============================================================================
// L'ACCUEIL — HUIT SECTIONS, PAS QUATORZE
// =============================================================================
// Ce qui a été RETIRÉ, et pourquoi. Le détail compte : chacun de ces blocs
// a été ajouté pour une bonne raison, et c'est l'ACCUMULATION qui a fini
// par coûter plus que chaque ajout ne rapportait.
//
//   · ObjectionBar (4 cartes sur le bas du hero) — leurs faits sont
//     maintenant dans la ligne sobre du hero (le prix, les avis, le
//     territoire) et dans la liste de la section « ce qui est inclus »
//     (les rappels illimités, le retrait, l'entreposage). Rien n'est perdu ;
//     c'est dit une fois au lieu de deux.
//   · « Nos services » (3 cartes) — les trois pages existent toujours et
//     vivent dans la nav et le pied de page. Sur l'accueil, elles
//     demandaient au visiteur de choisir un rayon avant d'avoir vu une
//     maison.
//   · « Pourquoi nous choisir » (4 cartes) — fusionnée dans la section de
//     l'offre. Elle répétait le forfait en le reformulant.
//   · « Tarifs » (4 cartes + grand chiffre) — le prix est passé dans la
//     section de l'offre, à côté de ce qu'il achète. Un prix seul dans sa
//     section est un prix qu'on compare ; à côté de la liste, c'est un prix
//     qui s'explique.
//   · Bandeau ambre « les agendas se remplissent vite » — la ligne de
//     saison en haut de page le dit déjà, avec un vrai chiffre.
//   · « Zone de service » (pastilles de villes) — descend au pied de page,
//     où les liens /secteur/* gardent toute leur valeur SEO.
//   · ClientsFideles, Testimonials, trust-edge — le premier répétait le
//     renouvellement (section 6), le deuxième ne rend rien tant que
//     REVIEWS_PENDING est vrai, le troisième était une arête décorative.
//
// Et ce qui est ARRIVÉ : une seule section pour le simulateur, parce que
// c'est la seule chose de cette page qu'aucun concurrent du coin n'a.
// =============================================================================

export default async function Home() {
  // La page lit le CRM (serveur). Null quand le CRM se tait : aucune
  // mention de place ni de date, plutôt qu'un chiffre inventé.
  const rarete = messageRarete(await lireDisponibilites());
  const fermeture = dateEnFrancais(rarete?.fermetureLe);

  // ⚠️ LE COMPARATEUR MONTRE MAINTENANT UN VRAI AVANT/APRÈS.
  //
  // Il montrait la MÊME photo des deux côtés, l'une assombrie au filtre :
  // honnête — les étiquettes le disaient — mais ce n'était pas un
  // avant/après, et c'est pourtant ce que la section promet.
  //
  // Le « avant » de Léry est une simulation (la vraie photo, lumières
  // retirées), calée au pixel sur la vraie photo par
  // scripts/preparer-avant-apres.mjs. Les étiquettes disent lequel est
  // lequel : « Avant (simulation) » à gauche, « installation réelle » à
  // droite. C'est le côté DROIT qui porte l'affirmation, et c'est le seul
  // qui soit une photographie.
  const paireAccueil = paireAvantApres("avant-lery");

  return (
    <>
      {/* SEO : rich results FAQ — inchangé. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqHome.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      {/* ── 1 ─────────────────────────────────────────────────────────── */}
      <Hero />

      {/* ── 2 · Réalisations, en grand ─────────────────────────────────
          Six vignettes de 4/3 sur 1180 px faisaient des timbres-poste.
          Quatre photos en deux colonnes, chacune avec sa ville : la preuve
          avant l'argument, et assez grande pour être une preuve. */}
      <section style={{ background: navy }}>
        <div className="container">
          <div className="section-entete">
            <SectionTag dark>Réalisations</SectionTag>
            <SectionTitle light style={{ margin: 0 }}>
              De vraies propriétés, de vraies installations
            </SectionTitle>
          </div>
          {/* ⚠️ LA GRILLE DEVIENT UNE BANDE QUI DÉFILE.
              Mêmes quatre photos, mêmes villes — c'est le mouvement qui
              change, pas le contenu. Les clones de bouclage sont
              `aria-hidden` : la boucle a besoin de matière qui entre par
              la droite, un lecteur d'écran n'a pas besoin d'entendre les
              quatre villes deux fois.
              Les images ne passent pas par next/image ici : la piste est
              en `width: max-content` et chaque carte a une largeur
              fluide en `clamp()`, donc `fill` n'aurait aucune boîte de
              référence. Elles restent en `loading="lazy"`. */}
          <VitrineDefilante items={homeVitrine} />
          <p className="section-lien">
            <Link href="/realisations">Voir toutes les réalisations →</Link>
          </p>
        </div>
      </section>

      {/* ── 3 · Le simulateur, et rien d'autre dans la section ──────────
          C'est la signature de la page. Lui donner un voisin, c'est lui
          demander de partager l'attention qu'on vient de lui construire. */}
      <section style={{ background: "#060E18" }}>
        <div className="container">
          <div className="section-entete">
            <SectionTag dark>Le simulateur</SectionTag>
            <SectionTitle light style={{ margin: 0 }}>
              Voyez votre maison illuminée avant de réserver
            </SectionTitle>
            <p className="section-phrase">
              Une photo de votre façade, un style, et vous voyez le résultat —
              avant de nous confier quoi que ce soit.
            </p>
          </div>
          <RevelationLumiere
            photo={paireAccueil.apres}
            photoAvant={paireAccueil.avant}
            etiquetteAvant="Avant (simulation)"
            etiquetteApres="Après — installation réelle, Léry"
            altAvant="La même maison, sans aucune lumière de Noël — simulation"
            altApres="La même maison avec l'installation réelle de lumières de Noël, à Léry"
            legende="Léry — glissez pour voir la différence"
          />
          <p className="section-lien">
            <CTAButton href="/simulateur" variant="creme">Voir ma maison illuminée</CTAButton>
          </p>
        </div>
      </section>

      {/* ── 4 · L'offre, fusionnée ──────────────────────────────────────
          Elle remplace « Forfait tout inclus », « Pourquoi nous choisir »,
          « Tarifs » et les quatre cartes du hero. Le prix est à DROITE, au
          bas de la liste de ce qu'il achète. */}
      <section id="inclus" style={{ background: navy, scrollMarginTop: 84 }}>
        <div className="container offre">
          <div>
            <SectionTag dark>Forfait tout inclus</SectionTag>
            <SectionTitle light style={{ margin: "0 0 20px" }}>
              Votre propriété, illuminée — sans le tracas
            </SectionTitle>
            <p className="offre-texte">
              On fournit le matériel professionnel, on l&apos;installe en sécurité,
              on l&apos;entretient pendant la saison et on le retire après les Fêtes.
            </p>
            <p className="offre-texte">
              Vous, vous profitez du spectacle. Nous, on s&apos;occupe de tout le reste.
            </p>
          </div>
          <div className="offre-colonne">
            <ul className="offre-liste">
              {[
                "Conception sur mesure",
                "Installation par notre équipe",
                "Rappels illimités pendant la saison",
                "Retrait + entreposage inclus",
              ].map((t) => (
                <li key={t}>
                  <span className="bulb" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="offre-prix">
              À partir de <strong>{company.priceFrom}</strong>
              <span>prix ferme, écrit</span>
            </p>
            <CTAButton href="/soumission" variant="creme">Réserver ma date</CTAButton>
          </div>
        </div>
      </section>

      {/* ── 5 · Le parcours, sur une ligne ──────────────────────────── */}
      <HowItWorks variant="ligne" />

      {/* ── 6 · Renouvellement ──────────────────────────────────────── */}
      <section style={{ background: "#060E18" }}>
        <div className="container bloc-etroit">
          <SectionTag dark>Déjà client</SectionTag>
          <SectionTitle light style={{ margin: "0 auto 18px" }}>
            Votre matériel est déjà chez nous
          </SectionTitle>
          <p className="section-phrase" style={{ margin: "0 auto 26px" }}>
            On connaît votre propriété, votre design et vos mesures. Le
            renouvellement se confirme en un message, et votre date de l&apos;an
            dernier est réservée en priorité.
          </p>
          <p className="section-lien" style={{ marginTop: 0 }}>
            <Link href="/renouvellement">Renouveler mon installation →</Link>
          </p>
        </div>
      </section>

      {/* ── 7 · FAQ ─────────────────────────────────────────────────── */}
      <section style={{ background: navy }}>
        <div className="container">
          <div className="section-entete">
            <SectionTag dark>Questions fréquentes</SectionTag>
            <SectionTitle light style={{ margin: 0 }}>
              Ce qu&apos;on nous demande le plus
            </SectionTitle>
          </div>
          <FaqAccordion items={faqHome} dark />
        </div>
      </section>

      {/* ── 8 · Réservation — LE formulaire, une seule fois ───────────
          Il était dans le hero. Un service haut de gamme ne demande pas un
          numéro de téléphone avant d'avoir montré une maison illuminée :
          maintenant le visiteur a vu quatre réalisations, le curseur, le
          forfait et le prix avant d'arriver ici. */}
      <section id="soumission" style={{ background: creme }}>
        <div className="container bloc-formulaire">
          <div className="section-entete">
            <SectionTag>Réservation</SectionTag>
            <SectionTitle style={{ margin: "0 auto 14px" }}>Réservez votre date</SectionTitle>
            <p className="section-phrase section-phrase--clair">
              Nous confirmons votre place et votre prix après une courte consultation.
            </p>
          </div>
          <QuoteForm source="Formulaire d'accueil (réservation)" redirectSrc="accueil" />
          <p className="bloc-formulaire__pied">
            Vous préférez parler à quelqu&apos;un ?{" "}
            <a href={company.phoneHref}>{company.phoneDisplay}</a>
            {/* La date de fermeture est ICI, à l'endroit exact où quelqu'un
                hésite à remplir le formulaire — et sur téléphone c'est le
                seul endroit où elle apparaît, la ligne de saison la laissant
                tomber sous 480 px pour tenir sur une ligne. */}
            {fermeture && <><br />Réservations fermées le {fermeture}.</>}
          </p>
        </div>
      </section>
    </>
  );
}
