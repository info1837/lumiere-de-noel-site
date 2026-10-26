// Les effets, niveau agence : sobres, et jamais au prix du défilement.
//
//   node scripts/check-animations.mjs
//
// Passe « effets sobres » (2026-10-26). /concours chargeait lentement et
// son défilement n'était pas constant ; l'accueil passait 1,4 s à bloquer
// le thread principal (Lighthouse mobile). Les règles qu'on tient ici :
//
//   1. Défilement NATIF partout : aucun smooth-scroll (JS ou CSS), aucun
//      scroll-snap, aucun parallaxe, rien de piloté par le défilement.
//   2. Au-dessus de la ligne de flottaison : rien ne s'anime.
//   3. Plus bas : opacité + translateY 8 à 12 px, 250 à 400 ms, ease-out,
//      une fois, déclenchée tôt, jamais de contenu caché si le JS tarde,
//      cascade de trois éléments au plus.
//   4. Survols 150 à 200 ms ; le comparateur suit le doigt.
//   5. prefers-reduced-motion : aucune animation.
//   6. Aucune boucle, sauf la démo des DEL (c'est le produit montré).
//
// Le comportement se prouve en navigateur (captures et Lighthouse de la
// PR). Ce harnais tient ce qui se dégrade sans se voir.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const nu = (x) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const css = nu(lire('app/globals.css'));
const couche = nu(lire('components/FestiveLayer.jsx'));
const revel = nu(lire('components/RevelationLumiere.jsx'));
const defile = nu(lire('components/VitrineDefilante.jsx'));
const ambiances = nu(lire('components/AmbiancesPermanent.jsx'));
const hero = nu(lire('components/Hero.jsx'));

// Tout le code client du site, pour les interdits globaux.
const sources = [];
for (const dir of ['app', 'components', 'lib']) {
  const marcher = (d) => {
    for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'api') marcher(p); }
      else if (/\.(jsx?|mjs)$/.test(e.name)) sources.push([p, nu(lire(p))]);
    }
  };
  marcher(dir);
}
const ou = (re) => sources.filter(([, c]) => re.test(c)).map(([p]) => p);

console.log('\n--- 1. 🚨 Le défilement est celui du navigateur ---');
{
  t('🚨 aucun scroll-behavior: smooth dans la feuille', !/scroll-behavior:\s*smooth/.test(css));
  t('🚨 aucun scroll-snap', !/scroll-snap/.test(css));
  t('🚨 aucun scroll-snap posé en ligne dans le JSX', ou(/scrollSnap/).length === 0, ou(/scrollSnap/).join(', '));
  const lib = ['lenis', 'locomotive-scroll', 'gsap', 'framer-motion', 'aos', 'react-scroll-parallax', 'smooth-scrollbar'];
  const deps = Object.keys({ ...JSON.parse(lire('package.json')).dependencies, ...JSON.parse(lire('package.json')).devDependencies });
  t('🚨 aucune librairie d\'animation ou de smooth-scroll', !deps.some((d) => lib.includes(d)), deps.filter((d) => lib.includes(d)).join(', '));
  t('🚨 aucun scrollTo/scrollBy « smooth » dans le code', ou(/behavior:\s*["']smooth["']/).length === 0, ou(/behavior:\s*["']smooth["']/).join(', '));
  // Plus rien de piloté par le défilement : ni le comparateur, ni la frise.
  const ecoutes = ou(/addEventListener\(\s*["']scroll["']/);
  t('🚨 un seul écouteur de défilement : l\'opacité de l\'entête', ecoutes.length === 1 && ecoutes[0] === 'app/ClientLayout.jsx', ecoutes.join(', '));
  t('🚨 …et il est passif', /addEventListener\("scroll", onScroll, \{ passive: true \}\)/.test(lire('app/ClientLayout.jsx')));
  t('🚨 le comparateur ne suit plus le défilement', !/surDefilement|progressionDansEcran/.test(revel));
  t('🚨 la frise ne se trace plus au défilement', !/--frise-p/.test(css) && !/frise/.test(couche.replace(/\.frise-etape/g, '')));
}

console.log('\n--- 2. 🚨 Au-dessus de la ligne de flottaison, rien ne s\'anime ---');
{
  t('🚨 la photo du hero ne « s\'allume » plus', !/heroAllume|heroEclaire/.test(css));
  t('🚨 plus de neige', !/\.flake|snowFall|\.snow\b/.test(css) && !/flake|FLOCONS/.test(couche));
  t('🚨 la guirlande du hero est rendue par le serveur, allumée',
    /<GuirlandeHero \/>/.test(hero) && /\.hero-guirlande span \{[^}]*opacity: 0\.9;/.test(css) && !/ampouleAllume/.test(css));
  t('🚨 le point du bandeau ne respire plus', !/bandeau-respire/.test(css));
  t('🚨 les sections du premier écran sont exclues de l\'apparition',
    /!s\.classList\.contains\("hero-section"\) && !s\.hasAttribute\("data-sans-apparition"\)/.test(couche));
  t('🚨 ce qui est à l\'écran au chargement n\'est jamais masqué', /if \(r\.top < vh\) return;/.test(couche));
}

console.log('\n--- 3. 🚨 L\'apparition plus bas : douce, une fois, tôt ---');
{
  const base = css.match(/html\.mvt \.rv \{([^}]*)\}/)?.[1] || '';
  const fin = css.match(/html\.mvt \.rv\.est-la \{([^}]*)\}/)?.[1] || '';
  const px = Number(base.match(/translateY\((\d+)px\)/)?.[1]);
  t('🚨 opacité + translateY de 8 à 12 px', /opacity: 0;/.test(base) && px >= 8 && px <= 12, `${px} px`);
  const durees = [...fin.matchAll(/(\d+)ms ease-out/g)].map((m) => Number(m[1]));
  t('🚨 250 à 400 ms, ease-out', durees.length === 2 && durees.every((d) => d >= 250 && d <= 400), durees.join(', '));
  t('🚨 rien d\'autre que opacity et transform', !/clip-path|filter|scale/.test(base + fin));
  t('🚨 une seule fois par élément', /io\.unobserve\(el\)/.test(couche));
  t('🚨 déclenchée tôt (rootMargin positif sous l\'écran)', /rootMargin: "0px 0px 1\d% 0px"/.test(couche));
  t('🚨 cascade de trois éléments au plus', /const CASCADE_MAX = 3;/.test(couche) && /Math\.min\(rang, CASCADE_MAX - 1\) \* PAS_MS/.test(couche));
  t('🚨 l\'état masqué n\'existe que sous html.mvt (sans JS, tout est visible)', !/^\.rv \{/m.test(css));
  t('🚨 toutes les lectures de position avant les écritures (pas de recalcul en boucle)',
    /const mesures = candidats\.map\(\(el\) => el\.getBoundingClientRect\(\)\);/.test(couche));
}

console.log('\n--- 4. Survols et comparateur ---');
{
  t('🚨 les cartes répondent en 180 ms', /\.glow-card \{\s*transition: transform 180ms ease-out/.test(css));
  t('🚨 les boutons aussi', /a\[class\*="cta"\], button\[class\*="cta"\], \.sim-cta \{\s*transition: box-shadow 180ms ease-out, transform 180ms ease-out;/.test(css));
  // Aucune transition de plus de 400 ms ne doit subsister (hors démo des DEL).
  const longues = [...css.matchAll(/transition:[^;]*?(\d{3,4})ms/g)].map((m) => Number(m[1])).filter((d) => d > 400);
  t('🚨 aucune transition de plus de 400 ms', longues.length === 0, longues.join(', '));
  t('🚨 le comparateur suit le doigt sans rendu React par mouvement',
    /requestAnimationFrame/.test(revel) && /setProperty\("--revel-pos"/.test(revel));
  t('🚨 …et rend l\'état au relâchement (clavier, lecteurs d\'écran)', /if \(g\.v !== undefined\) setPosition\(g\.v\);/.test(revel));
  t('🚨 le diaporama des ambiances ne tourne plus seul', !/setTimeout|TENUE_MS/.test(ambiances));
  t('🚨 la bande des réalisations ne boucle plus', !/infinite/.test(css.match(/\.defile[\s\S]*?\}/)?.[0] || '') && !/defileGauche|defile--anime/.test(css) && !/clone/.test(defile));
}

console.log('\n--- 5. 🚨 prefers-reduced-motion : aucune animation ---');
{
  const fin = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
  t('🚨 garde global en fin de feuille',
    /\*, \*::before, \*::after \{[\s\S]*animation-duration: 0s !important;[\s\S]*transition-duration: 0s !important;/.test(fin));
  t('🚨 aucune apparition (la classe racine n\'est pas posée)', /if \(mouvementReduit\(\) \|\| typeof IntersectionObserver === "undefined"\) return;/.test(couche));
}

console.log('\n--- 6. 🚨 Aucune boucle, sauf la démo des DEL ---');
{
  const infinies = [...css.matchAll(/([^{}]+)\{[^{}]*animation[^{}:]*:[^{};]*infinite[^{};]*;/g)].map((m) => m[1].trim());
  // .led--* : la démo de l'éclairage permanent (/services/eclairage-
  // architectural-permanent). L'animation EST le produit montré ; elle ne
  // tourne qu'une fois qu'on a choisi un effet, et s'arrête en mouvement
  // réduit (garde global ci-dessus).
  const AUTORISEES = ['.led--twinkle', '.led--chase', '.led--breathe'];
  const intruses = infinies.filter((r) => !AUTORISEES.includes(r));
  t('🚨 aucune boucle décorative', intruses.length === 0, intruses.join(' | ') || 'aucune');
}

console.log('\n--- 7. Ce à quoi on ne touche pas ---');
{
  t('🚨 le pixel est intact', /eventID/.test(lire('lib/meta-lead-event.js')));
  t('🚨 l\'envoi vers /api/lead est intact', /fetch\("\/api\/lead"/.test(lire('components/data.js')));
  t('🚨 le bandeau de rareté est intact', /<BandeauRarete/.test(lire('app/layout.jsx')));
  t('🚨 la barre du bas reste conditionnelle', /mobile-bottom-bar\$\{visible \? " est-visible" : ""\}/.test(lire('app/ClientLayout.jsx')));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
