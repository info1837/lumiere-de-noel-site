// La crédibilité haut de gamme — la preuve avant l'argument.
//
//   node scripts/check-credibilite.mjs

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const sansCommentaires = (x) => x
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const page = lire('app/page.jsx');
const pageCode = sansCommentaires(page);

console.log('\n--- 1. 🚨 La galerie monte AVANT les arguments ---');
{
  const iGalerie = pageCode.indexOf('<SectionTag dark>Réalisations</SectionTag>');
  const iParcours = pageCode.indexOf('<HowItWorks');
  const iInclus = pageCode.indexOf('id="inclus"');
  const iHero = pageCode.indexOf('<Hero ');
  t('la galerie est là', iGalerie > 0);
  t('🚨 elle passe AVANT le parcours', iGalerie < iParcours, `galerie@${iGalerie} parcours@${iParcours}`);
  t('🚨 et AVANT la section « tout inclus »', iGalerie < iInclus, `inclus@${iInclus}`);
  t('elle reste après le hero', iGalerie > iHero);
  t('une seule galerie sur la page',
    (pageCode.match(/<SectionTag dark>Réalisations<\/SectionTag>/g) || []).length === 1);
}

console.log('\n--- 2. 🚨 Elle est plus GRANDE ---');
{
  t('🚨 elle porte la classe large', /gallery-grid--large/.test(pageCode));
  const css = lire('app/globals.css');
  t('🚨 deux colonnes au lieu de trois',
    /\.gallery-grid--large \.gallery-grid \{[\s\S]{0,120}repeat\(2, 1fr\)/.test(css));
  t('une seule colonne sur téléphone',
    /max-width: 720px[\s\S]{0,160}\.gallery-grid--large \.gallery-grid \{ grid-template-columns: 1fr/.test(css));
  t('la grille générique à 3 colonnes existe toujours pour /realisations',
    /\.gallery-grid \{ display: grid; grid-template-columns: repeat\(3, 1fr\)/.test(css));
}

console.log('\n--- 3. 🚨 « Nos clients reviennent chaque année » ---');
{
  const c = lire('components/ClientsFideles.jsx');
  t('🚨 le titre exact', /Nos clients reviennent chaque année/.test(c));
  t('🚨 elle parle d\'entreposage chez nous', /Entreposées chez nous/.test(c));
  t('🚨 elle parle de renouvellement', /<SectionTag>Renouvellement<\/SectionTag>/.test(c));
  t('elle mène à /renouvellement', /href="\/renouvellement"/.test(c));
  t('🚨 elle est montée dans la page', /<ClientsFideles \/>/.test(pageCode));
  t('après le parcours', pageCode.indexOf('<ClientsFideles />') > pageCode.indexOf('<HowItWorks'));

  // ⚠️ Aucun pourcentage : l'historique est d'une seule saison, le
  // dénominateur serait de 21 clients, et le chiffre bougerait de cinq
  // points à chaque renouvellement. Une statistique fragile sur une page
  // de crédibilité coûte plus qu'elle ne rapporte.
  const chiffres = sansCommentaires(c).match(/\d+\s?%/g) || [];
  t('🚨 aucun pourcentage inventé', chiffres.length === 0, chiffres.join(' '));
  // ⚠️ On cherche une AFFIRMATION, pas un nombre. Ma première version
  // attrapait `fontSize: 17` et `borderRadius: 14` — elle ne savait pas
  // distinguer un nombre de clients d'une taille de police, et échouait
  // sur du style parfaitement innocent.
  const affirmations = sansCommentaires(c)
    .match(/\b\d+\s*(clients?|propriétés?|installations?|maisons?|ans?\b|sur\s+\d+)|plus de \d+/gi) || [];
  t('🚨 aucune affirmation chiffrée sur nos clients', affirmations.length === 0, affirmations.join(' | '));
}

console.log('\n--- 4. Le parcours est renommé ---');
{
  const h = lire('components/HowItWorks.jsx');
  const hCode = sansCommentaires(h);
  t('🚨 « Consultation design → Installation → Entretien → Retrait »',
    /Consultation design → Installation → Entretien → Retrait/.test(hCode));
  t('🚨 plus de « De la soumission à l\'entreposage »', !/De la soumission à l'entreposage/.test(hCode));
  t('l\'étiquette dit « Le parcours »', /<SectionTag dark>Le parcours<\/SectionTag>/.test(hCode));
  t('les cinq étapes existent toujours', /processSteps/.test(h));
  const etapes = lire('components/data.js');
  t('la première étape est la consultation design', /title: "Consultation design"/.test(etapes));
}

console.log('\n--- 5. Ce à quoi on ne touche pas ---');
{
  t('🚨 un seul formulaire sur l\'accueil (celui du hero)',
    (pageCode.match(/<QuoteForm/g) || []).length === 0);
  t('🚨 le pixel est intact', /eventID/.test(lire('lib/meta-lead-event.js')));
  t('l\'envoi vers /api/lead est intact', /fetch\("\/api\/lead"/.test(lire('components/data.js')));
  // Il reçoit maintenant sa donnée du layout — ne pas épingler la balise
  // entière, elle porte une prop de plus.
  t('le bandeau de rareté est toujours monté', /<BandeauRarete/.test(lire('app/layout.jsx')));
  // La rareté vit dans le bandeau du haut, plus dans le hero (bloc 1).
  t('le hero garde la date de fermeture du CRM', /rarete\?\.fermetureLe/.test(lire('components/Hero.jsx')));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
