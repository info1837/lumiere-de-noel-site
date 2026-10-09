// La page est vivante, et elle le reste sans rien casser.
//
//   node scripts/check-vie.mjs
//
// Six effets ont été ajoutés d'un coup. Chacun peut se dégrader
// silencieusement : une animation sur `height` qui fait sauter la mise
// en page, un état masqué qui survit sans JavaScript, une boucle qui
// tourne hors de vue. Ce garde tient les règles qui les encadrent.

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
  // ⚠️ LA RÈGLE QUI PROTÈGE LE CONTENU. Tout état masqué est derrière
  // `html.mvt`, et cette classe est posée par le script. Pas de script,
  // pas de classe, pas de masque : la page s'affiche entière.
  const etatsMasques = [
    ['.rv-t', /html\.mvt \.rv-t \{/],
    ['.rv-p > img', /html\.mvt \.rv-p > img/],
    ['le hero qui s\'allume', /html\.mvt \.hero-section > img \{/],
    ['la guirlande du hero', /html\.mvt \.hero-guirlande span \{/],
  ];
  for (const [nom, re] of etatsMasques) t(`🚨 ${nom} est derrière html.mvt`, re.test(cssNu));
  t('🚨 aucun état masqué à la racine de la feuille',
    !/^\.rv-t \{/m.test(cssNu) && !/^\.rv-p > img/m.test(cssNu));
  t('🚨 la classe est posée par le script', /classList\.add\(CLASSE_RACINE\)/.test(couche));
  t('🚨 …et retirée au démontage', /classList\.remove\(CLASSE_RACINE\)/.test(couche));
  t('🚨 la guirlande reste allumée sans JS',
    /html:not\(\.mvt\) \.hero-guirlande span \{ opacity: 0\.9;/.test(cssNu));
  t('🚨 la bande reste défilable à la main sans JS',
    /html:not\(\.mvt\) \.defile \{ overflow-x: auto; \}/.test(cssNu));
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

console.log('\n--- 3. 🚨 Les six effets sont là ---');
{
  t('🚨 le hero s\'allume (0,45 → 1 en 1,2 s)',
    /@keyframes heroAllume/.test(cssNu) && /brightness\(0\.45\)/.test(cssNu)
    && /animation: heroAllume 1200ms/.test(cssNu));
  t('🚨 …une seule fois (`both`, pas `infinite`)',
    /animation: heroAllume 1200ms[^;]*both;/.test(cssNu));
  t('🚨 la guirlande du hero s\'allume de gauche à droite',
    /AMPOULES_HERO/.test(couche) && /--amp-d/.test(couche) && /@keyframes ampouleAllume/.test(cssNu));
  t('🚨 la progression de lecture existe',
    /className = "progression"/.test(couche) && /\.progression span\.on \{/.test(cssNu));
  t('🚨 …et elle est `fixed`, donc elle ne pousse rien',
    /\.progression \{[\s\S]{0,120}position: fixed;/.test(cssNu));
  t('🚨 la frise se trace au défilement',
    /--frise-p/.test(couche) && /transform: scaleX\(var\(--frise-p, 0\)\)/.test(cssNu));
  t('🚨 …et ses points s\'allument un à un',
    /classList\.toggle\("atteinte"/.test(couche) && /\.frise-etape\.atteinte \.frise-point/.test(cssNu));
  t('🚨 « 100+ avis » se compte', /requestAnimationFrame\(pas\)/.test(couche)
    && /avis\.textContent = texte\.replace\(/.test(couche));
  t('🚨 …et le texte exact revient au démontage', /avis\.textContent = texte;/.test(couche));
  t('🚨 le bouton primaire prend une lueur au survol',
    /html\.mvt a\[class\*="cta"\]:hover/.test(cssNu) && /rgba\(240, 186, 84/.test(cssNu));
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
  // Les ampoules : guirlande du hero, progression, points de frise.
  t('🚨 l\'ambre en fond ne sert qu\'aux ampoules', fondsAmbre <= 3, `${fondsAmbre} fond(s)`);
  t('🚨 aucun bouton ambre', !/\.cta[^{]*\{[^}]*background:\s*#F0BA54/i.test(bloc));
  t('les lueurs, elles, sont bien en ambre', /box-shadow:[^;]*240, 186, 84/.test(bloc));
}

console.log('\n--- 5. 🚨 Le défilement ne se calcule qu\'une fois par image ---');
{
  // `scroll` se déclenche bien plus souvent que l'écran ne se
  // rafraîchit. Sans ce garde-fou on calcule dix fois pour afficher une
  // fois — et sur un téléphone, ça se sent.
  t('🚨 un seul calcul par frame', /requestAnimationFrame\(tick\)/.test(mvt) && /enAttente/.test(mvt));
  t('🚨 l\'écoute est passive', /\{ passive: true \}/.test(mvt));
  t('🚨 …et elle se désabonne', /removeEventListener\('scroll'/.test(mvt));
  t('🚨 une première mesure sans attendre un geste', /ecouter\(\); \/\/ une première mesure/.test(mvt));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
