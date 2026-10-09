// Le formulaire — « Réservez votre date », et rien d'autre ne bouge.
//
//   node scripts/check-formulaire.mjs
//
// Le bloc le plus court de la refonte, et le plus risqué : c'est le seul
// endroit où le visiteur nous donne quelque chose. Le pixel, l'event_id, le
// consentement et l'envoi vers /api/lead ne doivent PAS changer d'un
// caractère — le harnais les épingle.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };
const lire = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const sansCommentaires = (x) => x
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const SOUS_TITRE = 'Nous confirmons votre place et votre prix après une courte consultation.';

console.log('\n--- 1. 🚨 Titre et sous-titre, aux trois endroits ---');
{
  // ⚠️ LE HERO N'EST PLUS DANS CETTE LISTE.
  //
  // Il portait une carte de réservation à cinq champs au premier écran.
  // Elle est descendue en section 8 de l'accueil : un service haut de
  // gamme ne demande pas un numéro avant d'avoir montré une maison
  // illuminée. Le titre et le sous-titre, eux, n'ont pas changé d'un mot —
  // ils sont juste 1 800 px plus bas.
  const endroits = [
    ['la bande de l\'accueil', 'app/page.jsx'],
    ['la page /soumission', 'app/soumission/page.jsx'],
  ];
  for (const [quoi, f] of endroits) {
    const s = sansCommentaires(lire(f));
    t(`🚨 ${quoi} dit « Réservez votre date »`, /Réservez votre date/.test(s));
    t(`🚨 ${quoi} dit le sous-titre exact`, s.includes(SOUS_TITRE), quoi);
  }
  t('🚨 plus de « Demande de soumission » en étiquette',
    !/<SectionTag>Demande de soumission<\/SectionTag>/.test(lire('app/page.jsx')));
  t('🚨 plus de « Demander ma soumission » en bouton',
    !/Demander ma soumission/.test(sansCommentaires(lire('app/page.jsx'))));
}

console.log('\n--- 2. 🚨 Les champs n\'ont PAS changé ---');
{
  const form = lire('components/QuoteForm.jsx');
  // Les noms des champs voyagent jusqu'au CRM : en renommer un casserait
  // l'intake sans aucune erreur visible côté visiteur.
  for (const champ of ['nom', 'telephone', 'courriel', 'adresse']) {
    t(`le champ « ${champ} » existe toujours`, new RegExp(`\\b${champ}\\b`).test(form), champ);
  }
  t('le honeypot est intact', /HONEYPOT_FIELD|_website/.test(form + lire('components/data.js')));
  t('🚨 les champs obligatoires le restent', /required/.test(form));
}

console.log('\n--- 3. 🚨 Le consentement n\'a PAS changé ---');
{
  const form = lire('components/QuoteForm.jsx');
  t('🚨 il est toujours enregistré avec sa date',
    /consentement: `accordé le \$\{new Date\(\)\.toISOString\(\)\.slice\(0, 10\)\} via \$\{source\}`/.test(form));
  t('🚨 le composant de consentement est toujours monté',
    /ConsentementAttribution/.test(form) || fs.existsSync(path.join(ROOT, 'components/ConsentementAttribution.jsx')));
  t('le petit texte « gratuite et sans obligation » reste sous le bouton',
    /gratuite et sans obligation/.test(form));
}

console.log('\n--- 4. 🚨 Le pixel et l\'event_id n\'ont PAS changé ---');
{
  const pixel = lire('lib/meta-lead-event.js');
  t('🚨 fbq track Lead', /fbq\(/.test(pixel) && /['"]Lead['"]/.test(pixel));
  t('🚨 l\'eventID du navigateur', /eventID/.test(pixel));
  t('🚨 l\'event_id envoyé au serveur (dédoublonnage CAPI)', /event_id/.test(pixel));
  t('le formulaire l\'appelle toujours', /trackLead|meta_pixel/.test(lire('components/QuoteForm.jsx') + lire('components/data.js')));
}

console.log('\n--- 5. 🚨 L\'envoi vers /api/lead n\'a PAS changé ---');
{
  const data = lire('components/data.js');
  t('🚨 le fetch vers /api/lead', /fetch\("\/api\/lead", \{/.test(data));
  t('🚨 en POST, en JSON', /method: "POST"[\s\S]{0,120}application\/json/.test(data));
  const route = lire('app/api/lead/route.js');
  // ⚠️ L'URL N'EST PLUS ÉCRITE D'UN SEUL TENANT, et c'est voulu.
  //
  // La route la compose : `CRM_BASE_URL` (surchargeable, pour tester une
  // préversion du CRM) + `/api/leads`. Le littéral
  // « palencia-crm.vercel.app/api/leads » n'existe donc plus nulle part,
  // et cette assertion échouait sur du code parfaitement intact depuis
  // que la surcharge existe.
  //
  // On vérifie maintenant les DEUX moitiés plus le défaut : c'est ça,
  // « la route relaie au CRM », et ça reste faux si quelqu'un change
  // d'hôte ou de chemin.
  t('🚨 la route relaie au CRM — hôte par défaut',
    /CRM_BASE_URL \|\| 'https:\/\/palencia-crm\.vercel\.app'/.test(route));
  t('🚨 …et le chemin /api/leads', /\$\{CRM_BASE\}\/api\/leads/.test(route));
  t('…via une seule constante', /fetch\(CRM_INTAKE_URL/.test(route));
  t('🚨 la clé d\'intake reste côté serveur', /LUMIERE_INTAKE_KEY/.test(route));
  t('aucune clé dans le code du navigateur', !/INTAKE_KEY/.test(data + lire('components/QuoteForm.jsx')));
}

console.log('\n--- 6. Un seul formulaire par page ---');
{
  const accueil = sansCommentaires(lire('app/page.jsx'));
  // ⚠️ L'ACCUEIL PORTE MAINTENANT LE FORMULAIRE, ET UN SEUL.
  //
  // Avant : zéro ici, parce que le hero l'avait. Maintenant : exactement un,
  // en bas de page. Zéro serait une régression (plus aucun envoi depuis
  // l'accueil), deux seraient l'ancien défaut — deux formulaires ne
  // doublent pas les leads, ils partagent l'attention.
  t('🚨 l\'accueil a UN formulaire, en bas', (accueil.match(/<QuoteForm/g) || []).length === 1);
  t('🚨 …et il est après la preuve, pas avant',
    accueil.indexOf('<QuoteForm') > accueil.indexOf('RevelationLumiere'));
  const soum = sansCommentaires(lire('app/soumission/page.jsx'));
  t('/soumission n\'en a qu\'un', (soum.match(/<QuoteForm/g) || []).length === 1);
  // ⚠️ Ne PAS épingler la ligne entière : elle porte maintenant aussi
  // `serviceInitial`, et l'assertion échouait sur du code correct. On
  // vérifie ce qui compte — que la source voyage — pas la forme exacte
  // de la balise.
  // `sourceFinale` distingue une arrivée depuis /simulateur (fiche
  // préremplie) d'une arrivée directe ; la liste d'attente passe toujours
  // par `sourceFormulaire`, qui l'alimente.
  t('🚨 et il porte sa source (liste d\'attente comprise)',
    /<QuoteForm source=\{sourceFinale\}/.test(soum) && /sourceFormulaire/.test(soum));
  t('🚨 …et le service présélectionné, quand il y en a un', /serviceInitial=\{serviceInitial\}/.test(soum));
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
