import { navy, ivory, gold, charcoal, offWhite, textMuted, company } from "@/components/data";

// Politique de confidentialité — page légale exigée par la case de
// consentement du formulaire (Loi 25 / LCAP). Elle existait déjà chez
// Palencia; celle-ci reprend la même structure en 9 sections, avec
// l'entité et les coordonnées de Solution Lumière de Noël inc.
//
// Server-rendered, indexable : quelqu'un qui cherche « lumière de noël
// politique de confidentialité » doit tomber dessus.
export const metadata = {
  title: "Politique de confidentialité | Solution Lumière de Noël",
  description:
    "Comment Solution Lumière de Noël inc. recueille, utilise et protège vos renseignements personnels — conforme à la Loi 25 (Québec).",
  alternates: { canonical: "/confidentialite" },
  openGraph: {
    type: "article",
    title: "Politique de confidentialité | Solution Lumière de Noël",
    description:
      "Comment Solution Lumière de Noël inc. recueille, utilise et protège vos renseignements personnels — conforme à la Loi 25 (Québec).",
    url: "/confidentialite",
  },
};

const SECTIONS = [
  {
    t: "1. Qui nous sommes",
    p: [
      "Solution Lumière de Noël inc. est une entreprise de Blainville, au Québec, qui conçoit, installe, entretient et retire des installations de lumières de Noël et d'éclairage architectural permanent, chez les particuliers, les commerces et les municipalités.",
      "La présente politique explique quels renseignements personnels nous recueillons, pourquoi, et ce que vous pouvez exiger de nous. Elle est rédigée pour être lue, pas pour être contournée.",
    ],
  },
  {
    t: "2. Renseignements que nous recueillons",
    p: [
      "Ce que vous nous donnez vous-même : votre nom, votre numéro de téléphone, votre adresse courriel si vous la fournissez, l'adresse de la propriété à illuminer, et les détails de votre projet (mesures, photos que vous nous envoyez, préférences de design).",
      "Ce que la calculatrice produit : la longueur de toiture que vous tracez sur l'image satellite ou que vous saisissez à la main, et le prix qui vous a été affiché.",
      "Ce qui est recueilli automatiquement : des données de navigation anonymisées (pages vues, appareil, provenance) servant uniquement à comprendre ce qui fonctionne sur le site.",
    ],
  },
  {
    t: "3. Comment nous utilisons vos renseignements",
    p: [
      "Pour vous répondre, préparer votre soumission, vous envoyer une maquette de votre installation, planifier les travaux et assurer le suivi de saison en saison.",
      "Pour vous joindre par téléphone, par message texte ou par courriel au sujet de votre demande — uniquement si vous y avez consenti, et vous pouvez retirer ce consentement en tout temps.",
      "Nous ne vendons jamais vos renseignements. Nous ne les échangeons pas. Nous ne les utilisons pas pour de la publicité ciblée par des tiers.",
    ],
  },
  {
    t: "4. Partage de vos renseignements",
    p: [
      "Vos renseignements sont accessibles à l'équipe de Solution Lumière de Noël inc. et à Palencia Services Extérieur (Gestion Palencia Inc.), qui opère le même outil de gestion des clients pour les deux entreprises.",
      "Ils transitent aussi par nos fournisseurs techniques — hébergement du site, envoi de messages texte et de courriels — qui n'ont le droit de les traiter que pour nous rendre ce service.",
      "Nous ne communiquons vos renseignements à une autorité que si la loi l'exige.",
    ],
  },
  {
    t: "5. Conservation",
    p: [
      "Nous conservons vos renseignements aussi longtemps que dure la relation d'affaires, puis pendant la période nécessaire à nos obligations légales et comptables. Après quoi ils sont supprimés ou anonymisés.",
    ],
  },
  {
    t: "6. Protection",
    p: [
      "L'accès à vos renseignements est limité aux personnes qui en ont besoin pour faire leur travail. Les échanges avec ce site sont chiffrés (HTTPS), et l'accès à nos outils de gestion est protégé par mot de passe individuel.",
    ],
  },
  {
    t: "7. Vos droits",
    p: [
      "Vous pouvez demander à consulter les renseignements que nous détenons sur vous, les faire corriger, en demander la suppression, ou retirer votre consentement à être contacté. Un retrait de consentement met fin aux messages, pas à un contrat en cours.",
      "Écrivez-nous et nous répondons dans les 30 jours prévus par la loi.",
    ],
  },
  {
    t: "8. Témoins (cookies)",
    p: [
      "Le site utilise des témoins de mesure d'audience pour savoir quelles pages sont utiles. Vous pouvez les bloquer dans votre navigateur : le site continue de fonctionner.",
    ],
  },
  {
    t: "9. Nous joindre",
    p: [
      "Pour toute question sur cette politique ou pour exercer vos droits, écrivez à la personne responsable de la protection des renseignements personnels de Solution Lumière de Noël inc.",
    ],
  },
];

export default function Confidentialite() {
  return (
    <main>
      <section style={{ background: navy, color: ivory, padding: "clamp(110px,14vw,150px) 24px 60px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: gold, marginBottom: 12 }}>
            Vos renseignements
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.4rem,5vw,3.6rem)", lineHeight: 1.05, margin: 0 }}>
            Politique de confidentialité
          </h1>
          <p style={{ marginTop: 14, opacity: 0.85, fontSize: 17 }}>
            Solution Lumière de Noël inc. — conforme à la Loi 25 (Québec).
          </p>
        </div>
      </section>

      <section style={{ background: offWhite, padding: "clamp(48px,7vw,72px) 24px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {SECTIONS.map((s) => (
            <div key={s.t} style={{ marginBottom: 34 }}>
              <h2 style={{ fontSize: "clamp(1.25rem,2.4vw,1.6rem)", color: charcoal, marginBottom: 12 }}>{s.t}</h2>
              {s.p.map((par, i) => (
                <p key={i} style={{ color: textMuted, fontSize: 16, lineHeight: 1.8, marginBottom: 12 }}>{par}</p>
              ))}
            </div>
          ))}

          <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e6e0d0" }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: charcoal }}>Solution Lumière de Noël inc.</div>
            <div style={{ color: textMuted, fontSize: 16, lineHeight: 1.9 }}>
              Blainville, Québec<br />
              <a href={company.phoneHref} style={{ color: charcoal, fontWeight: 600 }}>{company.phoneDisplay}</a><br />
              <a href={company.emailHref} style={{ color: charcoal, fontWeight: 600 }}>{company.email}</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
