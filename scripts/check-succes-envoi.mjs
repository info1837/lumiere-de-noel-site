// Le succès d'une soumission dépend du CRM, jamais de Web3Forms.
//
//   node scripts/check-succes-envoi.mjs
//
// Mesuré en vrai navigateur sur la production le 2026-09-28 : depuis
// www.lumieredenoelinc.com, api.web3forms.com est bloqué par CORS. Le
// lead arrivait bien au CRM (HTTP 200) et pourtant le visiteur lisait
// « Erreur d'envoi. Appelez-nous au (438) 812-6635. », la page ne
// redirigeait pas vers /merci, et AUCUN événement Lead ne partait vers
// Meta — parce que les formulaires ne tirent le pixel que sur `ok`.
//
// Web3Forms n'est qu'un relais de courriel. Le CRM est la source de
// vérité : c'est là que le lead vit et que Sophie le prend en charge.

import path from 'path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const t = (nom, ok, d = '') => { console.log(`  ${ok ? '✅' : '❌'} ${nom}${d ? ` — ${d}` : ''}`); ok ? pass++ : fail++; };

const { sendLead, HONEYPOT_FIELD } = await import(path.join(ROOT, 'components/data.js'));

// Faux navigateur : on decide qui repond quoi.
let crmStatut = 200, web3Leve = false, appels = [];
globalThis.fetch = async (url, init) => {
  const u = String(url);
  appels.push(u.includes('web3forms') ? 'web3forms' : u.includes('/api/lead') ? 'crm' : u);
  if (u.includes('web3forms')) {
    if (web3Leve) throw new TypeError('Failed to fetch');   // exactement ce que fait CORS
    return new Response('{"success":true}', { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (u.includes('/api/lead')) return new Response('{"ok":true}', { status: crmStatut, headers: { 'content-type': 'application/json' } });
  return new Response('{}', { status: 200 });
};

const lead = { nom: 'Test', telephone: '5145550199', ville: 'Blainville', source: 'Formulaire hero (réservation rapide)' };

console.log('\n--- 1. 🚨 AUCUN service tiers n\'est appelé ---');
{
  crmStatut = 200; web3Leve = true; appels = [];
  const ok = await sendLead({ ...lead });
  t('la soumission réussit', ok === true, `rendu=${ok}`);
  t('le CRM a bien été appelé', appels.includes('crm'));
  // Web3Forms a ete RETIRE le 2026-09-28 : il etait bloque par CORS et
  // faisait afficher « Erreur d'envoi » alors que le lead etait
  // enregistre. Le succes ne doit dependre d'aucun tiers.
  t('🚨 Web3Forms n\'est plus appelé du tout', !appels.includes('web3forms'), appels.join(', '));
  t('🚨 un seul appel réseau, vers notre propre route', appels.length === 1 && appels[0] === 'crm', appels.join(', '));
}

console.log('\n--- 2. Le CRM refuse : la soumission échoue ---');
{
  crmStatut = 500; web3Leve = false; appels = [];
  const ok = await sendLead({ ...lead });
  t('🚨 sendLead rend false quand le CRM refuse', ok === false, `rendu=${ok}`);
}

console.log('\n--- 3. Le CRM tombe : échec, sans repli sur un tiers ---');
{
  crmStatut = 502; web3Leve = false; appels = [];
  const ok = await sendLead({ ...lead });
  t('aucun tiers ne sauve un CRM en panne', ok === false, `rendu=${ok}`);
  t('et rien n\'a été envoyé ailleurs', !appels.includes('web3forms'));
}

console.log('\n--- 4. Les deux vont bien ---');
{
  crmStatut = 200; web3Leve = false;
  t('succès', (await sendLead({ ...lead })) === true);
}

console.log('\n--- 5. Le honeypot reste silencieux ---');
{
  appels = [];
  const ok = await sendLead({ ...lead, [HONEYPOT_FIELD]: 'bot' });
  t('un bot reçoit « succès » sans rien envoyer', ok === true && appels.length === 0, `${appels.length} appel(s)`);
}

console.log('\n--- 6. La clé Web3Forms ne vit plus dans le bundle public ---');
{
  const fs = await import('fs');
  const src = fs.readFileSync(path.join(ROOT, 'components/data.js'), 'utf8');
  const code = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  t('🚨 aucune clé d\'accès tierce dans le code', !/295b087c|WEB3FORMS_ACCESS_KEY|api\.web3forms\.com/.test(code),
    (code.match(/295b087c[^"']*/) || [''])[0]);
  const mod = await import(path.join(ROOT, 'components/data.js'));
  t('WEB3FORMS_ACCESS_KEY n\'est plus exporté', mod.WEB3FORMS_ACCESS_KEY === undefined);
}

console.log(`\n${pass}/${pass + fail} vérifications passées.`);
process.exit(fail ? 1 : 0);
