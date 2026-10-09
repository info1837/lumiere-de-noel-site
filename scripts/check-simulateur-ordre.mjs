// Le simulateur — on montre d'abord, on demande ensuite.
//
//   node scripts/check-simulateur-ordre.mjs
//
// Ce fichier garde quatre décisions qui ont chacune coûté une discussion :
//
//   1. L'imagerie ne vient JAMAIS de Street View. Les conditions de Google
//      Maps Platform §3.2.3(a) interdisent de réhéberger son imagerie hors
//      de ses services et §3.2.3(c) d'en dériver du contenu — une façade
//      passée dans un générateur d'images est du contenu dérivé. Un
//      concurrent le fait ; ça ne nous autorise pas.
//   2. Le parcours ouvre sur l'ADRESSE, pas sur un formulaire. Les
//      coordonnées arrivent à l'écran 4, derrière le résultat flouté.
//   3. La clé Google de l'autocomplétion reste au SERVEUR.
//   4. La génération est plafonnée et mise en cache, et le cache est borné
//      à la personne — sinon on servirait la simulation du voisin.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
// ⚠️ Les commentaires CITENT les interdits pour expliquer pourquoi ils le
// sont. Les comparer comme du code ferait échouer le test sur sa propre
// documentation — le piège est déjà tombé trois fois dans ce dépôt.
const sansCommentaires = (x) => x
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const sim = lire('app/simulateur/Simulateur.jsx');
const simCode = sansCommentaires(sim);
const route = lire('app/api/simulateur/route.js');
const routeCode = sansCommentaires(route);
const adresse = lire('app/api/adresse/route.js');
const adresseCode = sansCommentaires(adresse);

console.log('\n--- 1. 🚨 AUCUNE imagerie Google, nulle part ---');
{
  // Le dépôt ENTIER, pas les trois fichiers auxquels on pense : c'est la
  // leçon de check-hero.mjs, où la liste écrite à la main avait raté le
  // fichier qui contenait le pire cas.
  const marcher = (d, acc = []) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (['node_modules', '.next', '.git'].includes(e.name)) continue;
      const q = path.join(d, e.name);
      if (e.isDirectory()) marcher(q, acc);
      else if (/\.(jsx?|mjs)$/.test(e.name)) acc.push(q);
    }
    return acc;
  };
  const tous = ['app', 'components', 'lib'].flatMap((d) => marcher(path.join(ROOT, d)));
  const coupables = tous.filter((f) => {
    const s = sansCommentaires(fs.readFileSync(f, 'utf8'));
    return /streetview|street_view|pano(rama)?id|maps\/api\/streetview/i.test(s);
  });
  t('🚨 aucun appel à Street View dans tout le dépôt', coupables.length === 0,
    coupables.map((f) => path.relative(ROOT, f)).join(' '));
  t('🚨 la seule entrée d\'image est un <input type="file">',
    /type="file"/.test(lire('app/simulateur/EtapePhoto.jsx')));
  t('🚨 la note légale est toujours en tête du composant',
    /JAMAIS DE STREET VIEW/.test(sim) && /3\.2\.3/.test(sim));
}

console.log('\n--- 2. 🚨 L\'ordre : montrer, puis demander ---');
{
  // L'écran 1 ne contient QUE l'adresse. Le test regarde la position des
  // champs dans le fichier : le prénom et le téléphone doivent apparaître
  // APRÈS le choix du style et après la génération.
  t('🚨 l\'écran 1 porte l\'adresse', /etape === 1 &&[\s\S]{0,400}AdresseAutocomplete/.test(simCode));
  t('🚨 …et AUCUN champ de coordonnées',
    !/etape === 1 &&[\s\S]{0,700}sim-nom/.test(simCode));
  t('🚨 le prénom et le téléphone sont à l\'écran 4',
    /etape === 4 &&[\s\S]{0,2600}id="sim-nom"/.test(simCode)
    && /etape === 4 &&[\s\S]{0,2800}id="sim-tel"/.test(simCode));
  t('🚨 le résultat flouté arrive AVANT les champs',
    simCode.indexOf('sim-teaser') < simCode.indexOf('id="sim-nom"'));
  t('🚨 l\'écran 1 le promet noir sur blanc',
    /Aucun numéro de téléphone pour l(&apos;|')instant/.test(simCode));
  t('🚨 quatre points, sans noms d\'étape',
    /className="sim-points"/.test(simCode) && !/sim-fil/.test(simCode)
    && !/\["Vous", "Photo", "Style", "Résultat"\]/.test(simCode));
}

console.log('\n--- 3. 🚨 Quatre styles, et le contrat du CRM est respecté ---');
{
  const styles = simCode.match(/\{ cle: "/g) || [];
  t('🚨 exactement quatre styles', styles.length === 4, `${styles.length}`);
  // ⚠️ `style` ne peut prendre que des valeurs que le CRM connaît. Inventer
  // « toiture_arbres » aurait donné une génération au hasard : « Toiture +
  // arbres », c'est le blanc chaud AVEC les arbres allumés.
  const connues = ['chaud', 'froid', 'multi'];
  const envoyees = [...simCode.matchAll(/style: "([a-z_]+)"/g)].map((m) => m[1]);
  t('🚨 aucune valeur de style inconnue du CRM',
    envoyees.every((v) => connues.includes(v)), envoyees.join(' '));
  t('🚨 « Toiture + arbres » passe par `arbres`, pas par un style inventé',
    /titre: "Toiture \+ arbres",\s*detail: "[^"]*",\s*style: "chaud",\s*arbres: true/.test(simCode));
  t('les échantillons montrent la couleur', /teintes:/.test(simCode) && /className="sim-swatch"/.test(simCode));
}

console.log('\n--- 4. 🚨 La guirlande, six ampoules ---');
{
  t('🚨 six ampoules', /const AMPOULES = 6;/.test(simCode));
  t('🚨 elles s\'allument une par une', /setAllumees\(\(n\) => \(n \+ 1\)/.test(simCode));
  t('🚨 en ambre', /\.sim-guirlande span\.allumee \{[\s\S]{0,120}background: #F0BA54;/.test(lire('app/globals.css')));
  // Aucune animation imposée à qui la refuse (règle du dépôt :
  // scripts/check-rien-ne-boucle.mjs et check-animations.mjs).
  t('🚨 …sauf si le visiteur refuse le mouvement',
    /prefers-reduced-motion: reduce[\s\S]{0,120}setAllumees\(AMPOULES\)/.test(simCode));
}

console.log('\n--- 5. 🚨 Le consentement, et le lead qui ne se perd pas ---');
{
  t('🚨 la case Loi 25 est là', /<CaseConsentement id="sim-consent"/.test(simCode));
  t('🚨 décochée par défaut', /consent: false/.test(simCode));
  t('🚨 et OBLIGATOIRE — l\'envoi s\'arrête sans elle',
    /if \(!coord\.consent\) \{ setErreur/.test(simCode));
  t('🚨 une trace horodatée part avec le lead',
    /consentement: `accordé le \$\{new Date\(\)\.toISOString\(\)\.slice\(0, 10\)\} via le simulateur`/.test(simCode));
  // ⚠️ UN SEUL CHEMIN pour les leads : /api/lead, qui relaie au CRM avec la
  // clé d'intake. C'est le CRM qui déclenche le courriel à Yahir ET le SMS
  // de Sophie B. Un second chemin serait un endroit de plus où un lead
  // peut disparaître.
  t('🚨 le lead passe par le MÊME envoi que /soumission',
    /sendLeadEtRendreId/.test(simCode) && /fetch\("\/api\/lead"/.test(lire('components/data.js')));
  t('🚨 les UTM voyagent avec lui', /utm: lireUtm\(\)/.test(lire('components/data.js')));
  t('🚨 le pixel reçoit son event_id', /newLeadEventId\(\)/.test(simCode) && /trackLead\(eventId\)/.test(simCode));
}

console.log('\n--- 6. 🚨 Les six événements de mesure ---');
{
  const attendus = ['sim_start', 'sim_address', 'sim_style', 'sim_generated', 'sim_lead', 'sim_reserve_click'];
  for (const e of attendus) {
    t(`🚨 ${e}`, new RegExp(`evenement\\("${e}"`).test(simCode));
  }
  // `evenement()` parle aux trois surfaces et n'échoue jamais.
  t('ils passent par lib/evenements.js', /from "@\/lib\/evenements"/.test(sim));
}

console.log('\n--- 7. 🚨 La clé Google reste au serveur ---');
{
  t('🚨 la route lit une clé SANS NEXT_PUBLIC_',
    /process\.env\.GOOGLE_MAPS_KEY/.test(adresseCode) && !/NEXT_PUBLIC_/.test(adresseCode));
  t('🚨 le composant ne connaît aucune clé',
    !/process\.env/.test(sansCommentaires(lire('components/AdresseAutocomplete.jsx'))));
  t('🚨 le Québec seulement', /includedRegionCodes: \['ca'\]/.test(adresseCode)
    && /,\\s\*QC\\b/.test(adresse));
  // ⚠️ SANS CLÉ, LE CHAMP RESTE UN CHAMP. C'est la leçon de
  // LUMIERE_INTAKE_KEY en préversion : une variable absente avait fait
  // passer la calculatrice pour brisée.
  t('🚨 sans clé, aucune erreur — juste zéro suggestion',
    /raison: 'sans_cle'/.test(adresseCode) && /ok: true, suggestions: \[\]/.test(adresseCode));
}

console.log('\n--- 8. 🚨 Le plafond et le cache ---');
{
  t('🚨 trois générations par jour', /const PAR_JOUR = 3;/.test(routeCode));
  t('🚨 comptées par IP', /function ipDe\(request\)/.test(routeCode) && /x-forwarded-for/.test(routeCode));
  t('🚨 une génération ratée ne consomme pas une place', /rembourser\(ip\)/.test(routeCode));
  // ⚠️ L'IP FAIT PARTIE DE LA CLÉ DE CACHE, et ce n'est pas du zèle : la
  // réponse contient le `jeton` qui ouvre les images de la fiche. Cacher
  // sur « adresse + style » seuls servirait au visiteur B la simulation de
  // son voisin A.
  t('🚨 le cache est borné à la personne', /function cleDe\(ip, c\)/.test(routeCode)
    && /\[\s*ip,/.test(routeCode));
  t('🚨 …et la photo entre dans la clé', /createHash\('sha256'\)/.test(routeCode));
  t('🚨 le cache répond AVANT le plafond — une image déjà payée est gratuite',
    routeCode.indexOf('cache.get(cleCache)') < routeCode.indexOf('if (trop(ip))'));
  t('la clé d\'intake ne sort jamais du serveur',
    !/INTAKE_KEY/.test(simCode) && /process\.env\.LUMIERE_INTAKE_KEY/.test(routeCode));
}

console.log('\n--- 9. 🚨 Le titre n\'ajoute plus la marque deux fois ---');
{
  // Le gabarit de app/layout.jsx ajoute « | Solution Lumière de Noël » à
  // tout titre non absolu. Une page qui l'écrit AUSSI le fait apparaître
  // deux fois.
  const marcher = (d, acc = []) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const q = path.join(d, e.name);
      if (e.isDirectory()) marcher(q, acc);
      else if (e.name === 'page.jsx') acc.push(q);
    }
    return acc;
  };
  const pages = marcher(path.join(ROOT, 'app'));
  const fautifs = pages.filter((f) => {
    const s = fs.readFileSync(f, 'utf8');
    // Le `title:` à la racine des métadonnées : deux espaces d'indentation.
    const m = s.match(/^ {2}title: "([^"]*)"/m);
    return m && /Solution Lumière de Noël/.test(m[1]);
  });
  t('🚨 aucune page ne réécrit la marque dans son titre', fautifs.length === 0,
    fautifs.map((f) => path.relative(ROOT, f)).join(' '));
  t('le gabarit l\'ajoute une fois', /template: `%s \| \$\{company\.titleSuffix\}`/.test(lire('app/layout.jsx')));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
