import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, SectionTag, SectionTitle, CTAButton, Breadcrumb } from "@/components/ui";
import { ServiceJsonLd, BreadcrumbJsonLd } from "@/components/jsonld";
import QuoteForm from "@/components/QuoteForm";
import {
  services, cities, findService, serviceArea, inCity, serviceOptions,
  navy, offWhite, ivory, gold, charcoal, goldText, creme,
} from "@/components/data";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }) {
  const s = findService(params.slug);
  if (!s) return {};
  return {
    title: s.seoTitle || s.h1 || s.title,
    description: s.metaDescription,
    alternates: { canonical: `/services/${s.slug}` },
    openGraph: {
      title: `${s.seoTitle || s.h1 || s.title} | Solution Lumière de Noël`,
      description: s.metaDescription,
      url: `/services/${s.slug}`,
      images: s.heroImage ? [s.heroImage] : undefined,
    },
  };
}

export default function ServicePage({ params }) {
  const s = findService(params.slug);
  if (!s) return notFound();

  const otherServices = services.filter((x) => x.slug !== s.slug);

  // Le formulaire du bas arrive avec LE service de cette page déjà choisi :
  // quelqu'un qui lit la page du commercial vient de le dire en y arrivant.
  // La valeur sort de `serviceOptions`, jamais d'une chaîne écrite ici — si
  // une option est renommée, elle bouge d'un seul endroit.
  const motCle = s.slug.includes("commercial") ? /commercial/i
    : s.slug.includes("permanent") ? /permanent|architectural/i
    : /résidentiel|residentiel/i;
  const serviceInitial = serviceOptions.find((o) => motCle.test(o)) || null;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "/" },
          { name: "Services", url: "/services" },
          { name: s.title, url: `/services/${s.slug}` },
        ]}
      />
      <ServiceJsonLd service={s} areaServed={serviceArea} urlPath={`/services/${s.slug}`} />

      <PageHero
        kicker={s.kicker}
        title={s.h1 || s.title}
        subtitle={s.intro}
        image={s.heroImage}
        imageAlt={s.heroImageAlt}
        ctaLabel="Réserver ma date"
      />

      {/* Intro + bullets */}
      <section style={{ background: offWhite }}>
        <div className="container">
          <Breadcrumb
            items={[
              { name: "Accueil", href: "/" },
              { name: s.title },
            ]}
          />
          <div className="grid-2" style={{ alignItems: "start" }}>
            <div>
              <SectionTag>Ce qui est inclus</SectionTag>
              <SectionTitle>Service complet, sans surprise</SectionTitle>
              <p style={{ color: "#444", fontSize: 18, marginBottom: 22 }}>{s.body}</p>
              <ul style={{ listStyle: "none" }}>
                {s.bullets.map((b, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, marginBottom: 12, color: charcoal, fontSize: 16 }}>
                    <span className="bulb bulb--tw" aria-hidden="true" style={{ marginTop: 5 }} />{b}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 26 }}>
                <CTAButton href="/soumission">Réserver ma date</CTAButton>
              </div>
            </div>
            {/* Le volet municipal n'a AUCUNE photo (heroImage: null). Sans ce
                garde, React rend <img> sans src : une image cassée. On ne
                réserve alors même pas le cadre — pas de trou décoratif. */}
            {s.heroImage && (
              <div style={{ borderRadius: 18, overflow: "hidden", aspectRatio: "4 / 3", background: "#11202f" }}>
                <img src={s.heroImage} alt={s.heroImageAlt} loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ⚠️ L'ASSURANCE, SUR LA PAGE COMMERCIALE SEULEMENT.
          Pour un propriétaire, c'est une ligne rassurante parmi d'autres.
          Pour un gestionnaire d'immeuble, c'est un CRITÈRE D'ACHAT : il ne
          peut pas signer sans preuve, et s'il doit la demander par courriel
          il appelle d'abord le concurrent qui l'affiche.

          Pas de cinquième carte dans la grille résidentielle : décision de
          Yahir (2026-09-30). Un bloc dédié, ici, où la question se pose. */}
      {s.slug === "lumieres-de-noel-commercial" && (
        <section style={{ background: offWhite }}>
          <div className="container" style={{ maxWidth: 820 }}>
            <div style={{
              background: "#fff", border: "1px solid rgba(11,27,43,0.12)", borderRadius: 16,
              padding: "30px 30px 26px", textAlign: "left",
            }}>
              <SectionTag>Assurance</SectionTag>
              <h2 style={{ color: charcoal, fontSize: 28, margin: "10px 0 12px" }}>
                Assurance responsabilité en vigueur, preuve fournie sur demande
              </h2>
              <p style={{ color: "#5a5a58", fontSize: 17, lineHeight: 1.65, margin: "0 0 22px" }}>
                Nos équipes travaillent en hauteur sur vos façades, vos marquises et vos
                vitrines. La police est active pour toute la saison, et nous transmettons
                l’attestation directement à votre gestionnaire ou à votre service des achats.
              </p>
              <CTAButton href="/soumission?service=commercial" variant="gold">
                Demander notre preuve d’assurance
              </CTAButton>
            </div>
          </div>
        </section>
      )}

      {/* Villes desservies pour ce service (maillage interne — service × ville) */}
      {/* ⚠️ MÊME MAILLAGE, SANS LES CARTES.
          Les six liens étaient six cartes bordées de 22 px de padding, soit
          presque un écran entier pour une liste de villes. Les liens sont
          identiques — même href, même texte d'ancrage — donc le maillage
          interne et sa valeur SEO ne bougent pas d'un pouce. C'est la boîte
          autour qui disparaît. */}
      <section style={{ background: navy }}>
        <div className="container">
          <div className="section-entete">
            <SectionTag dark>Zones desservies</SectionTag>
            <SectionTitle light style={{ margin: 0 }}>{s.title} — partout dans le Grand Montréal</SectionTitle>
          </div>
          <ul className="liste-liens">
            {cities.map((c) => (
              <li key={c.slug}>
                <Link href={`/secteur/${c.slug}/${s.slug}`}>
                  <span className="liste-liens__region">{c.regionLabel}</span>
                  <span className="liste-liens__nom">{s.title} {inCity(c.name)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Autres services — une ligne par service, plus de cartes. */}
      <section style={{ background: "#060E18" }}>
        <div className="container">
          <div className="section-entete">
            <SectionTag dark>Nos autres services</SectionTag>
            <SectionTitle light style={{ margin: 0 }}>Un seul fournisseur pour tout</SectionTitle>
          </div>
          <ul className="liste-liens liste-liens--large">
            {otherServices.map((o) => (
              <li key={o.slug}>
                <Link href={`/services/${o.slug}`}>
                  <span className="liste-liens__region">{o.kicker}</span>
                  <span className="liste-liens__nom">{o.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ⚠️ UN FORMULAIRE, EN BAS, PLUTÔT QU'UN TROISIÈME BOUTON.
          La page finissait sur « Réserver ma date » — le même mot, vers le
          même endroit, pour la troisième fois. Quelqu'un qui a lu la page
          entière est décidé : lui demander un clic de plus pour ARRIVER sur
          un formulaire est un clic qu'on peut perdre. C'est le MÊME
          QuoteForm que /soumission, avec sa source à lui pour que Yahir
          sache de quelle page vient la fiche. */}
      <section id="soumission" style={{ background: creme }}>
        <div className="container bloc-formulaire">
          <div className="section-entete">
            <SectionTag>Réservation</SectionTag>
            <SectionTitle style={{ margin: "0 auto 14px" }}>Réservez votre date</SectionTitle>
            <p className="section-phrase section-phrase--clair">
              Nous confirmons votre place et votre prix après une courte consultation.
            </p>
          </div>
          <QuoteForm source={`Page service — ${s.title}`} redirectSrc="service" serviceInitial={serviceInitial} />
        </div>
      </section>
    </>
  );
}
