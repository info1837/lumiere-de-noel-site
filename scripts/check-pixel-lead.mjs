// Vérifie que les QUATRE formulaires envoient un Lead avec event_id, et
// que /merci ne compte pas une deuxième conversion.
//
//   node scripts/check-pixel-lead.mjs
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

console.log('\n--- 5. Le pixel est-il vraiment allumé ? ---');
{
  const layout = lire('app/layout.jsx');
  t('le code du pixel est bien dans le layout', /fbevents\.js/.test(layout));
  t('il est conditionné à la variable', /PIXEL_ENABLED/.test(layout));
  const id = (process.env.NEXT_PUBLIC_META_PIXEL_ID || '').trim();
  t('⚠️ NEXT_PUBLIC_META_PIXEL_ID est définie ICI', id !== '',
    id ? `id=${id}` : 'absente en local — ce qui compte est Vercel Production (voir la PR)');
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
