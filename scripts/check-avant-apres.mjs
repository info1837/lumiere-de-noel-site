// Les comparateurs montrent un VRAI avant/après, et le disent.
//
//   node scripts/check-avant-apres.mjs
//
// 🚨 CE QUI EST EN JEU.
//
// Un comparateur avant/après est une affirmation : « voilà ce qu'on a
// fait à cette maison ». Trois façons de la rendre fausse, et ce garde
// les ferme toutes les trois :
//
//   1. LES DEUX MOITIÉS NE SE SUPERPOSENT PAS. Si les dimensions
//      diffèrent, la ligne de toit saute d'un côté à l'autre de la
//      couture. L'œil le voit, et tout le bloc perd sa crédibilité.
//
//   2. LA SIMULATION PASSE POUR UNE PHOTO. Le côté « avant » est généré
//      — la vraie photo, lumières retirées. Il doit être étiqueté
//      « simulation », et son alt ne doit nommer AUCUNE ville : une
//      ville dans l'alt laisserait croire qu'on a photographié cette
//      maison avant les travaux.
//
//   3. LE REPLI REVIENT. Avant, faute de « avant », le composant
//      assombrissait la photo réelle au filtre CSS. Honnête tant que les
//      étiquettes le disaient — mais c'est un chemin qui fabrique un
//      « avant », et il n'a plus de raison d'exister.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`);
  ok ? pass++ : fail++;
};
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
// ⚠️ Les commentaires CITENT les formulations interdites pour expliquer
// pourquoi elles le sont — et la garde échouait alors sur sa propre
// documentation. C'est la quatrième fois que ce piège se referme dans ce
// dépôt ; les autres check-*.mjs ont déjà cette fonction.
const sansCommentaires = (x) => x
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const { PHOTOS, paireAvantApres, CLES_SIMULATION, REEL_PREFIX } =
  await import(path.join(ROOT, 'components/photos.js'));

const PAIRES = [
  { cle: 'avant-lery', ville: 'Léry' },
  { cle: 'avant-ste-julienne', ville: 'Sainte-Julienne' },
];

console.log('\n--- 1. 🚨 Les deux moitiés se superposent au pixel ---');
for (const { cle, ville } of PAIRES) {
  const paire = paireAvantApres(cle);
  t(`${ville} : la paire est déclarée`, !!paire);
  if (!paire) continue;

  const fAvant = path.join(ROOT, 'public', paire.avant.src);
  const fApres = path.join(ROOT, 'public', paire.apres.src);
  t(`  le « avant » existe`, fs.existsSync(fAvant), paire.avant.src);
  t(`  le « après » existe`, fs.existsSync(fApres), paire.apres.src);
  if (!fs.existsSync(fAvant) || !fs.existsSync(fApres)) continue;

  const [a, b] = await Promise.all([sharp(fAvant).metadata(), sharp(fApres).metadata()]);
  t(`  🚨 MÊMES dimensions`, a.width === b.width && a.height === b.height,
    `${a.width}×${a.height} vs ${b.width}×${b.height}`);
  t(`  le « avant » est un JPEG`, a.format === 'jpeg', a.format);
  // 4 à 6 Mo de PNG pour une image d'arrière-plan, c'est le LCP de la page.
  const ko = Math.round(fs.statSync(fAvant).size / 1024);
  t(`  …et il est léger (< 400 Ko)`, ko < 400, `${ko} Ko`);
}

console.log('\n--- 2. 🚨 Aucun accent, aucun PNG oublié ---');
{
  const dir = fs.readdirSync(path.join(ROOT, 'public/images'));
  const accentues = dir.filter((f) => /^before-/.test(f) && /[^\x00-\x7F]/.test(f));
  // Un accent dans un nom de fichier est encodé différemment selon le
  // navigateur et l'hébergeur : c'est un 404 qu'on ne reproduit pas en
  // local. Le fichier source s'appelait « before-léry.png ».
  t('🚨 aucun nom de fichier accentué', accentues.length === 0, accentues.join(', '));
  const pngs = dir.filter((f) => /^before-.*\.png$/i.test(f));
  t('🚨 les PNG d\'origine sont partis', pngs.length === 0, pngs.join(', '));
}

console.log('\n--- 3. 🚨 Une simulation ne se fait pas passer pour une photo ---');
{
  const VILLES = ['Léry', 'Lery', 'Sainte-Julienne', 'Ste-Julienne', 'Blainville',
    'Terrebonne', 'Montréal', 'Mirabel', 'Mercier', 'Saint-Jérôme', 'Laval'];
  t('les deux simulations sont déclarées', CLES_SIMULATION.length === 2, CLES_SIMULATION.join(', '));
  for (const cle of CLES_SIMULATION) {
    const p = PHOTOS[cle];
    t(`${cle} est marquée simulation`, p.simulation === true);
    // La règle du dossier : seule une image sous /images/reel/ est une
    // vraie photo, et elle seule peut nommer une ville.
    t(`  🚨 elle ne vit PAS sous ${REEL_PREFIX}`, !p.src.startsWith(REEL_PREFIX), p.src);
    const nommees = VILLES.filter((v) => p.alt.includes(v));
    t(`  🚨 son alt ne nomme AUCUNE ville`, nommees.length === 0, nommees.join(', ') || p.alt.slice(0, 50));
    t(`  …et il dit l'état`, /sans aucune lumière|sans lumière/i.test(p.alt));
  }
}

console.log('\n--- 4. 🚨 Les deux comparateurs disent lequel est lequel ---');
{
  const cas = [
    ['app/page.jsx', 'Léry', 'avant-lery'],
    ['app/simulateur/Simulateur.jsx', 'Sainte-Julienne', 'avant-ste-julienne'],
  ];
  for (const [f, ville, cle] of cas) {
    const src = lire(f);
    t(`${f} : utilise la paire ${cle}`, src.includes(`paireAvantApres("${cle}")`));
    t(`  🚨 le côté gauche est annoncé « simulation »`,
      /etiquetteAvant="Avant \(simulation\)"/.test(src));
    t(`  🚨 le côté droit est annoncé « installation réelle, ${ville} »`,
      src.includes(`etiquetteApres="Après — installation réelle, ${ville}"`));
    t(`  les deux alts décrivent l'état`,
      /altAvant="[^"]*sans aucune lumière[^"]*"/.test(src)
      && /altApres="[^"]*installation réelle[^"]*"/.test(src));
    t(`  🚨 et il passe bien une vraie paire`, /photoAvant=\{[^}]*\.avant\}/.test(src));
  }
}

console.log('\n--- 5. 🚨 Le repli « crépuscule » ne revient pas ---');
{
  const c = lire('components/RevelationLumiere.jsx');
  t('🚨 plus de filtre crépuscule dans le composant', !/revel-img--crepuscule/.test(c));
  t('🚨 ni dans le CSS (hors commentaire d\'explication)',
    !/^\.revel-img--crepuscule \{/m.test(lire('app/globals.css')));
  t('🚨 plus aucune image à alt vide dans le comparateur',
    !/alt=""/.test(sansCommentaires(c)));
  t('🚨 sans vraie paire, il ne rend RIEN', /if \(!photoAvant\?\.src \|\| !photo\?\.src\)/.test(c));
  // ⚠️ Le garde doit rester SOUS les hooks : un retour anticipé au-dessus
  // d'un useState change le nombre de hooks entre deux rendus.
  const dernierHook = Math.max(c.lastIndexOf('useState('), c.lastIndexOf('useRef('), c.lastIndexOf('useEffect('));
  t('🚨 …et ce retour est APRÈS tous les hooks',
    c.indexOf('if (!photoAvant?.src') > dernierHook);
}

console.log('\n--- 6. 🚨 Le balayage : une fois, et il lâche la poignée ---');
{
  const c = lire('components/RevelationLumiere.jsx');
  t('🚨 il part de 50 %', /depart = 50/.test(c));
  t('🚨 un aller-retour (il revient à 50 %)', /Math\.sin\(Math\.PI \* p\)/.test(c));
  t('🚨 une seule fois — l\'observateur se déconnecte', /io\.disconnect\(\);/.test(c));
  t('🚨 il respecte prefers-reduced-motion',
    /prefers-reduced-motion: reduce[\s\S]{0,60}return;/.test(c));
  // Le défaut réparé : la boucle reprenait la main à chaque frame même
  // après que la personne ait saisi la poignée.
  t('🚨 la première interaction l\'arrête POUR DE BON',
    /interrompu\.current = true/.test(c) && /if \(interrompu\.current\) return;/.test(c));
  t('…et annule la frame en cours', /cancelAnimationFrame\(frame\.current\)/.test(c));
}

console.log('\n--- 7. 🚨 Les étiquettes correspondent aux IMAGES ---');
{
  // 🚨 LE DÉFAUT RÉEL, TROUVÉ SUR UNE CAPTURE.
  //
  // Le calque découpé était l'« après » alors que le découpage révèle
  // depuis le bord GAUCHE, où l'étiquette dit « Avant ». Résultat : la
  // maison illuminée s'affichait sous « Avant (simulation) » et la
  // maison nue sous « Après — installation réelle ». Exactement
  // l'inverse de ce que le bloc affirme, sur les deux pages.
  //
  // Invisible en relecture pendant une PR entière, parce que les deux
  // moitiés étaient alors la même photo et que la classe s'appelait
  // `revel-apres`.
  const c = sansCommentaires(lire('components/RevelationLumiere.jsx'));
  const css = lire('app/globals.css');

  t('🚨 le calque DÉCOUPÉ porte l\'avant', /revel-avant[\s\S]{0,220}src=\{photoAvant\.src\}/.test(c));
  t('🚨 le calque de FOND porte l\'après',
    c.indexOf('src={photo.src}') < c.indexOf('revel-avant'));
  t('🚨 le découpage révèle bien depuis la gauche',
    /\.revel-avant \{[\s\S]{0,160}clip-path: inset\(0 calc\(100% - var\(--revel-pos/.test(css));
  t('🚨 l\'étiquette de GAUCHE est celle de l\'avant',
    /revel-etiq--gauche[\s\S]{0,120}etiquetteAvant/.test(c));
  t('🚨 …et celle de DROITE celle de l\'après',
    /revel-etiq--droite[\s\S]{0,120}etiquetteApres/.test(c));
  t('🚨 plus de classe `revel-apres` (le nom cachait l\'inversion)',
    !/className="revel-apres"/.test(c) && !/^\.revel-apres \{/m.test(css));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
