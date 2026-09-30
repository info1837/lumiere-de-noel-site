// L'ancrage de la calculatrice — la route executee, avec le CRM bouche.
//
//   node --import ./scripts/next-alias-register.mjs scripts/check-ancrage-calculatrice.mjs
//
// ⚠️ Ce harnais passe par la ROUTE, pas par une fonction.
//
// Le parcours en navigateur a deja attrape un defaut que la lecture des
// fichiers ne pouvait pas voir : les etages etaient collectes a l'ecran et
// JAMAIS envoyes. Ici on verifie l'autre moitie — ce que la route fait de
// ces etages, et ce qu'elle renvoie au navigateur.
//
// Le CRM est bouche : en local, la cle d'intake n'existe pas, et la route
// tombait sur `devis_indisponible` avant meme de calculer l'ancrage.
process.env.LUMIERE_INTAKE_KEY = 'cle-de-test';
const vus = [];
globalThis.fetch = async (url, init) => {
  const u = String(url);
  vus.push({ u, corps: init?.body ? JSON.parse(init.body) : null });
  // ⚠️ L'URL du devis est /api/quote/lumiere — pas « devis ». Mon premier
  // bouchon ne la reconnaissait pas et renvoyait la réponse du lead : la
  // route lisait `quotable: undefined` et la note perdait le prix calculé.
  // Le bouchon avait tort, pas le code.
  if (u.includes('/api/quote/lumiere')) {
    return new Response(JSON.stringify({
      ok: true, quotable: true, total: 2160, linearFt: 180,
      includes: ['Pose', 'Entretien', 'Retrait', 'Entreposage'], needsOnSiteAssessment: false,
      business: 'lumiere',
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return new Response('{"ok":true,"id":"lead_1"}', { status: 200, headers: { 'content-type': 'application/json' } });
};
import path from 'path';
const RACINE = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const { POST } = await import(path.join(RACINE, 'app/api/calc-noel/route.js'));
const appel = async (etages) => {
  const rep = await POST(new Request('https://x/api/calc-noel', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      measure_method: 'manual', linearFt: 180, address: '34 rue Test, Blainville',
      contact: { nom: 'Test', telephone: '5145550188' }, extras: {}, etages,
      consentement: 'accordé le 2026-09-30 via Calculatrice toiture',
    }),
  }));
  return rep.json();
};
let ok = 0, ko = 0;
const t = (n, c, d = '') => { console.log(`  ${c ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`); c ? ok++ : ko++; };
for (const [e, attendu] of [['1', 1000], ['2', 1500], ['3+', null]]) {
  vus.length = 0;
  const d = await appel(e);
  t(`🚨 ${e} étage(s) → ancrage ${attendu === null ? 'aucun' : attendu + ' $'}`, d.ancrage === attendu, String(d.ancrage));
  t(`   la réponse ne porte AUCUN total`, d.total === undefined && d.quotable === undefined, JSON.stringify(Object.keys(d)));
  const lead = vus.find((v) => v.u.includes('/api/leads'))?.corps;
  t(`   les étages vont sur la fiche`, lead?.etages === e, String(lead?.etages));
  t(`   les pieds linéaires aussi`, lead?.linear_ft === 180, String(lead?.linear_ft));
  t(`   le consentement aussi`, /accordé le/.test(String(lead?.consentement)), String(lead?.consentement).slice(0, 34));
  t(`   la note garde le prix calculé pour Yahir`,
    /Prix calculé \(NON montré au client\)/.test(String(lead?.notes)),
    (String(lead?.notes).match(/Prix calculé[^\n]*/) || ['ABSENT'])[0]);
  t(`   …et dit ce que le client a vu`, new RegExp(`Ancrage montré au client : ${attendu ? 'à partir de ' + attendu : 'aucun chiffre'}`).test(String(lead?.notes)), (String(lead?.notes).match(/Ancrage montré[^\n]*/) || ['—'])[0]);
  t(`   la source déclenche Sophie`, /^Calculatrice/.test(String(lead?.source)), String(lead?.source));
}
console.log(`\n${ok}/${ok + ko} vérifications passées.`);
process.exit(ko ? 1 : 0);
