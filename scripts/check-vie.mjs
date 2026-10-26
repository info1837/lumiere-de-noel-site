// La page est vivante, et elle le reste sans rien casser.
//
//   node scripts/check-vie.mjs
//
// Chaque effet peut se dégrader silencieusement : une animation sur
// `height` qui fait sauter la mise en page, un état masqué qui survit
// sans JavaScript, une boucle qui tourne hors de vue. Ce garde tient les
// règles qui les encadrent.
//
// ⚠️ PASSE « EFFETS SOBRES » (2026-10-26) : le hero qui s'allume, la
// guirlande en cascade, la frise tracée au défilement et les fondus en
// mouvement réduit sont PARTIS. Les règles détaillées vivent dans
// scripts/check-animations.mjs ; ce garde-ci tient ce qui reste.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`);
  ok ? pass++ : fail++;
};
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const sansCommentaires = (x) => x
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const css = lire('app/globals.css');
const cssNu = sansCommentaires(css);

// ⚠️ LE BLOC DE MOUVEMENT SE DÉCOUPE SUR LE CSS BRUT, PAS SUR LE CSS NU.
//
// Première version : `cssNu.indexOf('LE MOUVEMENT')`. Or « LE MOUVEMENT »
// est le titre d'un COMMENTAIRE, que `sansCommentaires` venait de
// supprimer. `indexOf` rendait -1, `slice(-1)` rendait un seul
// caractère, et les deux sections qui s'en servaient passaient au vert
// sur une chaîne vide. Un faux vert : exactement le mode de panne qu'on
// traque ailleurs dans ce dépôt.
//
// On localise donc dans le brut, puis on retire les commentaires de la
// tranche.
const DEBUT_MVT = css.indexOf('LE MOUVEMENT');
const blocMvt = DEBUT_MVT >= 0 ? sansCommentaires(css.slice(DEBUT_MVT)) : '';
const couche = sansCommentaires(lire('components/FestiveLayer.jsx'));
const mvt = lire('lib/mouvement.js');

console.log('\n--- 1. 🚨 Rien ne reste masqué si le JavaScript ne tourne pas ---');
{
  // ⚠️ LA RÈGLE QUI PROTÈGE LE CONTENU. Le seul état masqué est derrière
  // `html.mvt`, et cette classe est posée par le script. Pas de script,
  // pas de classe, pas de masque : la page s'affiche entière.
  t('🚨 .rv est derrière html.mvt', /html\.mvt \.rv \{/.test(cssNu));
  t('🚨 aucun état masqué à la racine de la feuille', !/^\.rv \{/m.test(cssNu));
  t('🚨 la classe est posée par le script', /classList\.add\(CLASSE_RACINE\)/.test(couche));
  t('🚨 …et retirée au démontage', /classList\.remove\(CLASSE_RACINE\)/.test(couche));
  t('🚨 la guirlande du hero est allumée d\'office (rendue par le serveur)',
    /\.hero-guirlande span \{[\s\S]{0,160}opacity: 0\.9;/.test(cssNu)
    && /<GuirlandeHero \/>/.test(lire('components/Hero.jsx')));
  t('🚨 la bande se fait défiler à la main, toujours',
    /\.defile \{[\s\S]{0,80}overflow-x: auto;/.test(cssNu));
}

console.log('\n--- 2. 🚨 On n\'anime que ce qui ne coûte rien ---');
{
  // Sans ce garde-fou, une tranche vide ferait passer toute la section.
  t('le bloc de mouvement est bien trouvé', blocMvt.length > 2000, `${blocMvt.length} car.`);
  // transform / opacity / filter / clip-path sont composités : le reste
  // fait recalculer la mise en page à chaque image, et le CLS décolle.
  // `grid-template-rows` est la seule exception, et elle est assumée :
  // c'est la seule façon d'animer vers une hauteur AUTO sans la mesurer
  // en JavaScript, et elle vit dans un conteneur en `overflow: hidden`
  // qui ne pousse rien autour de lui.
  const AUTORISEES = ['transform', 'opacity', 'filter', 'clip-path', 'box-shadow',
    'background', 'border-color', 'mask-position', 'grid-template-rows',
    '-webkit-mask-position', 'padding-left',
    // `transition: none` — une valeur, pas une propriété. Elle vient du
    // bloc `prefers-reduced-motion`, qui coupe tout.
    'none'];
  const bloc = blocMvt;
  const proprietes = new Set();
  for (const m of bloc.matchAll(/transition:\s*([^;]+);/g)) {
    for (const part of m[1].split(',')) {
      const prop = part.trim().split(/\s+/)[0];
      if (prop && !/^\d/.test(prop)) proprietes.add(prop);
    }
  }
  const interdites = [...proprietes].filter((p) => !AUTORISEES.includes(p));
  t('🚨 aucune transition sur une propriété coûteuse', interdites.length === 0,
    interdites.join(', ') || [...proprietes].join(', '));
  // Les deux qui font vraiment sauter la page.
  t('🚨 jamais `height` ni `width` en transition',
    !/transition:[^;]*\b(height|width)\b/.test(bloc));
  t('🚨 ni `top`/`left`', !/transition:[^;]*\b(top|left)\b/.test(bloc));
}

console.log('\n--- 3. 🚨 Ce qui reste est là ---');
{
  // ⚠️ LA GUIRLANDE DE PROGRESSION EST RETIRÉE, et elle ne doit pas
  // revenir par la bande.
  t('🚨 plus de guirlande de progression sous l\'entête',
    !/progression/i.test(couche) && !/\.progression\b/.test(cssNu) && !/AMPOULES_PROGRESSION/.test(couche));
  // Le compteur « 100+ avis » est parti avec la ligne des avis de Palencia
  // (2026-10-14) : il partait de 0 et affichait « 0+ avis ».
  t('🚨 plus de compteur d\'avis', !/avis\.textContent/.test(couche));
  t('🚨 le bouton primaire prend une lueur au survol',
    /a\[class\*="cta"\]:hover/.test(cssNu) && /rgba\(240, 186, 84/.test(cssNu));
  t('🚨 la FAQ s\'ouvre en hauteur, sans mesurer en JS',
    /\.faq-panneau \{[\s\S]{0,120}grid-template-rows: 0fr;/.test(cssNu)
    && /\.faq-panneau\[data-ouvert="1"\] \{ grid-template-rows: 1fr; \}/.test(cssNu));
  t('🚨 …et la réponse reste dans le DOM (lisible par un robot)',
    /<div className="faq-panneau"/.test(lire('components/ui.jsx')));
}

console.log('\n--- 4. 🚨 L\'ambre ne sert qu\'à la lumière ---');
{
  // La règle du dossier depuis la refonte : l'ambre éclaire, elle ne
  // peint pas. Dans tout le bloc de mouvement, elle ne doit apparaître
  // qu'en `box-shadow` (une lueur) ou en fond d'une AMPOULE.
  const bloc = blocMvt;
  const fondsAmbre = [...bloc.matchAll(/background:\s*#F0BA54/gi)].length;
  // Les ampoules : guirlande du hero, points de frise.
  t('🚨 l\'ambre en fond ne sert qu\'aux ampoules', fondsAmbre <= 2, `${fondsAmbre} fond(s)`);
  t('🚨 aucun bouton ambre', !/\.cta[^{]*\{[^}]*background:\s*#F0BA54/i.test(bloc));
  t('les lueurs, elles, sont bien en ambre', /box-shadow:[^;]*240, 186, 84/.test(bloc));
}

console.log('\n--- 5. 🚨 Plus rien ne se calcule au défilement ---');
{
  // Le comparateur et la frise étaient pilotés par un écouteur `scroll`
  // (un rendu React par image pour le comparateur). Il n'en reste aucun :
  // l'apparition passe par un IntersectionObserver, qui ne coûte rien
  // pendant que le doigt fait défiler.
  t('🚨 lib/mouvement.js n\'exporte plus d\'abonnement au défilement',
    !/surDefilement|progressionDansEcran/.test(mvt));
  t('🚨 la couche d\'apparition n\'écoute pas le défilement',
    !/addEventListener\(["']scroll/.test(couche) && /IntersectionObserver/.test(couche));
}

console.log('\n--- 6. 🚨 Mouvement réduit : aucune animation ---');
{
  t('🚨 la classe racine n\'est PAS posée en mouvement réduit (rien de masqué)',
    /if \(mouvementReduit\(\) \|\| typeof IntersectionObserver === "undefined"\) return;/.test(couche));
  const fin = cssNu.slice(cssNu.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
  t('🚨 la feuille finit par un garde global qui coupe tout',
    /animation-duration: 0s !important/.test(fin) && /transition-duration: 0s !important/.test(fin));
}

console.log('\n--- 7. 🚨 L\'entête est une seule surface pleine ---');
{
  t('🚨 un fond plein derrière la barre et la pilule',
    /\.entete-fond \{[\s\S]{0,200}position: fixed;[\s\S]{0,200}background: #0A1524;/.test(cssNu)
    && /<div className="entete-fond" aria-hidden="true" \/>/.test(lire('app/ClientLayout.jsx')));
  t('🚨 …qui descend jusqu\'à un encart SOUS la pilule',
    /\.entete-fond \{[\s\S]{0,120}height: calc\(var\(--entete-total\) \+ var\(--entete-encart\)\);/.test(cssNu)
    && /body\.avec-bandeau \.entete-fond \{\s*height: calc\(var\(--bandeau-h\) \+ var\(--entete-total\) \+ var\(--entete-encart\)\);/.test(cssNu));
  t('🚨 …et ne capte aucun clic', /\.entete-fond \{[\s\S]{0,300}pointer-events: none;/.test(cssNu));
  t('🚨 la guirlande du hero pend sous le fond, pas dessous',
    /\.hero-guirlande \{[\s\S]{0,80}top: calc\(var\(--entete-total\) \+ var\(--entete-encart\)\);/.test(cssNu));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
