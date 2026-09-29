import Link from "next/link";
import { SectionTag, SectionTitle } from "@/components/ui";
import { navy, offWhite, gold, charcoal, ivory } from "@/components/data";

// « Nos clients reviennent chaque année. »
//
// C'est la preuve la plus forte qu'on ait, et elle n'était nulle part sur
// le site. Un service haut de gamme ne se démontre pas en disant qu'il est
// haut de gamme : il se démontre par des gens qui rachètent.
//
// ⚠️ AUCUN CHIFFRE ICI, et c'est volontaire.
//
// « 90 % de nos clients renouvellent » demanderait un calcul sur un
// historique d'une seule saison — le dénominateur serait de 21 clients, et
// le chiffre bougerait de cinq points à chaque renouvellement. Une
// statistique fragile sur une page de crédibilité coûte plus qu'elle ne
// rapporte. Ce qui est dit ici est vrai sans dépendre d'un compte : on
// entrepose, on réinstalle, le client garde ses lumières.
//
// Le jour où l'historique le permettra, le chiffre viendra du CRM comme
// celui du bandeau — mesuré, pas écrit.
export default function ClientsFideles() {
  return (
    <section style={{ background: offWhite }}>
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: 38 }}>
          <SectionTag>Renouvellement</SectionTag>
          <SectionTitle style={{ margin: "0 auto" }}>Nos clients reviennent chaque année</SectionTitle>
          <p style={{
            color: "#5a5a58", fontSize: 17, lineHeight: 1.6,
            maxWidth: "60ch", margin: "14px auto 0",
          }}>
            Une fois vos lumières conçues pour votre maison, elles sont à vous.
            On les retire en janvier, on les garde chez nous, et on revient les
            poser la saison suivante — au même endroit, au millimètre.
          </p>
        </div>

        <div className="grid-3" style={{ gap: 18 }}>
          {[
            {
              titre: "Entreposées chez nous",
              texte: "Rien dans votre garage, rien à démêler en novembre. On sort vos boîtes, étiquetées à votre nom.",
            },
            {
              titre: "Le même design, chaque année",
              texte: "Les longueurs, les points d'ancrage et la prise utilisée sont notés. La deuxième saison se pose plus vite que la première.",
            },
            {
              titre: "Priorité sur les dates",
              texte: "Les clients de l'an dernier choisissent leur date avant l'ouverture au public. Les meilleures semaines partent là.",
            },
          ].map((c) => (
            <div key={c.titre} style={{
              background: "#fff", borderRadius: 14, padding: "24px 22px",
              border: "1px solid rgba(11,27,43,0.09)",
            }}>
              <h3 style={{ color: charcoal, fontSize: 21, marginBottom: 10 }}>{c.titre}</h3>
              <p style={{ color: "#5a5a58", fontSize: 15.5, lineHeight: 1.6, margin: 0 }}>{c.texte}</p>
            </div>
          ))}
        </div>

        {/* Le lien vers /renouvellement existait déjà et ne servait qu'aux
            clients qui le connaissaient. Il a maintenant une porte. */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link href="/renouvellement" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: navy, color: ivory, textDecoration: "none",
            padding: "14px 26px", borderRadius: 300,
            fontWeight: 700, fontSize: 15,
          }}>
            Vous étiez client l’an dernier ? Réservez votre date
            <span aria-hidden="true" style={{ color: gold }}>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
