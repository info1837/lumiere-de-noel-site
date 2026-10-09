// Le lead du simulateur arrive au CRM — entier, et par un seul chemin.
//
//   node scripts/check-lead-simulateur.mjs
//
// ⚠️ CE QUE CE SCRIPT PROUVE, ET CE QU'IL NE PEUT PAS PROUVER.
//
// Le courriel à Yahir et le SMS de Sophie B ne partent PAS d'ici : c'est
// le CRM (palencia-crm) qui les déclenche à la création de la fiche. Ce
// dépôt-ci n'a qu'un seul geste à faire correctement — poster au bon
// endroit, avec la clé d'intake, et sans rien perdre en route.
//
// Donc : ce script prouve que l'appel d'intake porte TOUT ce que le
// simulateur a collecté, et qu'il n'existe qu'UN chemin de sortie. Il ne
// prouve pas que le CRM envoie bien le courriel et le texto — ça se
// vérifie côté CRM, et c'est dit dans la PR.
//
// Il ne démarre pas Next : il remplace `fetch` et appelle la route
// directement, pour regarder ce qui PART. Même motif que
// scripts/check-intake-champs.mjs, dont il reprend la mécanique.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
process.env.LUMIERE_INTAKE_KEY = 'cle-de-test';

let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };

// ── Toutes les sorties réseau sont capturées, pas seulement celles du CRM.
// C'est ce qui permet d'affirmer « un seul chemin » : si quelqu'un ajoute
// un second envoi (un webhook, un service de courriel tiers), il
// apparaîtra ici.
const sorties = [];
globalThis.fetch = async (url, init) => {
  sorties.push({ url: String(url), corps: JSON.parse(String(init?.body || '{}')), entetes: init?.headers || {} });
  return new Response('{"ok":true,"id":"fiche_9001"}', {
    status: 200, headers: { 'content-type': 'application/json' },
  });
};

const { POST } = await import(path.join(ROOT, 'app/api/lead/route.js'));

// ── Exactement ce que app/simulateur/Simulateur.jsx envoie à l'écran 4.
// Les valeurs sont fictives ; la FORME est copiée du composant.
const CORPS_SIMULATEUR = {
  subject: 'Nouveau lead — Simulateur',
  meta_pixel: { event_id: 'evt_test_4242' },
  source: 'Simulateur',
  consentement: 'accordé le 2026-10-09 via le simulateur',
  nom: 'Marie Tremblay',
  telephone: '450 555-0188',
  courriel: 'marie@exemple.ca',
  adresse: '118 rue des Érables, Blainville, QC J7C 3M2',
  // Déduite par villeDeAdresse() dans le composant, envoyée à part.
  ville: 'Blainville',
  service: 'Lumière de Noël (résidentiel)',
  message: 'Style choisi au simulateur : Toiture + arbres',
  utm: {
    utm_source: 'facebook', utm_medium: 'paid_social',
    utm_campaign: 'simulateur_2026', landing: '/simulateur',
  },
};

sorties.length = 0;
const rep = await POST(new Request('https://site.test/api/lead', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(CORPS_SIMULATEUR),
}));
const reponse = await rep.json().catch(() => ({}));
const envoye = sorties[0]?.corps || null;

console.log('\n--- 0. Le journal à blanc : ce qui PART vers le CRM ---');
console.log(`  POST ${sorties[0]?.url || '(rien)'}`);
console.log('  ' + JSON.stringify(envoye, null, 2).split('\n').join('\n  '));
console.log(`  → réponse rendue au navigateur : ${rep.status} ${JSON.stringify(reponse)}`);

console.log('\n--- 1. 🚨 UN seul chemin de sortie ---');
{
  t('🚨 exactement un appel réseau', sorties.length === 1, `${sorties.length}`);
  t('🚨 il va bien à l\'intake du CRM',
    /\/api\/leads$/.test(sorties[0]?.url || ''), sorties[0]?.url);
  t('🚨 il porte la clé d\'intake',
    (sorties[0]?.entetes || {})['x-intake-key'] === 'cle-de-test');
  t('🚨 la route rend un identifiant de fiche au navigateur',
    reponse?.id === 'fiche_9001' || reponse?.ok === true, JSON.stringify(reponse));
}

console.log('\n--- 2. 🚨 Rien n\'est perdu en route ---');
{
  t('🚨 le nom', envoye?.name === 'Marie Tremblay', envoye?.name);
  t('🚨 le téléphone — c\'est lui qui porte le SMS de Sophie',
    envoye?.phone === '450 555-0188', envoye?.phone);
  t('🚨 le courriel', envoye?.email === 'marie@exemple.ca', envoye?.email);
  t('🚨 l\'adresse — tapée à l\'écran 1, elle doit survivre jusqu\'au CRM',
    envoye?.address === '118 rue des Érables, Blainville, QC J7C 3M2', envoye?.address);
  const notes = String(envoye?.notes || '');
  t('🚨 le service', /Service: Lumière de Noël \(résidentiel\)/.test(notes));
  t('🚨 le style choisi au simulateur', /Toiture \+ arbres/.test(notes), notes.replace(/\n/g, ' | '));
  // ⚠️ LA TRACE DE CONSENTEMENT. C'est elle qui autorise le SMS : sans
  // elle dans le CRM, la preuve du consentement n'existe nulle part.
  t('🚨 la trace de consentement (Loi 25) est dans les notes',
    /Consentement: accordé le 2026-10-09 via le simulateur/.test(notes));
}

console.log('\n--- 3. 🚨 L\'attribution suit le lead ---');
{
  // ⚠️ Les UTM arrivent dans `formAnswers`, PAS dans un champ `utm` : c'est
  // la colonne JSON que le CRM persiste déjà, donc aucune migration. Ma
  // première version de ce test lisait `envoye.utm` et criait au loup sur
  // du code correct — l'instrument se trompait, pas le produit.
  const u = envoye?.formAnswers || {};
  t('🚨 utm_source', u.utm_source === 'facebook', u.utm_source);
  t('🚨 utm_medium', u.utm_medium === 'paid_social', u.utm_medium);
  t('🚨 utm_campaign', u.utm_campaign === 'simulateur_2026', u.utm_campaign);
  t('🚨 la page d\'arrivée', u.landing === '/simulateur', u.landing);
  t('🚨 la source dit « Simulateur »', /Simulateur/.test(String(envoye?.source || '')), envoye?.source);
  // La ville est déduite de l'adresse : sans elle, Sophie B la redemande.
  t('🚨 la ville arrive renseignée', envoye?.city === 'Blainville', `city="${envoye?.city}"`);
}

console.log('\n--- 4. 🚨 Le pixel et sa déduplication ---');
{
  // Le même event_id part au navigateur ET au CRM : Meta déduplique le
  // Lead du pixel et celui de l'API Conversions. Sans ça, une conversion
  // compte deux fois — ou aucune, si un bloqueur coupe le pixel.
  const brut = JSON.stringify(envoye);
  t('🚨 l\'event_id voyage jusqu\'au CRM', /evt_test_4242/.test(brut));
}

console.log('\n--- 5. 🚨 Un lead incomplet est REFUSÉ bruyamment ---');
{
  // Mieux vaut une erreur visible qu'un lead avalé en silence.
  sorties.length = 0;
  const r = await POST(new Request('https://site.test/api/lead', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nom: 'Sans Contact' }),
  }));
  t('🚨 sans téléphone ni courriel → 400', r.status === 400, `${r.status}`);
  t('🚨 …et rien n\'est envoyé au CRM', sorties.length === 0, `${sorties.length}`);
}

console.log('\n--- 6. 🚨 Sans clé d\'intake, l\'échec est BRUYANT ---');
{
  const garde = process.env.LUMIERE_INTAKE_KEY;
  delete process.env.LUMIERE_INTAKE_KEY;
  sorties.length = 0;
  const r = await POST(new Request('https://site.test/api/lead', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(CORPS_SIMULATEUR),
  }));
  t('🚨 500 plutôt qu\'un faux succès', r.status === 500, `${r.status}`);
  t('🚨 et aucun appel au CRM', sorties.length === 0);
  process.env.LUMIERE_INTAKE_KEY = garde;
}

console.log('\n--- 7. 🚨 La ville : déduite, ou rien ---');
{
  const { villeDeAdresse } = await import(path.join(ROOT, 'lib/adresse.js'));
  t('🚨 format Places', villeDeAdresse('118 rue des Érables, Blainville, QC J7C 3M2') === 'Blainville');
  t('🚨 avec un numéro d\'appartement',
    villeDeAdresse('118 rue des Érables, app. 4, Saint-Jérôme, QC J7Z 1A1') === 'Saint-Jérôme',
    villeDeAdresse('118 rue des Érables, app. 4, Saint-Jérôme, QC J7Z 1A1'));
  t('🚨 « Québec » écrit en long', villeDeAdresse('12 ch. du Lac, Mirabel, Québec') === 'Mirabel');
  // ⚠️ LE CAS QUI COMPTE : on ne devine pas. Une mauvaise ville, Sophie B
  // la croit ; une ville absente, elle la demande.
  t('🚨 adresse tapée à la main, sans province → RIEN',
    villeDeAdresse('118 rue des Erables') === '', `"${villeDeAdresse('118 rue des Erables')}"`);
  t('🚨 vide → rien', villeDeAdresse('') === '' && villeDeAdresse(null) === '');
  t('🚨 la province seule, sans ville devant → rien', villeDeAdresse('QC J7C 3M2') === '');
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
console.log('\n⚠️  Le courriel à Yahir et le SMS de Sophie B sont déclenchés par le');
console.log('   CRM à la création de la fiche. Ce script prouve que l\'appel');
console.log('   d\'intake les alimente ; leur envoi se vérifie côté palencia-crm.');
process.exit(fail ? 1 : 0);
