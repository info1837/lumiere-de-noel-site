// Vérifie que les QUATRE formulaires envoient un Lead avec event_id, que
// /merci ne compte pas une deuxième conversion, et qu'un SEUL pixel Meta
// vit sur ce site : celui qui est partagé avec Palencia.
//
//   node scripts/check-pixel-lead.mjs
//
// Cette garde tourne APRÈS `next build` (voir package.json) : c'est ce qui
// lui permet de relire la sortie de build au lieu de la deviner.
//
// Le 2026-09-28, sur lumieredenoelinc.com :
//   - le pixel était CODÉ mais mort en production
//     (NEXT_PUBLIC_META_PIXEL_ID absente de Vercel → PIXEL_ENABLED=false),
//     donc les fbq('track','Lead') tapaient dans le vide ;
//   - aucun formulaire ne passait d'event_id → aucune déduplication
//     possible avec l'API Conversions ;
//   - la calculatrice ne tirait AUCUN Lead ;
//   - /merci tirait un Lead nu à chaque chargement, donc une deuxième
//     conversion par soumission et une de plus à chaque rechargement.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (f) => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch { return ''; } };

// Parcours de dossier, sans dépendance : rend les chemins des fichiers que
// `garder` accepte, en sautant les dossiers nommés dans `ignorer`.
function* fichiersDe(dir, garder, ignorer = new Set()) {
  let entrees;
  try { entrees = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entrees) {
    if (ignorer.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* fichiersDe(p, garder, ignorer);
    else if (garder(e.name)) yield p;
  }
}

// ⚠️ LE HERO N'A PLUS DE FORMULAIRE — il est descendu en section 8 de
// l'accueil, où c'est le MÊME QuoteForm que /soumission qui le rend. Son
// câblage de pixel est donc vérifié par la ligne QuoteForm ci-dessous, et
// non plus par une ligne à lui. Le simulateur, lui, ENTRE dans la liste :
// il crée désormais la fiche à l'écran 4, donc il tire un Lead.
const FORMULAIRES = [
  ['components/QuoteForm.jsx', 'soumission (complet)'],
  ['app/simulateur/Simulateur.jsx', 'simulateur'],
  ['components/RenewalForm.jsx', 'renouvellement'],
  ['components/CalculatriceToiture.jsx', 'calculatrice toiture'],
];

console.log('\n--- 1. 🚨 Les quatre formulaires tirent un Lead AVEC event_id ---');
for (const [f, nom] of FORMULAIRES) {
  const s = lire(f);
  const aId = /newLeadEventId\(\)/.test(s);
  const aTrack = /trackLead\(eventId\)/.test(s);
  // Les formulaires qui REDIRIGENT doivent attendre : sans await, la
  // navigation coupe la requete du pixel avant qu'elle parte.
  const redirige = /window\.location\.assign/.test(s);
  const attend = !redirige || /await trackLead\(eventId\)/.test(s) && /await laisserPartir\(\)/.test(s);
  const aBloc = /metaPixelBlock\(eventId\)/.test(s);
  const fbqNu = /fbq\("track",\s*"Lead"\)|fbq\('track',\s*'Lead'\)/.test(s);
  t(nom.padEnd(26), aId && aTrack && aBloc && !fbqNu && attend,
    `event_id=${aId} track=${aTrack} bloc=${aBloc} attend=${attend}${fbqNu ? ' · ⚠️ fbq NU' : ''}`);
}

console.log('\n--- 2. 🚨 /merci ne compte pas une deuxième conversion ---');
{
  const s = lire('app/merci/page.jsx');
  t('elle lit ?eid dans l\'URL', /URLSearchParams\([^)]*\)\.get\('eid'\)/.test(s));
  t('🚨 elle rejoue avec eventID, pas un Lead nu', /fbq\('track', 'Lead', \{\}, \{ eventID: eid \}\)/.test(s));
  // Le pixel s'initialise en afterInteractive, comme ce script : sans
  // attente, il partait AVANT que fbq existe et la garde le sautait.
  t('🚨 elle ATTEND que fbq soit chargé', /setInterval/.test(s) && /typeof window\.fbq === 'function'/.test(s));
  // Le rejeu est enferme dans `if (eid)` : pas d'eid (visite directe,
  // lien partage), aucun Lead. Un Lead sans soumission est un chiffre
  // invente.
  t('🚨 sans eid, elle ne compte RIEN', /if \(eid\) \{/.test(s),
    /fbq\('track', 'Lead'\)/.test(s) ? '⚠️ un Lead nu subsiste' : '');
}

console.log('\n--- 3. Le bloc arrive jusqu\'au CRM ---');
{
  const lead = lire('app/api/lead/route.js');
  const calc = lire('app/api/calc-noel/route.js');
  t('/api/lead relaie meta_pixel', /meta_pixel: body\.meta_pixel/.test(lead));
  t('/api/calc-noel relaie meta_pixel', /meta_pixel: body\.meta_pixel/.test(calc));
  // On regarde le CODE, pas les commentaires : un commentaire qui nomme
  // _fbp n'est pas une fabrication cote serveur.
  const sansCommentaires = (x) => String(x).replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const fabrique = (x) => /document\.cookie|newLeadEventId\(|_fbp\s*[:=]|_fbc\s*[:=]/.test(sansCommentaires(x));
  t('aucune des deux ne le fabrique côté serveur',
    !fabrique(lead) && !fabrique(calc),
    'les cookies n\'existent que dans le navigateur du visiteur');
}

console.log('\n--- 4. Le module fait ce qu\'il annonce ---');
{
  const m = await import(path.join(ROOT, 'lib/meta-lead-event.js'));
  const a = m.newLeadEventId(), b = m.newLeadEventId();
  t('newLeadEventId rend un id non vide', typeof a === 'string' && a.length > 8, a);
  t('🚨 et un id DIFFÉRENT à chaque appel', a !== b);
  const bloc = m.metaPixelBlock(a);
  t('le bloc porte event_id et event_time', bloc.event_id === a && Number.isFinite(bloc.event_time));
  t('merciUrl transporte l\'eid', m.merciUrl('', a).includes(`eid=${encodeURIComponent(a)}`), m.merciUrl('', a));
  // trackLead sans fbq ne doit jamais lever : le pixel peut être bloqué.
  let leve = false;
  let rendu = null;
  try { rendu = await m.trackLead(a, {}, 300); } catch { leve = true; }
  t('trackLead ne lève pas quand le pixel est absent', !leve);
  t('🚨 et il rend false après avoir attendu, au lieu de mentir', rendu === false, `rendu=${rendu}`);
  t('laisserPartir existe pour les redirections', typeof m.laisserPartir === 'function');
}

// ════════════════════════════════════════════════════════════════════════
// ⚠️ UN SEUL PIXEL, PARTAGÉ AVEC PALENCIA. C'EST UNE DÉCISION, PAS UN BOGUE.
//
// Décision du 2026-09-28 : un SEUL pixel Meta, 961485159955231, sert à la
// fois Multiservices Palencia et Solution Lumière de Noël. La séparation
// des deux entreprises ne se fait pas par deux pixels — elle se fait DANS
// Meta, par deux conversions personnalisées :
//
//     « Lead Lumière »   1628133445697419   (URL contient lumieredenoelinc.com)
//     « Lead Palencia »  38658775160436170
//
// L'API Conversions de Lumière (CRM #203) poste sur CE MÊME pixel : c'est
// ce qui permet à l'événement navigateur et à l'événement serveur de se
// dédupliquer sur event_id.
//
// Conséquence : un deuxième pixel sur ce site ne « séparerait » rien du
// tout. Il couperait les données en deux et désarmerait les deux
// conversions personnalisées d'un seul coup, sans que rien n'ait l'air
// cassé. D'où cette garde : le build de production ÉCHOUE s'il initialise
// autre chose que ce pixel-là.
// ════════════════════════════════════════════════════════════════════════
const PIXEL_PARTAGE = '961485159955231';
const CONVERSIONS = ['1628133445697419', '38658775160436170'];

console.log('\n--- 5. Un seul pixel, et c\'est le pixel partagé ---');
{
  const layout = lire('app/layout.jsx');
  t('le code du pixel est bien dans le layout', /fbevents\.js/.test(layout));
  t('il est conditionné à la variable', /PIXEL_ENABLED/.test(layout));
  // L'id vient de l'environnement et n'est PAS écrit dans le composant :
  // écrit en dur, il suivrait le dépôt d'un environnement à l'autre, y
  // compris dans les préproductions où l'on ne veut pas de conversions.
  // C'est la garde, ici, qui dit lequel est le bon.
  t('🚨 aucun identifiant de pixel écrit en dur dans le layout',
    !/fbq\('init','\d{10,}'\)/.test(layout) && /process\.env\.NEXT_PUBLIC_META_PIXEL_ID/.test(layout));
  t('la variable est documentée', /NEXT_PUBLIC_META_PIXEL_ID/.test(lire('.env.example')));

  // (a) CE QUE LE BUILD S'APPRÊTE À INITIALISER — la variable.
  //
  // En production Vercel elle doit être là ET valoir le pixel partagé :
  // absente, le pixel meurt en silence — c'est exactement ce qui s'était
  // passé avant le 2026-09-28 ; fausse, les deux conversions
  // personnalisées ne voient plus rien passer. Hors production, une
  // variable absente est normale (les secrets locaux sont des bouchons),
  // mais une variable PRÉSENTE et fausse reste une erreur.
  const id = (process.env.NEXT_PUBLIC_META_PIXEL_ID || '').trim();
  const enProd = process.env.VERCEL_ENV === 'production';
  if (enProd) {
    t('🚨 production : la variable porte le pixel partagé', id === PIXEL_PARTAGE,
      id ? `lue : ${id}` : 'ABSENTE — le pixel serait mort, comme avant le 2026-09-28');
  } else if (id) {
    t('🚨 la variable lue porte le pixel partagé', id === PIXEL_PARTAGE, `lue : ${id}`);
  } else {
    console.log('  ℹ️  NEXT_PUBLIC_META_PIXEL_ID absente de CET environnement' +
                ' (normal hors Vercel) — rien à vérifier côté variable.');
  }

  // (b) CE QUE LE BUILD A VRAIMENT ÉMIS — la sortie de build.
  //
  // La seule lecture littérale de « ce que le build de production
  // initialise » : on relit les fichiers émis et on y cherche chaque
  // fbq('init', …) et chaque facebook.com/tr?id=…. Un build local sans la
  // variable n'en contient aucun, et c'est normal — on ne fait échouer
  // que sur un identifiant ÉTRANGER, jamais sur une absence.
  const INIT = /fbq\(\s*["'`]init["'`]\s*,\s*["'`](\d{6,20})["'`]/g;
  const TR = /facebook\.com\/tr\?id=(\d{6,20})/g;
  const emis = [];
  const garderJs = (n) => /\.(js|mjs|cjs|html|txt|rsc)$/.test(n);
  for (const f of fichiersDe(path.join(ROOT, '.next'), garderJs, new Set(['cache']))) {
    let s;
    try {
      if (fs.statSync(f).size > 8 * 1024 * 1024) continue;
      s = fs.readFileSync(f, 'utf8');
    } catch { continue; }
    for (const re of [INIT, TR]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(s))) emis.push({ id: m[1], fichier: path.relative(ROOT, f) });
    }
  }
  if (emis.length === 0) {
    console.log('  ℹ️  la sortie de build n\'initialise aucun pixel' +
                ' (build sans la variable, ou .next absent) — rien à relire.');
  } else {
    const intrus = emis.filter((x) => x.id !== PIXEL_PARTAGE);
    // Un identifiant se retrouve dans CHAQUE page prérendue — 256 fois sur
    // ce site. On regroupe par identifiant : une ligne illisible dans un
    // journal de build Vercel ne sert personne.
    const parId = new Map();
    for (const x of intrus) {
      if (!parId.has(x.id)) parId.set(x.id, { n: 0, ou: x.fichier });
      parId.get(x.id).n++;
    }
    t('🚨 la sortie de build n\'initialise QUE le pixel partagé', intrus.length === 0,
      intrus.length
        ? [...parId].map(([id, v]) => `${id} — ${v.n}× (ex. ${v.ou})`).join(' · ')
        : `${emis.length} occurrence(s), toutes ${PIXEL_PARTAGE}`);
  }
}

console.log('\n--- 6. Aucun autre identifiant Meta ne traîne dans le dépôt ---');
{
  // Un identifiant Meta oublié dans un commentaire, un .env.example ou une
  // note de passation finit tôt ou tard recopié dans Vercel par quelqu'un
  // de pressé. Deux l'ont déjà été ici : le pixel du sous-domaine orphelin
  // formulaire.lumieredenoelinc.ca, et un pixel vide créé par erreur.
  //
  // Ils ne sont VOLONTAIREMENT pas nommés dans ce fichier : les écrire ici
  // pour les interdire les ferait rentrer dans le dépôt par la porte de la
  // garde elle-même. La règle est donc générale — à part le pixel partagé
  // et les deux conversions personnalisées, aucun nombre de 14 à 18
  // chiffres n'a le droit d'exister dans le code.
  const AUTORISES = new Set([PIXEL_PARTAGE, ...CONVERSIONS]);
  const EXT = /\.(js|jsx|ts|tsx|mjs|cjs|json|md|css|txt|ya?ml|example|html)$/;
  const garderTexte = (n) => n !== 'package-lock.json' && (EXT.test(n) || n.startsWith('.env'));
  const IGNORER = new Set(['node_modules', '.next', '.git', '.vercel', '.audit-visuel', 'coverage']);
  const intrus = [];
  for (const f of fichiersDe(ROOT, garderTexte, IGNORER)) {
    let s;
    try {
      if (fs.statSync(f).size > 4 * 1024 * 1024) continue;
      s = fs.readFileSync(f, 'utf8');
    } catch { continue; }
    const lignes = s.split('\n');
    for (let i = 0; i < lignes.length; i++) {
      for (const m of lignes[i].matchAll(/\d{14,18}/g)) {
        if (!AUTORISES.has(m[0])) intrus.push(`${path.relative(ROOT, f)}:${i + 1} → ${m[0]}`);
      }
    }
  }
  t('🚨 aucun identifiant Meta étranger dans les fichiers texte', intrus.length === 0,
    intrus.length ? intrus.slice(0, 6).join(' · ') : 'pixel partagé + 2 conversions, rien d\'autre');
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
