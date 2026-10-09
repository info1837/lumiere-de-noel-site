// Le hero — le positionnement en trois lignes.
//
//   node scripts/check-hero.mjs
//
// « Sans monter dans l'échelle » vendait le confort : l'argument d'un
// service qu'on achète pour s'éviter une corvée. Le positionnement change —
// ce n'est plus une corvée déléguée, c'est un résultat confié à des
// professionnels.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
// Les commentaires CITENT l'ancienne formulation pour expliquer pourquoi
// elle a changé. Les comparer comme du code ferait échouer le test sur sa
// propre documentation.
const sansCommentaires = (x) => x
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const hero = lire('components/Hero.jsx');
const heroCode = sansCommentaires(hero);
const page = lire('app/page.jsx');

console.log('\n--- 1. 🚨 Le titre ---');
{
  t('🚨 « Votre maison, illuminée par des professionnels. »',
    /Votre maison,<br \/>illuminée par des professionnels\./.test(heroCode));
  t('🚨 plus de « sans monter dans l\'échelle »', !/monter dans l'échelle/.test(heroCode));
  t('c\'est bien le h1', /<h1 className="hero-h1"[\s\S]{0,120}Votre maison/.test(heroCode));
  t('un seul h1 dans le hero', (heroCode.match(/<h1/g) || []).length === 1);
}

console.log('\n--- 2. Le sous-titre ---');
{
  t('🚨 « Conception, installation, entretien et retrait. »',
    /Conception, installation, entretien et retrait\./.test(heroCode));
  t('🚨 « Un nombre limité de propriétés chaque saison. »',
    /Un nombre limité de\s+propriétés chaque saison\./.test(heroCode));
  t('plus de « On s\'occupe de tout »', !/On s'occupe de tout/.test(heroCode));
}

console.log('\n--- 3. 🚨 DEUX portes, et pas une troisième ---');
{
  // ⚠️ CE TEST A ÉTÉ RETOURNÉ, ET IL FAUT SAVOIR POURQUOI.
  //
  // Il exigeait avant UNE SEULE porte au premier écran (« Respiration
  // 1/4 »), parce que cinq boutons en haut de page ne donnaient aucun
  // choix. L'argument était juste contre CINQ. Il ne l'est plus contre
  // DEUX, parce que les deux ne demandent pas la même chose :
  //
  //   « Réserver ma date »          → pour qui est déjà décidé
  //   « Voir ma maison illuminée »  → pour tous les autres
  //
  // C'est la décision de la refonte : le simulateur est la signature du
  // site, et une signature cachée dans la nav n'en est pas une. Le
  // troisième bouton, lui, reste interdit.
  t('🚨 « Réserver ma date » en primaire crème',
    /variant="creme">Réserver ma date</.test(heroCode));
  t('🚨 « Voir ma maison illuminée » en secondaire, vers /simulateur',
    /href="\/simulateur" variant="outlineCreme">Voir ma maison illuminée</.test(heroCode));
  t('🚨 EXACTEMENT deux boutons — jamais trois',
    (heroCode.match(/<CTAButton/g) || []).length === 2,
    `${(heroCode.match(/<CTAButton/g) || []).length}`);
  t('🚨 plus de gros bouton d\'appel', !/variant="outlineLight">Appeler/.test(heroCode));
  // Le numéro n'a pas disparu du site : il est dans la section de
  // réservation (bas de l'accueil), dans le pied de page et sur
  // /soumission. Le sortir du hero était le point de la refonte — un
  // numéro au premier écran est une porte de plus.
  t('🚨 le téléphone n\'est PLUS dans le hero', !/hero-tel/.test(heroCode));
}

console.log('\n--- 4. 🚨 Aucun chiffre de rareté dans le hero ---');
{
  // La ligne de saison vit en haut de page (components/BandeauRarete.jsx),
  // composée par lib/season.js. Le hero n'en parle plus du tout : il n'a
  // même plus la donnée.
  t('🚨 le hero ne reçoit plus la rareté', !/rarete/.test(heroCode));
  t('🚨 aucun nombre de places écrit en dur',
    !/\d+ (dates?|places?) restantes?/.test(heroCode));
  t('🚨 plus de « les dates de novembre partent en premier »',
    !/dates de novembre partent en premier/.test(heroCode));
  // La date de fermeture est descendue dans la section de réservation,
  // à l'endroit où quelqu'un hésite devant le formulaire.
  t('🚨 la fermeture est dans la page, pas dans le hero',
    /Réservations fermées le \{fermeture\}/.test(sansCommentaires(page))
    && !/hero-fermeture/.test(heroCode));
}

console.log('\n--- 5. La page lit le CRM côté serveur ---');
{
  t('🚨 la page est asynchrone', /export default async function/.test(page));
  t('🚨 elle lit les disponibilités', /await lireDisponibilites\(\)/.test(page));
  t('🚨 le hero est monté sans props — il n\'affiche plus de chiffre',
    /<Hero \/>/.test(page));
  // ⚠️ L'ANCIEN TEST EXIGEAIT « use client ». Il le justifiait par le
  // formulaire : « le hero reste use client (il porte un formulaire) ».
  // Le formulaire est descendu en section 8, donc la raison est tombée
  // avec lui — et le premier écran redevient du HTML, ce qui est tout
  // bénéfice pour le LCP.
  t('🚨 le hero n\'est PLUS « use client » — plus d\'état à y tenir',
    !/^"use client";/.test(hero));
  t('🚨 le hero ne fetch RIEN lui-même', !/fetch\(/.test(heroCode));
}

console.log('\n--- 6. 🚨 La preuve sociale reste VRAIE ---');
{
  // Les 100+ avis sont ceux de PALENCIA SERVICES EXTÉRIEUR. Solution
  // Lumière de Noël n'a pas encore d'avis publiés (components/reviews.js,
  // REVIEWS_PENDING = true). Les écrire sans dire à qui ils appartiennent
  // les attribuerait à Lumière — c'est faux, et la barre des objections
  // qui portait la mention a été retirée du bas du hero.
  t('🚨 l\'attribution à Palencia est écrite', /chez Palencia/.test(heroCode));
  t('🚨 …et vérifiable : la fiche Google est en lien',
    /AVIS_PALENCIA_URL/.test(heroCode) && /place_id:/.test(hero));
  const avis = lire('components/reviews.js');
  t('🚨 aucun avis inventé dans reviews.js',
    /REVIEWS_PENDING = true/.test(avis) && /aggregateRating = null/.test(avis));
}

console.log('\n--- 6b. Ce à quoi on ne touche pas ---');
{
  // ⚠️ LE FORMULAIRE N'EST PAS SUPPRIMÉ, IL EST DÉPLACÉ. Un seul sur la
  // page, en bas, après la preuve. Zéro formulaire serait une régression,
  // deux seraient l'ancien défaut.
  t('🚨 UN formulaire sur l\'accueil, et un seul',
    (page.match(/<QuoteForm/g) || []).length === 1,
    `${(page.match(/<QuoteForm/g) || []).length}`);
  t('🚨 il est APRÈS les réalisations et le simulateur',
    page.indexOf('<QuoteForm') > page.indexOf('RevelationLumiere'));
  t('🚨 le pixel est intact', /eventID/.test(lire('lib/meta-lead-event.js')));
  t('l\'envoi vers /api/lead est intact', /fetch\("\/api\/lead"/.test(lire('components/data.js')));
}

console.log('\n--- 7. Un commentaire cassé par la passe de vocabulaire ---');
{
  // La substitution mécanique de la PR précédente avait transformé
  // « la soumission gratuite » en « la un nombre limité de propriétés »
  // À L'INTÉRIEUR d'un commentaire. Personne ne le voit à l'écran, mais
  // c'est la prochaine personne qui lit le fichier qui trébuche.
  t('🚨 plus de « la un nombre limité »', !/la un nombre limité/.test(hero));
  // ⚠️ TOUT le dépôt, pas quatre fichiers choisis à la main. La première
  // version de cette liste ne contenait pas le fichier où se cachait le
  // pire cas : une réponse de FAQ, visible par les clients, qui disait
  // « On évalue la faisabilité lors de la un nombre limité de propriétés
  // chaque saison. »
  const marcher = (d, acc = []) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (['node_modules', '.next', '.git', 'scripts'].includes(e.name)) continue;
      const q = path.join(d, e.name);
      if (e.isDirectory()) marcher(q, acc);
      else if (/\.(jsx?|mjs)$/.test(e.name)) acc.push(q);
    }
    return acc;
  };
  const tous = [...marcher(path.join(ROOT, 'app')), ...marcher(path.join(ROOT, 'components')), ...marcher(path.join(ROOT, 'lib'))];
  const casses = tous.filter((f) => /\b(la|le|les|de|du|des|une?) un nombre limité/.test(fs.readFileSync(f, 'utf8')));
  t('🚨 aucune phrase cassée dans TOUT le dépôt', casses.length === 0,
    casses.map((f) => path.relative(ROOT, f)).join(' '));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
