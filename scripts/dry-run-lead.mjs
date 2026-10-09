// DRY RUN — un lead du site arrive au CRM, entier.
//
//   node --preserve-symlinks scripts/dry-run-lead.mjs
//
// 🚨 POURQUOI CE HARNAIS EXISTE.
//
// Trois gardes affirmaient « l'envoi vers le CRM est intact » en
// cherchant une chaîne de caractères dans le source. Deux d'entre elles
// cherchaient une URL qui n'est plus écrite d'un seul tenant depuis que
// `CRM_BASE_URL` est surchargeable : elles criaient sur du code
// parfaitement sain. Une expression régulière qui regarde du texte ne
// dit rien de ce qui PART.
//
// Ici on appelle la route pour de vrai, avec `fetch` remplacé, et on
// REGARDE le corps envoyé. Aucun réseau, aucun lead, aucun courriel.
//
// ⚠️ CE QUE ÇA NE PROUVE PAS. Le courriel au propriétaire et le SMS de
// Sophie B sont déclenchés par le CRM à la création de la fiche. Ce
// dépôt-ci n'a qu'un geste à faire correctement — poster, entier, au bon
// endroit, avec la clé — et c'est celui-là qui est vérifié.

import path from 'node:path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
process.env.LUMIERE_INTAKE_KEY = 'cle-de-test';

let ok = 0, ko = 0;
const t = (nom, cond, d = '') => {
  console.log(`  ${cond ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`);
  cond ? ok++ : ko++;
};

// Toutes les sorties réseau sont capturées — pas seulement celles du
// CRM. C'est ce qui permet d'affirmer « un seul chemin ».
const sorties = [];
globalThis.fetch = async (url, init) => {
  sorties.push({ url: String(url), entetes: init?.headers || {}, corps: JSON.parse(String(init?.body || '{}')) });
  return new Response('{"ok":true,"id":"fiche_test"}', {
    status: 200, headers: { 'content-type': 'application/json' },
  });
};

const { POST } = await import(path.join(ROOT, 'app/api/lead/route.js'));

// Exactement ce que QuoteForm envoie (components/data.js → sendLead).
const CORPS = {
  subject: 'Nouveau lead — Réservation',
  source: "Formulaire d'accueil (réservation)",
  consentement: 'accordé le 2026-10-09 via le formulaire',
  meta_pixel: { event_id: 'evt_test_77' },
  nom: 'Marie Tremblay',
  telephone: '450 555-0188',
  courriel: 'marie@exemple.ca',
  adresse: '118 rue des Érables',
  ville: 'Blainville',
  service: 'Lumières de Noël — résidentiel',
  budget: '2 000 $ et plus',
  message: 'Toiture et deux arbres',
  utm: { utm_source: 'facebook', utm_campaign: 'noel_2026', landing: '/' },
};

const rep = await POST(new Request('https://site.test/api/lead', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(CORPS),
}));
const reponse = await rep.json().catch(() => ({}));
const envoye = sorties[0]?.corps || null;

console.log('\n--- 0. Le journal à blanc : ce qui PART vers le CRM ---');
console.log(`  POST ${sorties[0]?.url || '(rien)'}`);
console.log('  ' + JSON.stringify(envoye, null, 2).split('\n').join('\n  '));
console.log(`  → rendu au navigateur : ${rep.status} ${JSON.stringify(reponse)}`);

console.log('\n--- 1. 🚨 Un seul chemin, vers le bon endroit ---');
t('🚨 exactement un appel réseau', sorties.length === 1, `${sorties.length}`);
t('🚨 vers l\'intake du CRM', /\/api\/leads$/.test(sorties[0]?.url || ''), sorties[0]?.url);
t('🚨 avec la clé d\'intake', (sorties[0]?.entetes || {})['x-intake-key'] === 'cle-de-test');
t('🚨 l\'id de la fiche remonte au navigateur', reponse?.ok === true && reponse?.id === 'fiche_test');

console.log('\n--- 2. 🚨 Rien n\'est perdu en route ---');
t('🚨 le nom', envoye?.name === 'Marie Tremblay', envoye?.name);
t('🚨 le téléphone — c\'est lui qui porte le SMS de Sophie',
  envoye?.phone === '450 555-0188', envoye?.phone);
t('🚨 le courriel', envoye?.email === 'marie@exemple.ca', envoye?.email);
t('🚨 l\'adresse', envoye?.address === '118 rue des Érables', envoye?.address);
// ⚠️ La ville a DÉJÀ été jetée une fois (2026-09-27) : Sophie B
// redemandait une information que le client venait d'écrire.
t('🚨 la ville', envoye?.city === 'Blainville', envoye?.city);
const notes = String(envoye?.notes || '');
t('🚨 le service', /Lumières de Noël — résidentiel/.test(notes));
t('🚨 le budget', /2 000 \$ et plus/.test(notes));
t('🚨 le message', /Toiture et deux arbres/.test(notes));
// La trace de consentement est ce qui AUTORISE le SMS.
t('🚨 la trace de consentement (Loi 25)', /Consentement: accordé le 2026-10-09/.test(notes));

console.log('\n--- 3. 🚨 L\'attribution et le pixel suivent ---');
t('🚨 utm_source', envoye?.formAnswers?.utm_source === 'facebook');
t('🚨 utm_campaign', envoye?.formAnswers?.utm_campaign === 'noel_2026');
t('🚨 la page d\'arrivée', envoye?.formAnswers?.landing === '/');
t('🚨 l\'event_id du pixel voyage jusqu\'au CRM', /evt_test_77/.test(JSON.stringify(envoye)));

console.log('\n--- 4. 🚨 Les refus sont bruyants ---');
{
  sorties.length = 0;
  const r = await POST(new Request('https://site.test/api/lead', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nom: 'Sans Contact' }),
  }));
  t('🚨 sans téléphone ni courriel → 400', r.status === 400, `${r.status}`);
  t('🚨 …et rien n\'est envoyé', sorties.length === 0);

  const garde = process.env.LUMIERE_INTAKE_KEY;
  delete process.env.LUMIERE_INTAKE_KEY;
  sorties.length = 0;
  const r2 = await POST(new Request('https://site.test/api/lead', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(CORPS),
  }));
  t('🚨 sans clé d\'intake → 500, pas un faux succès', r2.status === 500, `${r2.status}`);
  t('🚨 et aucun appel', sorties.length === 0);
  process.env.LUMIERE_INTAKE_KEY = garde;
}

console.log(`\n${ok}/${ok + ko} vérifications passées.`);
console.log('\nℹ️  Le courriel au propriétaire et le SMS de Sophie B sont déclenchés');
console.log('   par le CRM à la création de la fiche ; ce harnais prouve que');
console.log('   l\'appel d\'intake les alimente.');
process.exit(ko ? 1 : 0);
