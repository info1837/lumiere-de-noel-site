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
    /createPortal\(\s*<div className="snow"[\s\S]{0,120}hero,?\s*\)/.test(codeNu));
  t('🚨 …et la cible est bien la section du hero', /querySelector\("\.hero-section"\)/.test(codeNu));
  t('🚨 sans hero, aucune neige', /if \(!hero\) return null;/.test(codeNu));
  t('🚨 la couche n\'est plus fixée au viewport',
    /\.snow \{ position: absolute; inset: 0;/.test(cssNu));
  t('🚨 …et surtout plus `fixed`', !/\.snow \{ position: fixed/.test(cssNu));
  t('🚨 les flocons sont deux fois plus lents', /const duree = 18 \+ \(i % 7\) \* 4;/.test(codeNu));
  t('🚨 la chute est en % du hero, pas en vh',
    /translate3d\(var\(--dx, 14px\), 105%, 0\)/.test(cssNu) && !/110vh/.test(cssNu));
}

console.log('\n--- 2. 🚨 Les apparitions : le texte monte, les photos se dévoilent ---');
{
  // ⚠️ LE JEU D'EFFETS A CHANGÉ (passe « vie », 2026-10-09).
  //
  // Avant : trois effets (A · B · C · B) posés sur le TITRE de chaque
  // section et son image maîtresse, en alternant pour ne jamais répéter
  // le voisin. C'était la bonne réponse à « ne pas faire monter un bloc
  // de 1 800 px » — mais ça ne révélait que deux éléments par section,
  // et la page restait plate entre les deux.
  //
  // Maintenant : un seul vocabulaire, appliqué à ce qui se lit — titres,
  // paragraphes, boutons, items de liste — avec un décalage de 60 ms
  // dans l'ordre du document. Les photos ont leur propre effet.
  // Plus besoin d'alterner : il n'y a plus qu'un effet par nature
  // d'élément, donc deux voisins ne peuvent pas « tomber sur le même ».
  t('🚨 le texte visé est celui qui se lit',
    /"h2, h3, p, \.section-lien, \.offre-liste li, \.frise-etape/.test(codeNu));
  t('🚨 un décalage de 60 ms, dans l\'ordre du document', /const PAS_MS = 60;/.test(codeNu));
  t('🚨 …borné, pour qu\'un long bloc ne finisse pas une seconde plus tard',
    /Math\.min\(rang, 6\) \* PAS_MS/.test(codeNu));
  t('🚨 le hero ne s\'anime pas (il a sa propre entrée)',
    /!s\.classList\.contains\("hero-section"\)/.test(codeNu));
  t('🚨 une seule fois par élément', /io\.unobserve\(e\.target\)/.test(codeNu));
  t('🚨 rien n\'est révélé deux fois', /el\.closest\("\.rv-t, \.rv-p"\)/.test(codeNu));
  t('🚨 déjà à l\'écran au chargement → affiché sans animer (pas de clignotement)',
    /getBoundingClientRect\(\)\.top < vh \* 0\.92/.test(codeNu));
}

console.log('\n--- 3. 🚨 Deux effets : le texte, et la photo ---');
{
  t('🚨 texte — fondu + 16 px de montée',
    /html\.mvt \.rv-t \{[\s\S]{0,80}translateY\(16px\);/.test(cssNu));
  t('🚨 photo — dévoilement au découpage + dézoom 1,04 → 1',
    /clip-path: inset\(0 100% 0 0\);[\s\S]{0,60}scale\(1\.04\)/.test(cssNu));
  t('…et elle revient à 1', /clip-path: inset\(0 0 0 0\);[\s\S]{0,60}scale\(1\)/.test(cssNu));

  // ⚠️ LE PIÈGE DU clip-path, QUI N'A PAS DISPARU.
  //
  // L'ancienne garde interdisait clip-path sur l'effet B parce qu'une
  // aire d'intersection nulle empêche l'observateur de se déclencher —
  // et le titre restait invisible à jamais. Le piège est le même ici :
  // la photo EST découpée. Ce qui le désamorce, c'est qu'on observe le
  // PARENT (`.rv-p`) et jamais l'image.
  t('🚨 on observe le PARENT, jamais l\'image découpée',
    /querySelectorAll\("figure, \.revel"\)/.test(codeNu)
    && /html\.mvt \.rv-p > img/.test(cssNu));
  t('🚨 …et le texte, lui, n\'est jamais découpé',
    !/\.rv-t[^{]*\{[^}]*clip-path/.test(cssNu));
  t('les durées restent sobres (≤ 900 ms)',
    /transition: opacity 520ms/.test(cssNu) && /clip-path 820ms/.test(cssNu));
}

console.log('\n--- 4. 🚨 Rien ne bouge pour qui l\'a demandé ---');
{
  // Le test `matchMedia` vit maintenant dans lib/mouvement.js, derrière
  // `mouvementReduit()` — une seule écriture pour tous les composants
  // qui bougent, au lieu de quatre copies qui finiraient par diverger.
  const mvt = lire('lib/mouvement.js');
  t('🚨 le garde existe, en un seul endroit',
    /prefers-reduced-motion: reduce/.test(mvt) && /export function mouvementReduit/.test(mvt));
  // ⚠️ « Mouvement réduit » ne veut plus dire « rien ». La couche pose
  // la classe racine dans les deux cas — les FONDUS restent — et la
  // feuille retire tout déplacement. Voir check-vie §6.
  t('🚨 le garde est lu AVANT de poser la classe racine',
    /const doux = mouvementReduit\(\);/.test(codeNu)
    && codeNu.indexOf('const doux = mouvementReduit();') < codeNu.indexOf('classList.add(CLASSE_RACINE)'));

  // ⚠️ LA RÈGLE QUI COMPTE VRAIMENT : l'état masqué n'existe QUE si le
  // script a posé la classe sur <html>. Sans JS, aucune règle
  // `html.mvt .rv-*` ne s'applique et la page s'affiche entière.
  t('🚨 tout état masqué est préfixé par la classe racine',
    !/^\.rv-t \{/m.test(cssNu) && /html\.mvt \.rv-t \{/.test(cssNu));
  t('🚨 …et la classe est posée par le script', /classList\.add\(CLASSE_RACINE\)/.test(codeNu));
  t('🚨 la neige est coupée aussi en CSS',
    /@media \(prefers-reduced-motion: reduce\) \{[\s\S]{0,60}\.snow \{ display: none; \}/.test(cssNu));
  t('🚨 les apparitions ne déplacent plus rien (fondu seul)',
    /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,900}html\.mvt \.rv-t\.est-la \{ opacity: 1; transform: none; transition: opacity 300ms/.test(cssNu));
  t('🚨 le hero s\'éclaire sans bouger (luminosité seule)',
    /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,1200}html\.mvt \.hero-section > img \{ animation: heroEclaire/.test(cssNu));
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
