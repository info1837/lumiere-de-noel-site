// La barre du bas ne squatte plus le premier écran.
//
//   node scripts/check-barre-du-bas.mjs
//
// Elle était fixée en bas, en permanence, sur toutes les pages. Au premier
// écran elle doublait le bouton du hero : « Réserver ma date » deux fois sur
// la même image, à 300 px d'écart. Elle ne sert que lorsque le visiteur n'a
// plus aucune porte sous les yeux.
//
// Le comportement complet se vérifie en navigateur (voir la PR) ; ce harnais
// tient le câblage : sans ancre marquée, l'observateur n'observe rien et la
// barre resterait cachée pour toujours — silencieusement.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const layout = lire('app/ClientLayout.jsx');
// NavBar, plus haut dans le même fichier, a son propre écouteur de défilement
// (l'entête qui rétrécit). On ne lit que la barre.
const barre = layout.slice(layout.indexOf('export function MobileBottomBar'));
const css = lire('app/globals.css');
const hero = lire('components/Hero.jsx');
const quote = lire('components/QuoteForm.jsx');

console.log('\n--- 1. 🚨 La barre est conditionnelle, pas permanente ---');
{
  t('🚨 elle porte un état', /const \[visible, setVisible\] = useState\(false\)/.test(layout));
  t('🚨 elle démarre CACHÉE', /useState\(false\)/.test(layout));
  t('🚨 la classe suit l\'état', /mobile-bottom-bar\$\{visible \? " est-visible" : ""\}/.test(layout));
  t('🚨 cachée, elle est aussi cachée des lecteurs d\'écran',
    /aria-hidden=\{visible \? undefined : "true"\}/.test(layout));
  t('🚨 …et sort de l\'ordre de tabulation',
    (layout.match(/tabIndex=\{visible \? undefined : -1\}/g) || []).length === 2);
}

console.log('\n--- 2. 🚨 Un IntersectionObserver, pas un écouteur de défilement ---');
{
  t('🚨 c\'est un IntersectionObserver', /new IntersectionObserver\(/.test(layout));
  t('🚨 il observe les ancres ET les masques',
    /querySelectorAll\("\[data-barre-ancre\], \[data-barre-masque\]"\)/.test(layout));
  t('🚨 il COMPTE les cibles vues, il ne prend pas la dernière entrée',
    /const vues = new Set\(\)/.test(layout) && /setVisible\(vues\.size === 0\)/.test(layout));
  t('🚨 il est débranché au démontage', /return \(\) => io\.disconnect\(\)/.test(layout));
  t('il se rejoue au changement de page', /\}, \[pathname\]\)/.test(layout));
  t('aucun écouteur de défilement dans la barre',
    !/addEventListener\(["']scroll["']/.test(barre));
}

console.log('\n--- 3. 🚨 Les ancres existent VRAIMENT ---');
{
  // Sans ces marqueurs l'observateur n'observe rien : la barre resterait
  // cachée sur tout le site, sans une seule erreur.
  t('🚨 le bouton du hero est une ancre', /data-barre-ancre/.test(hero));
  t('🚨 le repère de haut de page existe (pages sans hero)',
    /data-barre-ancre[\s\S]{0,220}height: "55vh"/.test(layout));
  // ⚠️ LE HERO N'A PLUS DE FORMULAIRE À FAIRE TAIRE.
  //
  // Il n'y a donc plus de marqueur `data-barre-masque` dans le hero — mais
  // le principe tient ailleurs : proposer « Réserver ma date » dans la
  // barre du bas à quelqu'un qui remplit déjà le formulaire, c'est lui
  // demander de recommencer. C'est QuoteForm qui porte le marqueur, et
  // c'est lui que l'accueil rend en section 8.
  t('🚨 le formulaire de l\'accueil fait taire la barre — via QuoteForm',
    /data-barre-masque/.test(quote) && /<QuoteForm/.test(lire('app/page.jsx')));
  t('🚨 le simulateur aussi, à chacun de ses écrans de saisie',
    (lire('app/simulateur/Simulateur.jsx').match(/data-barre-masque/g) || []).length >= 2);
  t('🚨 le formulaire complet aussi (/soumission)',
    /<form onSubmit=\{submit\} noValidate data-barre-masque/.test(quote));
}

console.log('\n--- 4. 🚨 Le glissement, et son absence ---');
{
  t('🚨 elle attend hors écran', /\.mobile-bottom-bar \{[\s\S]{0,400}transform: translateY\(96px\)/.test(css));
  t('🚨 …invisible et intouchable', /\.mobile-bottom-bar \{[\s\S]{0,460}pointer-events: none/.test(css));
  t('🚨 elle glisse doucement (340 ms)', /transition: transform 340ms/.test(css));
  t('🚨 visible, elle redescend à sa place',
    /\.mobile-bottom-bar\.est-visible \{[\s\S]{0,160}transform: translateY\(0\)[\s\S]{0,160}pointer-events: auto/.test(css));
  t('🚨 aucune glissade sous prefers-reduced-motion',
    /@media \(prefers-reduced-motion: reduce\) \{\s*\.mobile-bottom-bar \{ transition: none/.test(css));
  t('elle reste absente du bureau', /@media \(min-width: 1024px\) \{\s*\.mobile-bottom-bar \{ display: none/.test(css));
}

console.log('\n--- 5. Ce à quoi on ne touche pas ---');
{
  t('🚨 le pixel est intact', /eventID/.test(lire('lib/meta-lead-event.js')));
  t('🚨 l\'envoi vers /api/lead est intact', /fetch\("\/api\/lead"/.test(lire('components/data.js')));
  t('🚨 le bandeau de rareté est intact', /<BandeauRarete/.test(lire('app/layout.jsx')));
  t('les deux liens de la barre sont toujours là',
    /className="bottom-bar-call"/.test(layout) && /className="bottom-bar-quote"/.test(layout));
  t('le numéro est toujours le bon', /company\.phoneHref/.test(layout));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
