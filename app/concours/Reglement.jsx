import Link from "next/link";
import { company } from "@/components/data";
import {
  FIN_TEXTE, TIRAGE_TEXTE, RABAIS_AVANT, INSTALLATION_AVANT, VALEUR_PRIX, VILLES_CONCOURS,
} from "@/lib/concours";

// Le règlement officiel, en bas de /concours (ancre #reglements, liée du
// pied de page et de la case « J'ai lu les règlements »).
//
// ⚠️ Les dates viennent de lib/concours.js — alignées sur le CRM.
// ⚠️ Section RACJ retirée à la demande de l'organisateur (comme sur main, #66) :
//    ne pas la remettre sans lui. Jamais de prix au pied linéaire ici.
const lien = { color: "#F0BA54", fontWeight: 600 };
const villes = `${VILLES_CONCOURS.slice(0, -1).join(", ")} et ${VILLES_CONCOURS.at(-1)}`;

const SECTIONS = [
  { t: "1. Organisateur", p: [
    <>Le concours « Gagnez votre installation 2026 » (le « concours ») est organisé par {company.name} (l'« organisateur »), entreprise établie à Blainville, au Québec. Téléphone : <a href={company.phoneHref} style={lien}>{company.phoneDisplay}</a> — courriel : <a href={company.emailHref} style={lien}>{company.email}</a>.</>,
  ] },
  { t: "2. Durée du concours", p: [
    `Les inscriptions sont acceptées jusqu'au ${FIN_TEXTE}. Toute participation reçue après cette heure n'est pas admissible.`,
    `Le tirage aura lieu le ${TIRAGE_TEXTE}, en direct sur Instagram (${company.social.instagram.handle}).`,
  ] },
  { t: "3. Admissibilité", p: [
    `Le concours s'adresse aux résidents de ${villes}, âgés de 18 ans et plus, propriétaires de la résidence inscrite ou ayant la permission du propriétaire.`,
    "Sont exclus les employés, représentants et mandataires de l'organisateur, ainsi que les personnes avec qui ils sont domiciliés.",
  ] },
  { t: "4. Comment participer", p: [
    "Remplissez le formulaire d'inscription de la page lumieredenoelinc.com/concours en fournissant des renseignements exacts et complets.",
    "Aucun achat requis. Réserver une installation, ou non, n'a aucun effet sur les chances de gagner.",
    "Une seule participation par foyer (adresse) et par numéro de téléphone. Les participations en double ne sont pas comptées.",
  ] },
  { t: "5. Prix", p: [
    `Un (1) prix est offert : une installation de lumières de Noël sur la ligne de toit, d'une valeur pouvant atteindre ${VALEUR_PRIX} (jusqu'à 100 pieds), installée avant le ${INSTALLATION_AVANT}.`,
    "Le service comprend l'installation, l'entretien tout l'hiver, le retrait et l'entreposage. Toute portion de la valeur non utilisée n'est pas remboursable.",
    "Le prix n'est pas échangeable en argent, n'est pas transférable et doit être accepté tel quel.",
  ] },
  { t: "6. Tirage et chances de gagner", p: [
    `Le ${TIRAGE_TEXTE}, un tirage au hasard sera effectué parmi toutes les participations admissibles reçues pendant la durée du concours.`,
    "Les chances de gagner dépendent du nombre de participations admissibles reçues.",
  ] },
  { t: "7. Réclamation du prix", p: [
    "La personne sélectionnée sera contactée par téléphone au numéro fourni lors de l'inscription. Pour être déclarée gagnante, elle doit :",
    "a) répondre correctement, sans aide, à une question d'habileté mathématique; b) signer le formulaire de déclaration et d'exonération de responsabilité transmis par l'organisateur; c) réclamer son prix dans les 7 jours suivant le premier contact.",
    "À défaut de respecter l'une de ces conditions, ou si la personne ne peut être jointe dans ce délai, elle perd son droit au prix et un nouveau tirage est effectué parmi les participations admissibles restantes.",
  ] },
  { t: "8. Rabais offert à tous les participants", p: [
    `Tous les participants reçoivent un rabais de 15 % sur une installation de lumières de Noël, valide sur une réservation faite avant le ${RABAIS_AVANT}. Ce rabais n'est pas monnayable.`,
  ] },
  { t: "9. Réserver maintenant", p: [
    `Si la personne gagnante a déjà réservé une installation avant le tirage, la valeur du prix (jusqu'à ${VALEUR_PRIX}) lui est remboursée. Réserver tôt ne fait rien perdre.`,
  ] },
  { t: "10. Renseignements personnels", p: [
    "Les renseignements recueillis servent à administrer le concours : vérifier l'admissibilité, effectuer le tirage, joindre la personne gagnante et appliquer le rabais aux participants.",
    "L'organisateur ne vous enverra des offres par message texte ou par courriel que si vous avez coché la case de consentement du formulaire. Vous pouvez vous désabonner en tout temps en répondant STOP à un message texte ou en cliquant sur le lien de désabonnement d'un courriel.",
    <>Pour en savoir plus, consultez notre <Link href="/confidentialite" style={lien}>politique de confidentialité</Link>.</>,
  ] },
  { t: "11. Facebook et Instagram", p: [
    "Ce concours n'est aucunement commandité, appuyé, administré ou associé à Meta, Facebook ou Instagram.",
  ] },
];

export default function Reglement() {
  return (
    <section id="reglements" className="concours-reglement" aria-labelledby="reglement-titre">
      <div className="concours-largeur">
        <h2 id="reglement-titre" className="concours-h2">Règlements officiels</h2>
        {SECTIONS.map((s) => (
          <div key={s.t} className="concours-reglement__bloc">
            <h3>{s.t}</h3>
            {s.p.map((par, i) => <p key={i}>{par}</p>)}
          </div>
        ))}
      </div>
    </section>
  );
}
