// =============================================================================
// LES SECTIONS DES PAGES INTÉRIEURES — un seul système, celui de l'accueil
// =============================================================================
// Avant (audit d'octobre 2026) : l'accueil était sombre, photographique et
// calme ; chaque page de service, de ville, ville × service et de blog
// basculait après le hero dans un DOCUMENT blanc ou crème — du texte, une
// ou deux photos, une liste de villes qui remplissait un écran de
// téléphone, et un formulaire de 8 à 11 champs. Un autre site, plus vieux.
//
// Ici, les blocs que toutes ces pages partagent. Une page les ASSEMBLE ;
// elle ne les restyle pas. Trois règles :
//
//   1. FOND MARINE PARTOUT (#0A1524, ou #060E18 pour alterner). Le crème
//      (#F0EADE) est pour le texte et le bouton principal ; l'ambre
//      (#F0BA54) pour la lumière et les petites étiquettes. Aucune section
//      blanche — scripts/check-theme-sombre.mjs le mesure page par page.
//   2. LES CLASSES DE L'ACCUEIL, PAS DES COPIES. `.hero-section`,
//      `.section-entete`, `.offre`, `.frise` : le mouvement (FestiveLayer)
//      et la respiration mobile s'y appliquent sans rien ajouter.
//   3. UNE PAGE DE VILLE NE MONTRE QUE SA VILLE. Les photos SITUÉES d'une
//      autre ville n'entrent jamais dans un gabarit de ville
//      (check-pages-locales le vérifie sur le rendu).
// =============================================================================
import Image from "next/image";
import Link from "next/link";
import { CTAButton, SectionTag, SectionTitle, FaqAccordion, Breadcrumb } from "@/components/ui";
import QuoteForm from "@/components/QuoteForm";
import AmbiancesPermanent from "@/components/AmbiancesPermanent";
import HowItWorks from "@/components/HowItWorks";
import RevelationLumiere from "@/components/RevelationLumiere";
import { PHOTOS, paireAvantApres } from "@/components/photos";
import { flouDe } from "@/components/photos-flou";
import { company, cities, services, inCity, cleService, AMBIANCES_PERMANENT } from "@/components/data";

export const MARINE = "#0A1524";
export const MARINE_PROFOND = "#060E18";

// ── 1 · Le hero ──────────────────────────────────────────────────────────
// Le hero de l'accueil, en plus court : photo réelle pleine largeur, un H1,
// une phrase, deux boutons. `.hero-section` fait qu'il s'allume comme
// l'accueil (FestiveLayer). La ligne de preuve est la même : le prix et le
// territoire (plus d'avis d'une autre entreprise).
export function HeroPage({ photo, kicker, titre, phrase, filAriane = null, reserver = "#reserver", preuve = true }) {
  return (
    <section className="hero-section hero-section--page">
      {photo && (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          sizes="100vw"
          placeholder={flouDe(photo.src) ? "blur" : "empty"}
          blurDataURL={flouDe(photo.src)}
          style={{ objectFit: "cover" }}
        />
      )}
      <div className="hero-voile" aria-hidden="true" />
      <div className="hero-container" style={{ position: "relative", width: "100%" }}>
        <div className="hero-texte">
          {filAriane && <Breadcrumb items={filAriane} dark />}
          {kicker && <div className="hero-eyebrow">{kicker}</div>}
          <h1 className="hero-h1 hero-h1--page">{titre}</h1>
          {phrase && <p className="hero-phrase">{phrase}</p>}
          <div className="hero-boutons" data-barre-ancre data-gabarit>
            <CTAButton href={reserver} variant="creme">Réserver ma date</CTAButton>
            <CTAButton href="/simulateur" variant="outlineCreme">Voir ma maison illuminée</CTAButton>
          </div>
          {preuve && (
            <p className="hero-ligne" data-gabarit>
              <span>À partir de {company.priceFrom}</span>
              <span>Rive-Nord · Montréal · Rive-Sud</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ── 2 · La bande de photos ───────────────────────────────────────────────
// Trois VRAIES photos du service. Une légende de ville seulement si la
// photo est située (elle seule a le droit de nommer un lieu).
export function BandePhotos({ cles, legende = true, fond = MARINE }) {
  const photos = cles.map((k) => ({ cle: k, ...PHOTOS[k] })).filter((p) => p.src);
  if (!photos.length) return null;
  return (
    <section className="section-bande" style={{ background: fond }}>
      <div className="container">
        <div className={`bande-photos bande-photos--${photos.length}`}>
          {photos.map((p) => (
            <figure key={p.cle} className="bande-photo">
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 400px"
                placeholder={flouDe(p.src) ? "blur" : "empty"}
                blurDataURL={flouDe(p.src)}
                style={{ objectFit: "cover" }}
              />
              {legende && p.ville && <figcaption>{p.ville}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 3 · Ce qui est compris ───────────────────────────────────────────────
// Le bloc de l'offre de l'accueil (`.offre`) : le texte à gauche, la liste
// et le prix à droite, au bas de ce qu'il achète.
export function CeQuiEstCompris({ compris, titre = "Ce qui est compris", tag = "Forfait tout inclus", fond = MARINE_PROFOND }) {
  if (!compris) return null;
  return (
    <section style={{ background: fond }}>
      <div className="container offre">
        <div>
          <SectionTag dark>{tag}</SectionTag>
          <SectionTitle light style={{ margin: "0 0 20px" }}>{titre}</SectionTitle>
          <p className="offre-texte">{compris.texte}</p>
        </div>
        <div className="offre-colonne">
          <ul className="offre-liste">
            {compris.items.map((t) => (
              <li key={t}><span className="bulb" aria-hidden="true" />{t}</li>
            ))}
          </ul>
          <p className="offre-prix">
            <strong>{compris.prix}</strong>
            <span>{compris.prixNote}</span>
          </p>
          <CTAButton href="#reserver" variant="creme">Réserver ma date</CTAButton>
        </div>
      </div>
    </section>
  );
}

// ── 4 · Le comparateur ───────────────────────────────────────────────────
// Seulement sur une VRAIE paire (la vraie photo + sa simulation sans
// lumières), et seulement là où elle est pertinente : aucun gabarit ne
// montre un avant/après qui n'existe pas.
export function AvantApres({ cle, fond = MARINE }) {
  const paire = cle ? paireAvantApres(cle) : null;
  // La ville vient de la photo RÉELLE de la paire, jamais d'un texte écrit
  // à côté : c'est elle qui porte l'affirmation « installation réelle ».
  const ville = paire?.apres?.ville;
  if (!paire || !ville) return null;
  return (
    <section style={{ background: fond }}>
      <div className="container">
        <div className="section-entete">
          <SectionTag dark>Avant / après</SectionTag>
          <SectionTitle light style={{ margin: 0 }}>Glissez pour voir la différence</SectionTitle>
          <p className="section-phrase">Un vrai chantier. Le côté gauche est une simulation, le côté droit la photo de l&apos;installation.</p>
        </div>
        <RevelationLumiere
          photo={paire.apres}
          photoAvant={paire.avant}
          etiquetteAvant="Avant (simulation)"
          etiquetteApres={`Après — installation réelle, ${ville}`}
          altAvant="La même résidence, sans aucune lumière de Noël — simulation"
          altApres={`La même résidence avec l'installation réelle de lumières de Noël, à ${ville}`}
          legende={`${ville} — glissez pour voir la différence`}
        />
      </div>
    </section>
  );
}

// ── 5 · Le parcours ──────────────────────────────────────────────────────
// `data-gabarit` : de l'INTERFACE répétée à dessein (boutons, ligne de
// preuve, frise, en-tête de réservation). check-pages-locales l'exclut de sa
// mesure de texte commun — et seulement elle : les blocs rédigés (ce qui est
// compris, À propos, FAQ) restent comptés.
export function Parcours() {
  return <div data-gabarit><HowItWorks variant="ligne" /></div>;
}

// ── 6 · La FAQ ───────────────────────────────────────────────────────────
// Cinq questions au plus : au-delà, on ne répond plus, on remplit. Le
// JSON-LD FAQPage reprend exactement les questions affichées.
export const FAQ_MAX = 5;
export function FaqCourte({ items, titre = "Vos questions", tag = "Questions fréquentes", fond = MARINE_PROFOND }) {
  if (!items?.length) return null;
  const q = items.slice(0, FAQ_MAX);
  return (
    <section style={{ background: fond }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: q.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      <div className="container">
        <div className="section-entete">
          <SectionTag dark>{tag}</SectionTag>
          <SectionTitle light style={{ margin: 0 }}>{titre}</SectionTitle>
        </div>
        <FaqAccordion items={q} dark />
      </div>
    </section>
  );
}

// ── 7 · La réservation — LE formulaire court ─────────────────────────────
// La même `QuoteForm` que l'accueil, en variante sombre. `source` dit à
// Yahir de quelle page vient la fiche.
export function Reservation({ source, redirectSrc, serviceInitial = null, titre = "Réservez votre date", fond = MARINE }) {
  return (
    <section id="reserver" className="section-reserver" style={{ background: fond }}>
      <div className="container bloc-formulaire">
        <div className="section-entete" data-gabarit>
          <SectionTag dark>Réservation</SectionTag>
          <SectionTitle light style={{ margin: "0 auto 14px" }}>{titre}</SectionTitle>
          <p className="section-phrase">
            Nous confirmons votre place et votre prix après un court appel.
          </p>
        </div>
        <QuoteForm source={source} redirectSrc={redirectSrc} serviceInitial={serviceInitial} variante="sombre" />
        <p className="bloc-formulaire__pied bloc-formulaire__pied--sombre" data-gabarit>
          Vous préférez parler à quelqu&apos;un ? <a href={company.phoneHref}>{company.phoneDisplay}</a>
        </p>
      </div>
    </section>
  );
}

// ── 8 · Les villes, en une rangée ────────────────────────────────────────
// Remplace la liste « Zones desservies » qui prenait un écran entier sur
// téléphone. Mêmes liens (maillage ville × service), une ligne qui défile
// de côté sur téléphone.
// `court` : la pastille ne porte que le nom de la ville, le service est dans
// le titre. Sur les 18 pages ville × service, « Lumières de Noël
// résidentielles à … » répété cinq fois faisait à lui seul une bonne part
// du texte commun d'une page à l'autre.
export function PucesVilles({ service = null, exclure = null, titre = "Aussi dans votre secteur", court = false, fond = MARINE }) {
  const villes = cities.filter((c) => c.slug !== exclure);
  return (
    <section className="section-puces" style={{ background: fond }}>
      <div className="container">
        <p className="puces-titre">{titre}</p>
        <ul className="puces-villes">
          {villes.map((c) => (
            <li key={c.slug}>
              <Link href={service ? `/secteur/${c.slug}/${service.slug}` : `/secteur/${c.slug}`}>
                {service && !court ? `${service.seoTitle || service.title} ${inCity(c.name)}` : c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── 9 · À propos de la ville ─────────────────────────────────────────────
// Les lignes locales (data.js) et le visuel de la zone : sa vraie photo, ou
// une photo d'une ville DE la zone, ou une générique sans légende.
export function AProposVille({ ville, fond = MARINE }) {
  const ph = ville.image ? { src: ville.image, alt: ville.imageAlt } : null;
  return (
    <section style={{ background: fond }}>
      <div className={`container apropos${ph ? "" : " apropos--sans-photo"}`}>
        <div>
          <SectionTag dark>{ville.regionLabel}</SectionTag>
          <SectionTitle light style={{ margin: "0 0 20px" }}>À propos de {ville.name}</SectionTitle>
          {ville.local.map((l, i) => <p key={i} className="offre-texte">{l}</p>)}
          <p className="offre-texte">{ville.body}</p>
        </div>
        {ph && (
          <figure className="apropos-photo">
            <Image src={ph.src} alt={ph.alt} fill sizes="(max-width: 900px) 100vw, 520px"
              placeholder={flouDe(ph.src) ? "blur" : "empty"} blurDataURL={flouDe(ph.src)}
              style={{ objectFit: "cover" }} />
            {/* La légende ne nomme que le lieu VRAI de la photo — « Mercier —
                Rive-Sud » ; rien du tout sous une générique (Laval). */}
            {ville.legende && <figcaption>{ville.legende}</figcaption>}
          </figure>
        )}
      </div>
    </section>
  );
}

// ── 10 · Les trois services d'une ville, en cartes compactes ─────────────
// Remplace « Nos services à {ville} » en grande liste empilée. Les photos
// sont les GÉNÉRIQUES des services : la photo de la ville est déjà dans
// « À propos », et celle d'une autre ville n'a rien à faire ici.
const PHOTO_CARTE = {
  residentiel: "residentiel-01",
  commercial: "commercial-01",
  permanent: "permanent-hero",
};
export function CartesServices({ ville, fond = MARINE_PROFOND }) {
  return (
    <section style={{ background: fond }}>
      <div className="container">
        <div className="section-entete">
          <SectionTag dark>Nos services {inCity(ville.name)}</SectionTag>
          <SectionTitle light style={{ margin: 0 }}>Pour chaque type de propriété</SectionTitle>
        </div>
        <ul className="cartes-services">
          {services.map((s) => {
            const cle = cleService(s.slug);
            const ph = PHOTOS[PHOTO_CARTE[cle]];
            return (
              <li key={s.slug}>
                <Link href={`/secteur/${ville.slug}/${s.slug}`} className="carte-service">
                  <span className="carte-service__photo">
                    <Image src={ph.src} alt="" fill sizes="(max-width: 640px) 100vw, 380px"
                      placeholder={flouDe(ph.src) ? "blur" : "empty"} blurDataURL={flouDe(ph.src)}
                      style={{ objectFit: "cover" }} />
                  </span>
                  <span className="carte-service__corps">
                    <span className="carte-service__titre">{s.seoTitle || s.title}</span>
                    <span className="carte-service__note">{ville.parService[cle]}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ── 11 · Une maison, toutes les ambiances (éclairage permanent) ──────────
// La carte animée de /realisations, en tête de la page du permanent : la
// même façade passe d'une couleur à l'autre. Les trois images sont
// prioritaires ici — c'est le premier écran sous le hero.
export function SectionAmbiances({ fond = MARINE }) {
  return (
    <section className="section-bande" style={{ background: fond }}>
      <div className="container">
        <div className="carte-ambiances">
          <AmbiancesPermanent photos={AMBIANCES_PERMANENT} prioritaire
            sizes="(max-width: 1180px) 100vw, 1132px" />
        </div>
        <p className="section-phrase" style={{ textAlign: "center" }}>
          Une maison, toutes les ambiances : la même façade, trois réglages de l&apos;application.
        </p>
      </div>
    </section>
  );
}
