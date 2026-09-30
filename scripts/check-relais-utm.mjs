// Le relais SERVEUR : ce que /api/lead envoie VRAIMENT au CRM.
//
//   node scripts/check-relais-utm.mjs
//
// Le banc navigateur intercepte /api/lead — il prouve la patte
// navigateur → site. Celui-ci prend la route en main et intercepte
// l'appel SORTANT : c'est la seule facon de voir ce que le CRM recoit.
//
// Ce qui compte : les UTM doivent arriver dans `formAnswers`, la colonne
// JSON que le CRM persiste deja. C'est la que lib/offre-voisin.js lit
// `utm_campaign` pour poser « Offre voisin 250 $ ».

process.env.LUMIERE_INTAKE_KEY = 'cle-essai';
const { POST } = await import('../app/api/lead/route.js');

let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };

let sortant = null;
globalThis.fetch = async (url, opts) => {
  sortant = { url: String(url), entetes: opts?.headers || {}, corps: JSON.parse(opts?.body || '{}') };
  return { ok: true, status: 200, text: async () => '', json: async () => ({}) };
};

const poster = (corps) => POST(new Request('https://x/api/lead', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps),
}));

const BASE = { nom: 'Test', telephone: '5145550123', courriel: 't@x.ca' };

console.log('\n── 1. Avec les UTM du QR ──');
{
  sortant = null;
  const r = await poster({ ...BASE, utm: {
    utm_source: 'accroche_porte', utm_medium: 'print', utm_campaign: 'voisin_2026', landing: '/' } });
  t('la route accepte', r.status === 200, String(r.status));
  t('elle appelle bien le CRM', /palencia-crm.*\/api\/leads/.test(sortant?.url || ''), sortant?.url);
  t('la cle d’intake part en entete', !!sortant?.entetes?.['x-intake-key']);
  t('les UTM sont dans formAnswers', !!sortant?.corps?.formAnswers, JSON.stringify(sortant?.corps?.formAnswers));
  t('la campagne y est', sortant?.corps?.formAnswers?.utm_campaign === 'voisin_2026');
  t('la source y est', sortant?.corps?.formAnswers?.utm_source === 'accroche_porte');
  t('la page d’arrivee y est', sortant?.corps?.formAnswers?.landing === '/');
  t('aucun business_id n’est envoye', sortant?.corps?.business_id === undefined);
}

console.log('\n── 2. Sans UTM : rien d’invente ──');
{
  sortant = null;
  await poster({ ...BASE });
  t('le lead part quand meme', !!sortant);
  // ⚠️ `formAnswers: {}` ECRASERAIT ce qu'un autre chemin y aurait mis.
  t('formAnswers est ABSENT, pas vide', !('formAnswers' in (sortant?.corps || {})),
    JSON.stringify(sortant?.corps?.formAnswers));
}

console.log('\n── 3. Ce que le visiteur envoie est nettoye ──');
{
  sortant = null;
  await poster({ ...BASE, utm: { utm_campaign: 'y'.repeat(4000), utm_source: '  espaces  ', pirate: 'non' } });
  const fa = sortant?.corps?.formAnswers || {};
  t('la campagne est bornee a 120', (fa.utm_campaign || '').length === 120, `${(fa.utm_campaign || '').length}`);
  t('les espaces sont retires', fa.utm_source === 'espaces', JSON.stringify(fa.utm_source));
  t('un champ inconnu n’entre pas', !('pirate' in fa), Object.keys(fa).join(','));
}

console.log('\n── 4. Les garde-fous d’avant n’ont pas bouge ──');
{
  sortant = null;
  const r = await poster({ telephone: '5145550123' });   // sans nom
  t('un lead sans nom est refuse', r.status === 400, String(r.status));
  t('et rien n’est parti au CRM', sortant === null);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
