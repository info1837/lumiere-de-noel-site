// Vérifie que la route d'intake transmet au CRM tout ce que les
// formulaires collectent.
//
//   node scripts/check-intake-champs.mjs
//
// Le 2026-09-27, le formulaire hero collectait « Ville » et la route
// d'intake ne la transmettait PAS : ni dans le payload, ni dans les
// notes. Le lead arrivait au CRM avec city = null, et Sophie B
// redemandait une information que le client venait d'écrire.
//
// Ce script ne démarre pas Next : il appelle la route directement avec
// un fetch remplacé, et regarde ce qui PART vers le CRM.

import fs from 'fs';
import path from 'path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
process.env.LUMIERE_INTAKE_KEY = 'cle-de-test';
// L'URL du CRM est une constante dans la route (pas une variable
// d'environnement) : on intercepte donc palencia-crm.vercel.app.

let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };

// Ce que chaque formulaire du site envoie réellement, lu dans le source.
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const champsDe = (f) => {
  const m = src(f).match(/const empty = \{([^}]*)\}/);
  if (!m) return [];
  return [...m[1].matchAll(/(\w+)\s*:/g)].map((x) => x[1]);
};

// ⚠️ LE HERO N'A PLUS DE FORMULAIRE. Il portait une carte à cinq champs au
// premier écran ; elle est descendue en bas de l'accueil, où c'est le MÊME
// QuoteForm que /soumission qui la rend. Lire `const empty` dans Hero.jsx
// rendait donc une liste vide, et la ligne imprimée mentait par omission.
// Le simulateur, lui, a maintenant ses propres champs.
const complet = champsDe('components/QuoteForm.jsx');
const simulateur = (src('app/simulateur/Simulateur.jsx').match(/const \[coord, setCoord\] = useState\(\{([^}]*)\}/) || [, ''])[1]
  .match(/(\w+):/g)?.map((x) => x.slice(0, -1)) || [];
console.log('\n--- 1. Ce que les formulaires collectent ---');
console.log(`  complet    : ${complet.join(', ')}`);
console.log(`  simulateur : ${simulateur.join(', ')}`);

const envoyes = [];
globalThis.fetch = async (url, init) => {
  if (String(url).includes('palencia-crm.vercel.app')) {
    envoyes.push(JSON.parse(String(init?.body || '{}')));
    return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return new Response('{}', { status: 200 });
};

const { POST } = await import(path.join(ROOT, 'app/api/lead/route.js'));
const soumettre = async (corps) => {
  envoyes.length = 0;
  const rep = await POST(new Request('https://site.test/api/lead', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corps),
  }));
  return { statut: rep.status, envoye: envoyes[0] || null };
};

console.log('\n--- 2. 🚨 Le formulaire hero : la ville arrive au CRM ---');
{
  const r = await soumettre({
    nom: 'Yahir Palencia', telephone: '5145550123', courriel: 'y@test.ca',
    ville: 'Blainville', service: 'Lumière de Noël (résidentiel)',
    source: 'Formulaire hero (réservation rapide)',
  });
  t('la route accepte', r.statut === 200, `HTTP ${r.statut}`);
  t('🚨 city est transmis', r.envoye?.city === 'Blainville', `city=${JSON.stringify(r.envoye?.city)}`);
  t('le nom et le téléphone aussi', r.envoye?.name === 'Yahir Palencia' && String(r.envoye?.phone || '').includes('5145550123'));
  t('la source est conservée', String(r.envoye?.source || '').startsWith('Formulaire hero'));
}

console.log('\n--- 3. Le formulaire complet : l\'adresse arrive toujours ---');
{
  const r = await soumettre({
    nom: 'Marie Tremblay', telephone: '5145550124', courriel: 'm@test.ca',
    adresse: '34 rue de Vaudreuil, Blainville', service: 'Lumière de Noël (résidentiel)',
    budget: '1 000 $ - 2 000 $', message: 'toiture et colonnes',
    consentement: 'accordé le 2026-01-02 via Formulaire de soumission (complet)',
    source: 'Formulaire de soumission (complet)',
  });
  t('address est transmis', r.envoye?.address === '34 rue de Vaudreuil, Blainville', `address=${JSON.stringify(r.envoye?.address)}`);
  t('le budget et le message sont dans les notes',
    /Budget: 1 000 \$/.test(String(r.envoye?.notes)) && /toiture et colonnes/.test(String(r.envoye?.notes)));
  t('🚨 la trace de consentement est conservée',
    /Consentement: accordé le 2026-01-02/.test(String(r.envoye?.notes)),
    (String(r.envoye?.notes).match(/Consentement:.*/) || ['absente'])[0]);
}

console.log('\n--- 4. 🚨 Aucun champ collecté n\'est perdu en silence ---');
{
  // Chaque champ des deux formulaires doit soit partir vers le CRM, soit
  // finir dans les notes. Un champ qui n'arrive nulle part est une
  // question que Sophie posera pour rien.
  const IGNORES = new Set(['telephone', 'courriel', 'nom', 'source', process.env.HONEYPOT || 'botcheck']);
  const r = await soumettre({
    nom: 'X', telephone: '5145550125', courriel: 'x@test.ca',
    ville: 'Laval', adresse: '1 rue A', service: 'S', budget: 'B', message: 'M',
    consentement: 'accordé le 2026-01-02 via hero',
    source: 'Formulaire hero (réservation rapide)',
  });
  const paquet = JSON.stringify(r.envoye || {});
  const perdus = [];
  for (const [champ, valeur] of [['ville', 'Laval'], ['adresse', '1 rue A'], ['service', 'S'], ['budget', 'B'], ['message', 'M'], ['consentement', 'accordé le 2026-01-02']]) {
    if (!paquet.includes(valeur)) perdus.push(champ);
  }
  t('🚨 aucun champ perdu', perdus.length === 0, perdus.length ? `perdus : ${perdus.join(', ')}` : '');
  const collectes = new Set([...complet, ...simulateur].filter((c) => !IGNORES.has(c) && !c.startsWith('_')));
  console.log(`  champs collectés suivis : ${[...collectes].join(', ')}`);
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
