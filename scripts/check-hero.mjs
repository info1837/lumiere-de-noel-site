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

console.log('\n--- 3. Le bouton ---');
{
  t('🚨 « Réserver ma date » en bouton principal',
    /variant="gold">Réserver ma date</.test(heroCode));
  t('le bouton d\'appel reste à côté', /Appeler \{company\.phoneDisplay\}/.test(heroCode));
}

console.log('\n--- 4. 🚨 La ligne de rareté est VRAIE, ou absente ---');
{
  t('🚨 elle vient d\'une prop, pas d\'un texte en dur', /\{rarete\?\.texte &&/.test(heroCode));
  t('🚨 plus de « les dates de novembre partent en premier »',
    !/dates de novembre partent en premier/.test(heroCode));
  t('🚨 aucun nombre de dates écrit en dur dans le hero',
    !/\d+ dates? restantes?/.test(heroCode));
  t('🚨 elle est SOUS le bouton',
    heroCode.indexOf('Réserver ma date') < heroCode.indexOf('rarete?.texte'));
  t('le hero accepte null par défaut', /rarete = null/.test(hero));
}

console.log('\n--- 5. La page lit le CRM côté serveur ---');
{
  t('🚨 la page est asynchrone', /export default async function/.test(page));
  t('🚨 elle lit les disponibilités', /await lireDisponibilites\(\)/.test(page));
  t('🚨 et passe le message au hero', /<Hero rarete=\{rarete\} \/>/.test(page));
  t('le hero reste « use client » (il porte un formulaire)', /^"use client";/.test(hero));
  t('🚨 le hero ne fetch RIEN lui-même — le CORS du CRM le refuserait',
    !/fetch\(/.test(heroCode.split('submit')[0] || heroCode));
}

console.log('\n--- 6. Ce à quoi on ne touche pas ---');
{
  t('🚨 le formulaire du hero envoie toujours', /sendLead|onSubmit=\{submit\}/.test(hero));
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
