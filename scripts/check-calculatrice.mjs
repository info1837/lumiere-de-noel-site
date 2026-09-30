// La calculatrice suit la règle de Sophie : elle ancre, elle ne chiffre pas.
//
//   node scripts/check-calculatrice.mjs
//
// Elle affichait « Votre prix : 2 400 $ tout inclus » — un montant calculé
// à partir de pieds tracés sur une image satellite, avant que personne
// n'ait vu la maison. C'est un chiffre qu'il faut renier sur place une fois
// sur deux, et le client s'en souvient mieux que du reste de la page.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const sansCommentaires = (x) => x
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const page = sansCommentaires(lire('app/calculatrice/page.jsx'));
const calc = sansCommentaires(lire('components/CalculatriceToiture.jsx'));
const route = sansCommentaires(lire('app/api/calc-noel/route.js'));

console.log('\n--- 1. 🚨 Le titre et la promesse ---');
{
  t('🚨 « Estimez votre projet »', /<h1[^>]*>Estimez votre projet<\/h1>/.test(page));
  t('🚨 plus de « Votre prix, à l\'écran »', !/Votre prix, à l'écran/.test(page));
  t('🚨 plus de « Vous voyez le prix tout de suite »', !/voyez le prix tout de suite/i.test(page));
  t('elle promet la fourchette de départ', /fourchette de\s+départ/.test(page));
  t('🚨 les méta ne promettent plus un prix',
    !/voyez votre prix|Votre prix à l'écran/i.test(page));
}

console.log('\n--- 2. 🚨 AUCUN prix ne traverse le réseau ---');
{
  // La défense qui compte : le montant n'est plus dans la réponse. Il ne
  // peut donc plus être affiché, ni lu dans l'onglet réseau, ni ressortir
  // par une future modification de l'écran.
  // ⚠️ PAS lastIndexOf : la dernière `return json({` du fichier est celle
  // du 405 (« method_not_allowed »). On vise la réponse qui porte `ok: true`.
  const iRep = route.indexOf('return json({', route.indexOf('ancrage,') - 400);
  const reponse = route.slice(iRep, iRep + 700);
  t('🚨 la réponse ne contient plus `total`', !/\btotal:/.test(reponse), 'réponse finale');
  t('🚨 ni `quotable`', !/\bquotable:/.test(reponse));
  t('🚨 elle rend un ANCRAGE', /\bancrage,/.test(reponse));
  t('l\'écran ne lit plus de total', !/resultat\.total/.test(calc));
  t('ni `quotable`', !/resultat\.quotable/.test(calc));
  t('🚨 aucun tarif au pied linéaire dans le code du navigateur',
    !/12 ?\$|12\.00|par pied|au pied linéaire/i.test(calc));
}

console.log('\n--- 3. 🚨 L\'ancrage : deux chiffres, pas un de plus ---');
{
  t('🚨 1 étage → 1 000 $', /etages === '1' \? 1000/.test(route));
  t('🚨 2 étages → 1 500 $', /etages === '2' \? 1500/.test(route));
  // ⚠️ PAS `const ancrage` : il attrape `const ancrageM` déclaré plus haut
  // pour la maquette. On vise la ligne complète.
  t('🚨 3 étages et + → AUCUN chiffre',
    /const ancrage = etages === '1' \? 1000 : etages === '2' \? 1500 : null;/.test(route));
  t('🚨 l\'écran affiche « Projets à partir de … »', /Projets à partir de \$\{/.test(calc) || /Projets à partir de \${Number\(resultat\.ancrage\)/.test(calc));
  t('🚨 sans ancrage, aucun montant n\'est inventé',
    /Votre projet mérite une visite/.test(calc));
  t('🚨 la phrase de Yahir est là',
    /Yahir confirme votre prix exact après une courte consultation/.test(calc));
}

console.log('\n--- 4. 🚨 Téléphone + consentement avant l\'ancrage ---');
{
  t('🚨 le consentement est demandé', /<CaseConsentement id="calc-consent"/.test(calc));
  t('🚨 le bouton reste bloqué sans consentement', /!consent\b/.test(calc));
  t('🚨 …et sans téléphone', /!contact\.telephone/.test(calc));
  t('🚨 …et sans les étages', /!etages\b/.test(calc));
  t('plus de « Afficher mon prix »', !/Afficher mon prix/.test(calc));
  t('plus de « Voir mon prix »', !/Voir mon prix/.test(calc));
  t('🚨 plus de « votre prix s\'affiche à l\'écran »', !/prix s'affiche à l'écran/i.test(calc));
}

console.log('\n--- 5. 🚨 Les pieds linéaires vont au CRM, jamais à l\'écran ---');
{
  t('🚨 linear_ft part sur la fiche', /linear_ft: linearFt/.test(route));
  t('🚨 les étages aussi — Sophie ne les redemande pas', /\.\.\.\(etages \? \{ etages \} : \{\}\)/.test(route));
  t('le prix calculé reste dans les NOTES, pour la soumission',
    /Prix calculé \(NON montré au client\)/.test(route));
  t('la note dit ce que le client a vu', /Ancrage montré au client/.test(route));
  // L'écran de résultat ne montre plus la mesure comme un prix.
  const ecran = calc.slice(calc.indexOf('etape === "prix"'), calc.indexOf('BlocMaquette'));
  t('🚨 l\'écran final n\'affiche AUCUN montant calculé',
    !/resultat\.total|toLocaleString\("fr-CA"\) \} \$ tout inclus/.test(ecran));
  t('🚨 …ni les pieds linéaires comme un résultat',
    !/pi linéaires de toiture/.test(ecran));
}

console.log('\n--- 6. Sophie prend le relais ---');
{
  t('🚨 la source déclenche l\'enrôlement (préfixe « Calculatrice »)',
    /source: 'Calculatrice toiture — site Lumière'/.test(route));
  t('l\'écran annonce le texto', /Vous recevez un texto dans la minute/.test(calc));
  t('🚨 le pixel est relayé tel quel (dédup CAPI)', /meta_pixel/.test(route));
  t('le honeypot est intact', /body\.website/.test(route));
}

console.log('\n--- 7. L\'outil de tracé n\'a pas bougé ---');
{
  t('🚨 le tracé sur image satellite est intact', /lines|piLineaires|measure_method/.test(route));
  t('la saisie manuelle reste possible', /measure_method === 'manual'/.test(route));
  t('les extras basculent toujours en évaluation sur place',
    /colonnes', 'arbres', 'arbustes'/.test(route));
  t('la maquette par texto existe toujours', /intent: "maquette"/.test(calc));
  t('🚨 elle n\'envoie plus un prix mort', !/estimatedPrice: resultat\.quotable/.test(calc));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
