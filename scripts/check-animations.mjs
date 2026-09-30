// Moins d'animations, et variées.
//
//   node scripts/check-animations.mjs
//
// Avant : 34 flocons `position: fixed` sur le viewport — ils tombaient sur
// TOUTE la page, y compris derrière les champs du formulaire et dans le pied
// de page — et un seul effet d'apparition, appliqué à chaque section entière.
//
// Le comportement se prouve en navigateur (voir la PR). Ce harnais tient les
// deux pièges qui ne se voient pas à l'œil : la neige qui redevient globale,
// et un effet qui se répète d'une section à la suivante.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const couche = lire('components/FestiveLayer.jsx');
const css = lire('app/globals.css');
// Mes commentaires citent les valeurs d'AVANT (34 flocons, clip-path, fixed) :
// les lire ferait passer des assertions sur du texte explicatif.
const cssNu = css.replace(/\/\*[\s\S]*?\*\//g, '');
const codeNu = couche.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

console.log('\n--- 1. 🚨 La neige ne tombe que dans le hero ---');
{
  t('🚨 deux fois moins de flocons (34 → 17)', /const FLOCONS = 17;/.test(codeNu));
  t('🚨 elle est montée DANS le hero, par un portail',
    /createPortal\(\s*<div className="snow"[\s\S]{0,80}hero\s*\)/.test(codeNu));
  t('🚨 …et la cible est bien la section du hero', /querySelector\("\.hero-section"\)/.test(codeNu));
  t('🚨 sans hero, aucune neige', /if \(!hero\) return null;/.test(codeNu));
  t('🚨 la couche n\'est plus fixée au viewport',
    /\.snow \{ position: absolute; inset: 0;/.test(cssNu));
  t('🚨 …et surtout plus `fixed`', !/\.snow \{ position: fixed/.test(cssNu));
  t('🚨 les flocons sont deux fois plus lents', /const duree = 18 \+ \(i % 7\) \* 4;/.test(codeNu));
  t('🚨 la chute est en % du hero, pas en vh',
    /translate3d\(var\(--dx, 14px\), 105%, 0\)/.test(cssNu) && !/110vh/.test(cssNu));
}

console.log('\n--- 2. 🚨 Les apparitions visent les titres, pas les sections ---');
{
  t('🚨 on cible le titre de la section', /section\.querySelector\("h2"\)/.test(codeNu));
  t('🚨 …et son image maîtresse', /r\.height >= 140/.test(codeNu));
  t('🚨 pas une image de fond en absolu',
    /getComputedStyle\(img\)\.position !== "absolute"/.test(codeNu));
  t('🚨 le hero ne s\'anime pas (c\'est le premier écran)',
    /!s\.classList\.contains\("hero-section"\)/.test(codeNu));
  t('🚨 une seule fois par élément', /io\.unobserve\(e\.target\)/.test(codeNu));
  t('🚨 plus de classe posée sur les sections entières',
    !/el\.classList\.add\("reveal"/.test(codeNu));
}

console.log('\n--- 3. 🚨 Trois effets, jamais deux fois le même d\'affilée ---');
{
  t('🚨 la séquence est A · B · C · B',
    /const EFFETS = \["reveal--a", "reveal--b", "reveal--c", "reveal--b"\];/.test(codeNu));
  // ⚠️ Indexer sur la position de la section faisait sauter des cases pour
  // celles sans titre ni image : deux voisines tombaient sur le même effet.
  t('🚨 le rang n\'avance QUE pour une section qui reçoit un effet',
    /if \(!cibles\.length\) return;/.test(codeNu) && /EFFETS\[rang % EFFETS\.length\]/.test(codeNu));
  t('…et il avance bien', /rang \+= 1;/.test(codeNu));
  t('🚨 A — fondu et légère montée', /\.reveal--a \{ opacity: 0; transform: translateY\(18px\); \}/.test(cssNu));
  t('🚨 B — dévoilement gauche → droite', /\.reveal--b \{[\s\S]{0,400}mask-position: 100% 0;/.test(cssNu));
  t('🚨 C — dézoom 1,05 → 1', /\.reveal--c \{ opacity: 0; transform: scale\(1\.05\); \}/.test(cssNu));
  // ⚠️ clip-path: inset(0 100% 0 0) met l'aire d'intersection à zéro :
  // l'observateur ne voit JAMAIS l'élément entrer et le titre reste invisible.
  // On ne lit QUE la règle .reveal--b : un clip-path décoratif sans rapport
  // vit plus bas dans la feuille (une diagonale de section).
  const regleB = cssNu.slice(cssNu.indexOf('.reveal--b {'), cssNu.indexOf('.reveal--c {'));
  t('🚨 B n\'utilise PAS clip-path (il rendrait le titre invisible à jamais)',
    regleB.length > 40 && !/clip-path/.test(regleB));
  t('🚨 les durées d\'effet sont entre 400 et 600 ms',
    /transform 420ms/.test(cssNu) && /mask-position 560ms/.test(cssNu) && /transform 600ms/.test(cssNu));
}

console.log('\n--- 4. 🚨 Rien ne bouge pour qui l\'a demandé ---');
{
  t('🚨 on sort avant de poser quoi que ce soit',
    /matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches\) return;/.test(codeNu));
  t('🚨 …donc rien n\'est masqué en attendant une apparition qui ne vient pas',
    codeNu.indexOf('matchMedia("(prefers-reduced-motion: reduce)")') < codeNu.indexOf('classList.add("reveal"'));
  t('🚨 la neige est coupée aussi en CSS',
    /@media \(prefers-reduced-motion: reduce\) \{[\s\S]{0,60}\.snow \{ display: none; \}/.test(cssNu));
  t('🚨 et les masques sont retirés', /-webkit-mask-image: none; mask-image: none;/.test(cssNu));
}

console.log('\n--- 5. Ce à quoi on ne touche pas ---');
{
  t('🚨 le pixel est intact', /eventID/.test(lire('lib/meta-lead-event.js')));
  t('🚨 l\'envoi vers /api/lead est intact', /fetch\("\/api\/lead"/.test(lire('components/data.js')));
  t('🚨 le bandeau de rareté est intact', /<BandeauRarete/.test(lire('app/layout.jsx')));
  t('🚨 la barre du bas reste conditionnelle (bloc 2)',
    /mobile-bottom-bar\$\{visible \? " est-visible" : ""\}/.test(lire('app/ClientLayout.jsx')));
  t('🚨 la respiration mobile reste (bloc 3)',
    /section \{ padding-top: 84px; padding-bottom: 84px; \}/.test(cssNu));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
