// Les comparateurs montrent un VRAI avant/après, et le disent.
//
//   node scripts/check-avant-apres.mjs
//   BASE_URL=http://127.0.0.1:4191 node scripts/check-avant-apres.mjs
//
// Les sections 1 à 8 lisent le source. La section 9 GLISSE AU DOIGT dans
// un vrai Chromium à 375 px : il faut un serveur (BASE_URL, :3000 par
// défaut). Sans serveur, elle échoue — elle ne se saute pas en silence.
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
import { chromium } from 'playwright';

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

console.log('\n--- 6. 🚨 Le curseur ne bouge que sous la main ---');
{
  const c = lire('components/RevelationLumiere.jsx');
  // ⚠️ LE PILOTAGE AU DÉFILEMENT EST RETIRÉ (passe « effets sobres »,
  // 2026-10-26). La couture suivait le défilement de 15 % à 85 % : un
  // rendu React par image pendant que le doigt faisait défiler la page —
  // le défilement « pas constant » mesuré sur mobile. Elle ne bouge plus
  // que sous le doigt, la souris ou le clavier.
  t('🚨 le défilement ne pilote plus la position',
    !/surDefilement\(|progressionDansEcran\(|addEventListener\(["']scroll/.test(c));
  t('🚨 plus de balayage unique', !/Math\.sin\(Math\.PI \* p\)/.test(c));
  t('🚨 il part de 50 %, et c\'est tout', /depart = 50/.test(c));
  // Le glissement écrit la variable CSS à la fréquence de l'écran, et ne
  // rend l'état React qu'au relâchement.
  t('🚨 le glissement suit le doigt sans rendu React par mouvement',
    /requestAnimationFrame/.test(c) && /setProperty\("--revel-pos"/.test(c));
  t('🚨 …et l\'état rattrape la couture au relâchement', /if \(g\.v !== undefined\) setPosition\(g\.v\);/.test(c));
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

console.log('\n--- 8. 🚨 Le doigt tient la couture, le range ne couvre plus l\'image ---');
{
  // 🚨 LE DÉFAUT MESURÉ (audit 375 px, octobre 2026).
  //
  // `.revel-curseur` était un <input type="range"> en opacité 0 tendu sur
  // toute l'image. Un range natif ne bouge au doigt que si on saisit SON
  // POUCE — invisible ici — et le défilement réécrivait la valeur à chaque
  // frame. On ne pouvait pas glisser : la maison ne bougeait qu'en défilant.
  const c = sansCommentaires(lire('components/RevelationLumiere.jsx'));
  const css = lire('app/globals.css');
  t('🚨 le cadre écoute les événements pointeur',
    /onPointerDown=\{auPointeurBas\}/.test(c) && /onPointerMove=\{auPointeurBouge\}/.test(c)
    && /onPointerUp=\{auPointeurHaut\}/.test(c) && /onPointerCancel=\{auPointeurHaut\}/.test(c));
  t('🚨 …et capture le pointeur', /setPointerCapture\(e\.pointerId\)/.test(c));
  // (Il n'y a plus de pilotage au défilement à couper : §6.)
  t('🚨 le défilement vertical reste à la page (touch-action: pan-y)',
    /\.revel-cadre \{[\s\S]{0,500}touch-action: pan-y/.test(css));
  const regleCurseur = (css.match(/^\.revel-cadre input\.revel-curseur\[type="range"\] \{[\s\S]*?\}/m) || [''])[0];
  t('🚨 le range est visuellement masqué', /clip-path: inset\(50%\)/.test(regleCurseur) && /width: 1px/.test(regleCurseur));
  t('🚨 …et ne couvre PLUS l\'image', !/inset: 0/.test(regleCurseur) && !/width: 100%/.test(regleCurseur));
  t('le range existe toujours, pour le clavier', /type="range"/.test(c) && /aria-label=/.test(c));
  t('le focus clavier se voit sur la poignée',
    /\.revel-cadre:has\(\.revel-curseur:focus-visible\) \.revel-poignee/.test(css));
}

console.log('\n--- 9. 🚨 Au doigt, dans un vrai navigateur, à 375 px ---');
{
  // Les événements tactiles passent par CDP (Input.dispatchTouchEvent) :
  // c'est le chemin du VRAI doigt dans Chromium, qui applique
  // `touch-action` et décide lui-même entre défilement et glissement.
  // Un `element.dispatchEvent(new PointerEvent(...))` contournerait
  // exactement ce qu'on veut prouver.
  const BASE = (process.env.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
  let serveur = false;
  try { serveur = (await fetch(BASE + '/')).ok; } catch {}
  t(`un serveur répond sur ${BASE}`, serveur, serveur ? '' : 'démarrez-le ou passez BASE_URL');

  if (serveur) {
    const nav = await chromium.launch(
      process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}
    );
    const ctx = await nav.newContext({
      viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    });
    const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

    for (const chemin of ['/', '/simulateur']) {
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      const doigt = async (points, pas = 16) => {
        const [x0, y0] = points[0];
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
        for (let i = 1; i < points.length; i++) {
          const [xa, ya] = points[i - 1], [xb, yb] = points[i];
          for (let k = 1; k <= pas; k++) {
            await cdp.send('Input.dispatchTouchEvent', {
              type: 'touchMove', touchPoints: [{ x: xa + (xb - xa) * k / pas, y: ya + (yb - ya) * k / pas }],
            });
            await attendre(8);
          }
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await attendre(150);
      };
      const pos = () => page.evaluate(() =>
        parseFloat(document.querySelector('.revel').style.getPropertyValue('--revel-pos')));
      const boite = () => page.evaluate(() => {
        const r = document.querySelector('.revel-cadre').getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height };
      });

      // `load`, pas `networkidle` : /simulateur garde des requêtes ouvertes.
      await page.goto(BASE + chemin, { waitUntil: 'load' });
      await page.waitForSelector('.revel-cadre');
      // ⚠️ `behavior: 'instant'` : le site défile en douceur
      // (scroll-behavior: smooth). Sans lui, le cadre bougeait encore
      // PENDANT le geste, et la boîte mesurée avant était fausse.
      await page.evaluate(() => {
        const el = document.querySelector('.revel-cadre');
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (innerHeight - el.offsetHeight) / 2, behavior: 'instant' });
      });
      await attendre(300);
      console.log(`  ${chemin}`);

      // La couture couvre le geste : le centre du cadre est sur la poignée.
      // On part donc LOIN d'elle, pour prouver « n'importe où sur l'image ».
      let b = await boite();
      await doigt([[b.x + b.w * 0.9, b.y + b.h * 0.2], [b.x + b.w * 0.15, b.y + b.h * 0.2]]);
      let p = await pos();
      t('  🚨 glisser vers la GAUCHE, depuis le haut de l\'image', Math.abs(p - 15) < 4, `${p.toFixed(1)} %`);

      b = await boite();
      await doigt([[b.x + b.w * 0.1, b.y + b.h * 0.8], [b.x + b.w * 0.8, b.y + b.h * 0.8]]);
      p = await pos();
      t('  🚨 glisser vers la DROITE, depuis le bas de l\'image', Math.abs(p - 80) < 4, `${p.toFixed(1)} %`);

      b = await boite();
      await doigt([[b.x + b.w * 0.4, b.y + b.h * 0.8]]);
      p = await pos();
      t('  🚨 un toucher fait SAUTER la couture là', Math.abs(p - 40) < 4, `${p.toFixed(1)} %`);

      // Le pilotage au défilement est mort : défiler ne la bouge plus.
      const avant = await pos();
      await page.evaluate(() => window.scrollBy({ top: 120, behavior: 'instant' }));
      await attendre(300);
      await page.evaluate(() => window.scrollBy({ top: -120, behavior: 'instant' }));
      await attendre(300);
      t('  🚨 après le premier contact, le défilement ne la reprend plus', Math.abs((await pos()) - avant) < 0.01,
        `${avant.toFixed(1)} → ${(await pos()).toFixed(1)} %`);

      // Un doigt qui DESCEND sur l'image fait défiler la page.
      b = await boite();
      const y0 = await page.evaluate(() => window.scrollY);
      const xV = b.x + b.w * 0.7;
      await doigt([[xV, b.y + b.h * 0.85], [xV, b.y + b.h * 0.1]], 24);
      await attendre(400);
      const y1 = await page.evaluate(() => window.scrollY);
      t('  🚨 un geste vertical sur l\'image FAIT DÉFILER la page', y1 - y0 > 60, `${Math.round(y1 - y0)} px`);
      t('  …et ne déplace pas la couture', Math.abs((await pos()) - avant) < 2, `${(await pos()).toFixed(1)} %`);

      const poignee = await page.evaluate(() => {
        const r = document.querySelector('.revel-poignee').getBoundingClientRect();
        return Math.min(r.width, r.height);
      });
      t('  🚨 la poignée est une cible tactile ≥ 44 px', poignee >= 44, `${poignee} px`);

      const range = await page.evaluate(() => {
        const r = document.querySelector('.revel-curseur').getBoundingClientRect();
        return r.width * r.height;
      });
      t('  🚨 le range ne couvre pas l\'image', range <= 1, `${range} px²`);

      // Le clavier, toujours : flèche droite sur le range.
      const pk = await pos();
      await page.focus('.revel-curseur');
      await page.keyboard.press('ArrowRight');
      await attendre(100);
      t('  le clavier déplace toujours la couture', (await pos()) > pk, `${pk.toFixed(1)} → ${(await pos()).toFixed(1)} %`);

      await page.close();
    }
    await nav.close();
  }
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
