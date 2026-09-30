// L'assurance sur la page commerciale — un critère d'achat, pas une ligne.
//
//   node scripts/check-assurance-commerciale.mjs
//
// Pour un propriétaire, l'assurance est une ligne rassurante parmi d'autres.
// Pour un gestionnaire d'immeuble, c'est un CRITÈRE D'ACHAT : il ne peut pas
// signer sans preuve, et s'il doit la demander par courriel il appelle
// d'abord le concurrent qui l'affiche.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const sansCommentaires = (x) => x
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const page = lire('app/services/[slug]/page.jsx');
const code = sansCommentaires(page);

console.log('\n--- 1. 🚨 Le bloc existe, et seulement sur la page commerciale ---');
{
  t('🚨 « Assurance responsabilité en vigueur, preuve fournie sur demande »',
    /Assurance responsabilité en vigueur, preuve fournie sur demande/.test(code));
  t('🚨 il est conditionné au slug commercial',
    /s\.slug === "lumieres-de-noel-commercial" && \(/.test(code));
  t('🚨 le résidentiel ne le voit pas',
    (code.match(/Assurance responsabilité en vigueur/g) || []).length === 1);
  t('l\'étiquette dit « Assurance »', /<SectionTag>Assurance<\/SectionTag>/.test(code));
}

console.log('\n--- 2. 🚨 PAS de cinquième carte dans la grille résidentielle ---');
{
  // Décision de Yahir (2026-09-30) : un bloc dédié, pas une carte de plus.
  const data = sansCommentaires(lire('components/data.js'));
  const cartes = (data.match(/^\s{4}title: "/gm) || []);
  const whyUs = data.slice(data.indexOf('export const whyUs = ['), data.indexOf('export const whyUs = [') + 1200);
  const nb = (whyUs.match(/title: "/g) || []).length;
  t('🚨 la grille « pourquoi nous » garde ses quatre cartes', nb === 4, `${nb}`);
  t('🚨 aucune carte « Assurance » n\'y a été ajoutée', !/title: "Assurance/.test(whyUs));
  const barre = sansCommentaires(lire('components/ObjectionBar.jsx'));
  t('🚨 la barre des objections reste muette', !/assur(é|e|ance)/i.test(barre));
  void cartes;
}

console.log('\n--- 3. 🚨 Le bouton ouvre le formulaire COMMERCIAL ---');
{
  t('🚨 « Demander notre preuve d\'assurance »', /Demander notre preuve d[’']assurance/.test(code));
  t('🚨 il pointe vers /soumission?service=commercial',
    /href="\/soumission\?service=commercial"/.test(code));

  const soum = sansCommentaires(lire('app/soumission/page.jsx'));
  t('🚨 la page lit le paramètre', /searchParams\?\.service/.test(soum));
  t('🚨 …et le traduit en option du menu', /serviceOptions\.find\(\(o\) => \/commercial\/i\.test\(o\)\)/.test(soum));
  t('🚨 la valeur vient de serviceOptions, pas d\'une chaîne écrite ici',
    !/"Lumière de Noël \(commercial/.test(soum));
  t('elle est passée au formulaire', /serviceInitial=\{serviceInitial\}/.test(soum));

  const form = sansCommentaires(lire('components/QuoteForm.jsx'));
  t('🚨 le formulaire présélectionne le service', /serviceInitial \? \{ \.\.\.empty, service: serviceInitial \}/.test(form));
  t('sans paramètre, il reste vierge', /: empty,/.test(form));
}

console.log('\n--- 4. 🚨 Rien d\'autre ne bouge dans le formulaire ---');
{
  const form = lire('components/QuoteForm.jsx');
  t('🚨 le consentement est intact',
    /consentement: `accordé le \$\{new Date\(\)\.toISOString\(\)\.slice\(0, 10\)\} via \$\{source\}`/.test(form));
  t('🚨 l\'envoi vers /api/lead est intact', /fetch\("\/api\/lead"/.test(lire('components/data.js')));
  t('🚨 le pixel et l\'event_id sont intacts',
    /eventID/.test(lire('lib/meta-lead-event.js')) && /event_id/.test(lire('lib/meta-lead-event.js')));
  t('le honeypot est intact', /HONEYPOT_FIELD/.test(form));
  t('un seul QuoteForm sur /soumission',
    (sansCommentaires(lire('app/soumission/page.jsx')).match(/<QuoteForm/g) || []).length === 1);
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
