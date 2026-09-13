// Acceptation du tiroir de navigation mobile (npm run check:menu).
//   node scripts/check-tiroir-mobile.mjs --url=…      (SHOTS=dossier pour les captures)
//
// Remplace check-menu-mobile.mjs, écrit pour l'ancien voile plein écran
// coincé entre l'entête et la barre du bas. Le tiroir couvre toute la
// hauteur au-dessus des deux : il n'a plus rien à réserver.
//
// À 390×844 et 430×932, en chromium ET webkit :
//   · fermé : hors écran, invisible, aucun lien tabulable, mais TOUS les
//     liens dans le HTML serveur (3 services + 6 secteurs + les 5 pages)
//   · ouvert : min(88vw,400) de large, pleine hauteur, bord doré 3px à
//     gauche, voile sur la page, défilement de la page verrouillé, focus
//     posé sur le bouton Fermer
//   · entête : UN mot-symbole de 28px, un bouton × de 44×44, rien d'autre
//   · sept entrées dans l'ordre, alignées à gauche, 56px, 700/18px
//   · accordéons fermés par défaut, un seul ouvert à la fois, chevron
//     tourné, aria-expanded/aria-controls ; sous-listes 48px, retrait,
//     puce dorée 6px ; secteurs en deux colonnes ; page courante en doré
//   · pied épinglé en bas : CTA pleine largeur + téléphone, rien d'autre
//   · Échap / voile / × ferment ; le focus revient sur le hamburger ;
//     Tab boucle dans le tiroir
//   · axe : aucune violation, tiroir fermé comme ouvert
import { chromium, webkit } from 'playwright';

const url = (process.argv.find(a => a.startsWith('--url=')) || '').slice(6) || 'http://localhost:3000';
const SHOTS = process.env.SHOTS || '';
// Previews Vercel (SSO) : VERCEL_AUTOMATION_BYPASS_SECRET → en-tête de
// contournement sur chaque requête, jamais x-vercel-set-bypass-cookie.
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '';
const ENTETES = BYPASS ? { 'x-vercel-protection-bypass': BYPASS } : {};
const echecs = [];
const ok = (c, m) => { if (!c) echecs.push(m); return c; };
const OR = 'rgb(233, 220, 192)';   // --gold (champagne)
const NAVY = 'rgba(11, 27, 43, 0.96)';

// L'alias « @/ » de Next n'existe pas sous node : les hrefs attendus sont
// relus dans le HTML plutôt qu'importés — la liste ci-dessous est la
// référence, et menu.js doit lui correspondre.
const SERVICES = ['/services/lumieres-de-noel-residentiel', '/services/lumieres-de-noel-commercial', '/services/eclairage-architectural-permanent'];
const SECTEURS = ['/secteur/blainville', '/secteur/terrebonne', '/secteur/saint-jerome', '/secteur/laval', '/secteur/montreal', '/secteur/rive-sud'];

const VP = [
  { nom: '390x844', width: 390, height: 844 },
  { nom: '430x932', width: 430, height: 932 },
];

const axeSrc = await (await fetch('https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js')).text();
// axe sur la page ENTIÈRE. Toute violation qui touche le tiroir (ou le
// voile, ou le hamburger) est bloquante. Les autres sont imprimées en
// « baseline » : elles préexistent au tiroir (les surlignés dorés sur
// crème, une décision de marque) et ne doivent pas s'aggraver — leur
// nombre est comparé entre l'état fermé et les états ouverts.
const baseline = new Map();
async function axe(p, t, etat) {
  await p.addScriptTag({ content: axeSrc });
  const r = await p.evaluate(() => window.axe.run(document, { resultTypes: ['violations'] }));
  let horsTiroir = 0;
  for (const v of r.violations) {
    for (const n of v.nodes) {
      const cible = n.target.join(' ');
      if (/tiroir|hamburger/.test(cible)) ok(false, `${t} axe (${etat}) : ${v.id} — ${v.help} · ${cible}`);
      else { horsTiroir++; baseline.set(`${v.id} · ${cible}`, v.help); }
    }
  }
  return horsTiroir;
}

// ── 0. HTML serveur : tous les liens présents sans JavaScript ────────────
{
  const html = await (await fetch(url, { headers: ENTETES })).text();
  const i = html.indexOf('id="tiroir-mobile"');
  ok(i > 0, 'HTML serveur : #tiroir-mobile absent');
  const tiroir = html.slice(i, html.indexOf('tiroir__pied', i));
  for (const h of [...SERVICES, ...SECTEURS, '/realisations', '/calculatrice', '/blog', '/soumission']) {
    ok(tiroir.includes(`href="${h}"`), `HTML serveur : ${h} absent du tiroir`);
  }
  ok(!html.includes('menu-overlay'), 'HTML serveur : l\'ancien voile plein écran est encore là');
}

for (const [nomM, M] of [['chromium', chromium], ['webkit', webkit]]) {
  const b = await M.launch();
  for (const vp of VP) {
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: true, isMobile: true, extraHTTPHeaders: ENTETES });
    const p = await ctx.newPage();
    const t = `${nomM} ${vp.nom}`;
    await p.goto(url, { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('#tiroir-mobile', { state: 'attached' });

    const tiroir = p.locator('#tiroir-mobile');
    const burger = p.locator('.header-hamburger');

    // ── Fermé ───────────────────────────────────────────────────────────
    const ferme = await tiroir.evaluate(e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return { vis: s.visibility, gauche: Math.round(r.left), w: innerWidth }; });
    ok(ferme.vis === 'hidden', `${t} fermé : visibility=${ferme.vis} (attendu hidden)`);
    ok(ferme.gauche >= ferme.w, `${t} fermé : le tiroir n'est pas hors écran (left=${ferme.gauche})`);
    ok(await burger.getAttribute('aria-expanded') === 'false', `${t} fermé : hamburger aria-expanded ≠ false`);
    ok(await burger.getAttribute('aria-controls') === 'tiroir-mobile', `${t} : hamburger aria-controls ≠ tiroir-mobile`);
    const bb = await burger.boundingBox();
    ok(bb && bb.width >= 44 && bb.height >= 44, `${t} : hamburger ${bb?.width}×${bb?.height} < 44×44`);
    // Aucun lien du tiroir dans l'ordre de tabulation
    let n = 0;
    for (let k = 0; k < 8; k++) {
      await p.keyboard.press('Tab');
      if (await p.evaluate(() => document.activeElement?.closest('#tiroir-mobile') !== null)) n++;
    }
    ok(n === 0, `${t} fermé : ${n} tabulation(s) sont entrées dans le tiroir`);
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/tiroir-${nomM}-${vp.nom}-1-ferme.png` });
    const axeFerme = nomM === 'chromium' ? await axe(p, t, 'fermé') : 0;

    // ── Ouvert ──────────────────────────────────────────────────────────
    await burger.tap();
    await p.waitForFunction(() => getComputedStyle(document.querySelector('#tiroir-mobile')).visibility === 'visible');
    await p.waitForTimeout(300);
    // WebKit laisse un :hover synthétique là où le doigt a tapé — et le
    // bouton × s'ouvre exactement sous le hamburger. On écarte le pointeur
    // avant de lire les couleurs au repos.
    await p.mouse.move(1, vp.height - 1);
    const o = await tiroir.evaluate(e => {
      const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
      return { w: Math.round(r.width), h: Math.round(r.height), droite: Math.round(innerWidth - r.right), haut: Math.round(r.top),
        bord: s.borderLeftWidth, bordCouleur: s.borderLeftColor, fond: s.backgroundColor, flou: s.backdropFilter || s.webkitBackdropFilter,
        role: e.getAttribute('role'), modal: e.getAttribute('aria-modal'), label: e.getAttribute('aria-label'),
        verrou: getComputedStyle(document.body).overflow, verrouHtml: getComputedStyle(document.documentElement).overflow };
    });
    const wAttendu = Math.round(Math.min(vp.width * 0.88, 400));
    ok(Math.abs(o.w - wAttendu) <= 1, `${t} ouvert : largeur ${o.w} (attendu ${wAttendu})`);
    ok(o.h === vp.height && o.haut === 0, `${t} ouvert : hauteur ${o.h}/haut ${o.haut} (attendu pleine hauteur)`);
    ok(o.droite === 0, `${t} ouvert : collé à droite ? right=${o.droite}`);
    ok(o.bord === '3px' && o.bordCouleur === OR, `${t} ouvert : bord gauche ${o.bord} ${o.bordCouleur}`);
    ok(o.fond === NAVY, `${t} ouvert : fond ${o.fond}`);
    ok(/blur\(14px\)/.test(o.flou), `${t} ouvert : backdrop-filter ${o.flou}`);
    ok(o.role === 'dialog' && o.modal === 'true' && o.label, `${t} ouvert : role/aria-modal/aria-label = ${o.role}/${o.modal}/${o.label}`);
    ok(o.verrou === 'hidden' && o.verrouHtml === 'hidden', `${t} ouvert : défilement non verrouillé (${o.verrouHtml}/${o.verrou})`);
    ok(await burger.getAttribute('aria-expanded') === 'true', `${t} ouvert : hamburger aria-expanded ≠ true`);
    const voile = await p.locator('.tiroir-voile').evaluate(e => { const s = getComputedStyle(e); return { op: Number(s.opacity), fond: s.backgroundColor, vis: s.visibility }; });
    ok(voile.op === 1 && voile.vis === 'visible' && voile.fond === 'rgba(0, 0, 0, 0.55)', `${t} ouvert : voile ${JSON.stringify(voile)}`);
    ok(await p.evaluate(() => document.activeElement?.classList.contains('tiroir__fermer')), `${t} ouvert : le focus n'est pas sur le bouton Fermer`);

    // Entête du tiroir
    const entete = await p.locator('#tiroir-mobile .tiroir__entete').evaluate(e => {
      const imgs = [...e.querySelectorAll('img')].map(i => Math.round(i.getBoundingClientRect().height));
      const x = e.querySelector('.tiroir__fermer').getBoundingClientRect();
      const s = getComputedStyle(e.querySelector('.tiroir__fermer'));
      return { imgs, x: [Math.round(x.width), Math.round(x.height)], bord: s.borderTopWidth + ' ' + s.borderTopColor, enfants: e.children.length };
    });
    ok(entete.imgs.length === 1 && entete.imgs[0] === 28, `${t} entête : logos ${JSON.stringify(entete.imgs)} (attendu un seul, 28px)`);
    ok(entete.x[0] === 44 && entete.x[1] === 44, `${t} entête : bouton × ${entete.x.join('×')}`);
    // ±1 par canal : les moteurs stockent une couleur translucide prémultipliée
    // en 8 bits et la restituent à 232,219,191 pour 233,220,192 à 30 %.
    const bordX = entete.bord.match(/^1px rgba\((\d+), (\d+), (\d+), 0\.3\)$/);
    ok(bordX && Math.abs(bordX[1] - 233) <= 1 && Math.abs(bordX[2] - 220) <= 1 && Math.abs(bordX[3] - 192) <= 1, `${t} entête : bordure du × = ${entete.bord}`);
    ok(entete.enfants === 2, `${t} entête : ${entete.enfants} enfants (attendu 2)`);
    ok(await tiroir.locator('img').count() === 1, `${t} : ${await tiroir.locator('img').count()} images dans le tiroir (un seul logo attendu)`);
    ok(await tiroir.locator('h1, h2, h3, h4').count() === 0, `${t} : un titre dans le tiroir (pas de « ACCUEIL » en entête)`);

    // Entrées de premier niveau
    const items = await p.locator('#tiroir-mobile .tiroir__liste > li > .tiroir__item').evaluateAll(els => els.map(e => {
      const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
      return { txt: e.textContent.trim(), h: Math.round(r.height), x: Math.round(r.left - e.closest('#tiroir-mobile').getBoundingClientRect().left),
        gauche: s.textAlign, jc: s.justifyContent, fw: s.fontWeight, fs: s.fontSize, col: s.color, ff: s.fontFamily,
        tag: e.tagName, exp: e.getAttribute('aria-expanded'), ctl: e.getAttribute('aria-controls'), href: e.getAttribute('href'), target: e.getAttribute('target'), rel: e.getAttribute('rel') };
    }));
    ok(items.map(i => i.txt).join(' · ') === 'Accueil · Services · Secteurs · Réalisations · Calculatrice · Blog · Soumission',
      `${t} entrées : ${items.map(i => i.txt).join(' · ')}`);
    for (const i of items) {
      ok(i.h === 56, `${t} entrée « ${i.txt} » : ${i.h}px (attendu 56)`);
      ok(i.fw === '700' && i.fs === '18px', `${t} entrée « ${i.txt} » : ${i.fw}/${i.fs}`);
      ok(/Nunito Sans/i.test(i.ff), `${t} entrée « ${i.txt} » : police ${i.ff}`);
      ok(i.gauche === 'left' || i.gauche === 'start', `${t} entrée « ${i.txt} » : text-align ${i.gauche}`);
    }
    ok(items.every(i => i.x === items[0].x && i.x <= 6), `${t} entrées : bords gauches ${items.map(i => i.x).join(',')}`);
    const serv = items[1], sect = items[2];
    ok(serv.tag === 'BUTTON' && serv.exp === 'false' && serv.ctl === 'tiroir-services', `${t} Services : ${serv.tag} expanded=${serv.exp} controls=${serv.ctl}`);
    ok(sect.tag === 'BUTTON' && sect.exp === 'false' && sect.ctl === 'tiroir-secteurs', `${t} Secteurs : ${sect.tag} expanded=${sect.exp} controls=${sect.ctl}`);
    ok(await p.locator('#tiroir-services a:visible').count() === 0 && await p.locator('#tiroir-secteurs a:visible').count() === 0, `${t} : un accordéon est ouvert par défaut`);
    // Sur l'accueil, « Accueil » est la page courante : doré ; « Blog » non.
    ok(items[0].col === OR && items[5].col !== OR, `${t} : page courante — Accueil ${items[0].col}, Blog ${items[5].col}`);

    // Pied
    const pied = await p.locator('#tiroir-mobile .tiroir__pied').evaluate(e => {
      const r = e.getBoundingClientRect(); const cta = e.querySelector('.tiroir__cta').getBoundingClientRect();
      return { bas: Math.round(innerHeight - r.bottom), enfants: [...e.children].map(c => c.tagName + ':' + c.textContent.trim().replace(/\s+/g, ' ')),
        ctaW: Math.round(cta.width), largeurUtile: Math.round(r.width - parseFloat(getComputedStyle(e).paddingLeft) - parseFloat(getComputedStyle(e).paddingRight)),
        ctaFond: getComputedStyle(e.querySelector('.tiroir__cta')).backgroundColor, ctaHref: e.querySelector('.tiroir__cta').getAttribute('href'),
        telHref: e.querySelector('.tiroir__tel').getAttribute('href') };
    });
    ok(pied.bas === 0, `${t} pied : ${pied.bas}px du bas (attendu 0, épinglé)`);
    ok(pied.enfants.length === 2 && pied.enfants[0] === 'A:Prix en 60 s' && /^A:Appeler \(438\) 812-6635$/.test(pied.enfants[1]), `${t} pied : ${JSON.stringify(pied.enfants)}`);
    ok(pied.ctaW === pied.largeurUtile, `${t} pied : CTA ${pied.ctaW} / ${pied.largeurUtile} (attendu pleine largeur)`);
    ok(pied.ctaFond === OR, `${t} pied : CTA non champagne (${pied.ctaFond})`);
    ok(pied.ctaHref === '/calculatrice', `${t} pied : CTA → ${pied.ctaHref}`);
    ok(pied.telHref === 'tel:+14388126635', `${t} pied : tel ${pied.telHref}`);
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/tiroir-${nomM}-${vp.nom}-2-ouvert.png` });
    if (nomM === 'chromium') ok(await axe(p, t, 'ouvert') <= axeFerme, `${t} axe : le tiroir ouvert ajoute des violations hors tiroir`);

    // ── Services ────────────────────────────────────────────────────────
    await p.locator('#tiroir-mobile button[aria-controls="tiroir-services"]').tap();
    await p.waitForTimeout(300);
    const sv = await p.locator('#tiroir-mobile').evaluate(e => {
      const btn = e.querySelector('button[aria-controls="tiroir-services"]');
      const chev = getComputedStyle(btn.querySelector('svg')).transform;
      const liens = [...e.querySelectorAll('#tiroir-services a')].map(a => {
        const r = a.getBoundingClientRect(); const s = getComputedStyle(a); const puce = getComputedStyle(a, '::before');
        return { txt: a.textContent.trim(), href: a.getAttribute('href'), h: Math.round(r.height), x: Math.round(r.left - e.getBoundingClientRect().left),
          fs: s.fontSize, puce: [puce.width, puce.height, puce.backgroundColor, puce.borderRadius].join(' ') };
      });
      const item = e.querySelector('.tiroir__liste > li > .tiroir__item').getBoundingClientRect();
      return { exp: btn.getAttribute('aria-expanded'), chev, liens, xItem: Math.round(item.left - e.getBoundingClientRect().left), cache: e.querySelector('#tiroir-services').hidden };
    });
    ok(sv.exp === 'true' && !sv.cache, `${t} Services : aria-expanded=${sv.exp} hidden=${sv.cache}`);
    ok(sv.chev !== 'none' && sv.chev !== 'matrix(1, 0, 0, 1, 0, 0)', `${t} Services : chevron non tourné (${sv.chev})`);
    ok(sv.liens.map(l => l.txt).join(' · ') === 'Lumières de Noël — résidentiel · Lumières de Noël — commercial · Éclairage architectural permanent',
      `${t} Services : ${sv.liens.map(l => l.txt).join(' · ')}`);
    ok(sv.liens.map(l => l.href).join(' ') === SERVICES.join(' '), `${t} Services : hrefs ${sv.liens.map(l => l.href).join(' ')}`);
    for (const l of sv.liens) {
      ok(l.h === 48, `${t} service « ${l.txt} » : ${l.h}px (attendu 48)`);
      ok(l.fs === '16px', `${t} service « ${l.txt} » : ${l.fs}`);
      ok(l.puce === `6px 6px ${OR} 50%`, `${t} service « ${l.txt} » : puce ${l.puce}`);
    }
    ok(sv.liens[0].x - sv.xItem === 20, `${t} Services : retrait ${sv.liens[0].x - sv.xItem}px (attendu 20)`);
    ok(sv.liens.every(l => l.x === sv.liens[0].x), `${t} Services : liens non alignés`);
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/tiroir-${nomM}-${vp.nom}-3-services.png` });
    if (nomM === 'chromium') ok(await axe(p, t, 'services ouverts') <= axeFerme, `${t} axe : Services ouvert ajoute des violations hors tiroir`);

    // ── Secteurs (ferme Services) ───────────────────────────────────────
    await p.locator('#tiroir-mobile button[aria-controls="tiroir-secteurs"]').tap();
    await p.waitForTimeout(300);
    const sc = await p.locator('#tiroir-mobile').evaluate(e => {
      const liens = [...e.querySelectorAll('#tiroir-secteurs a')].map(a => { const r = a.getBoundingClientRect(); return { txt: a.textContent.trim(), x: Math.round(r.left), h: Math.round(r.height), droite: Math.round(r.right) }; });
      return { servExp: e.querySelector('button[aria-controls="tiroir-services"]').getAttribute('aria-expanded'), servCache: e.querySelector('#tiroir-services').hidden,
        sectExp: e.querySelector('button[aria-controls="tiroir-secteurs"]').getAttribute('aria-expanded'), liens, bordDroit: Math.round(e.getBoundingClientRect().right) };
    });
    ok(sc.servExp === 'false' && sc.servCache, `${t} Secteurs : Services encore ouvert (expanded=${sc.servExp}, hidden=${sc.servCache})`);
    ok(sc.sectExp === 'true', `${t} Secteurs : aria-expanded=${sc.sectExp}`);
    ok(sc.liens.length === 6, `${t} Secteurs : ${sc.liens.length} zones (attendu 6)`);
    ok(new Set(sc.liens.map(l => l.x)).size === 2, `${t} Secteurs : ${new Set(sc.liens.map(l => l.x)).size} colonne(s) (attendu 2)`);
    ok(sc.liens.every(l => l.h === 48), `${t} Secteurs : hauteurs ${[...new Set(sc.liens.map(l => l.h))].join(',')}`);
    ok(sc.liens.every(l => l.droite <= sc.bordDroit), `${t} Secteurs : une ville déborde du tiroir`);
    // Chaque ville sur UNE ligne : la boîte du texte ne dépasse pas une
    // hauteur de ligne (les rangées font 48 de min-height, une ville
    // coupée au trait d'union donnerait 48 aussi — on mesure le texte).
    const hautTexte = await p.locator('#tiroir-secteurs a').evaluateAll(els => els.map(a => { const r = document.createRange(); r.selectNodeContents(a); return [a.textContent.trim(), Math.round(r.getBoundingClientRect().height)]; }));
    ok(hautTexte.every(([, h]) => h <= 22), `${t} Secteurs : villes sur deux lignes — ${hautTexte.filter(([, h]) => h > 22).map(([v]) => v).join(', ')}`);
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/tiroir-${nomM}-${vp.nom}-4-secteurs.png` });

    // ── Piège à focus : Tab depuis le dernier élément revient au premier
    //    (le mot-symbole), Maj+Tab depuis le premier va au dernier ────────
    await p.locator('#tiroir-mobile .tiroir__tel').focus();
    await p.keyboard.press('Tab');
    ok(await p.evaluate(() => document.activeElement?.classList.contains('tiroir__marque')), `${t} piège à focus : Tab après le téléphone sort du tiroir`);
    await p.keyboard.press('Shift+Tab');
    ok(await p.evaluate(() => document.activeElement?.classList.contains('tiroir__tel')), `${t} piège à focus : Maj+Tab depuis le mot-symbole sort du tiroir`);

    // ── Échap ferme, focus rendu au hamburger, défilement libéré ─────────
    await p.keyboard.press('Escape');
    await p.waitForTimeout(350);
    ok(await tiroir.evaluate(e => getComputedStyle(e).visibility) === 'hidden', `${t} Échap : le tiroir ne s'est pas fermé`);
    ok(await p.evaluate(() => document.activeElement?.classList.contains('header-hamburger')), `${t} Échap : le focus n'est pas revenu sur le hamburger`);
    ok(await p.evaluate(() => getComputedStyle(document.body).overflow) !== 'hidden', `${t} Échap : défilement encore verrouillé`);
    ok(await p.locator('#tiroir-secteurs').evaluate(e => e.hidden), `${t} Échap : l'accordéon n'est pas refermé pour la prochaine ouverture`);

    // ── Voile ferme ─────────────────────────────────────────────────────
    await burger.tap(); await p.waitForTimeout(300);
    await p.touchscreen.tap(8, vp.height / 2);
    await p.waitForTimeout(350);
    ok(await tiroir.evaluate(e => getComputedStyle(e).visibility) === 'hidden', `${t} voile : le tap ne ferme pas`);

    // ── × ferme ─────────────────────────────────────────────────────────
    await burger.tap(); await p.waitForTimeout(300);
    await p.locator('#tiroir-mobile .tiroir__fermer').tap();
    await p.waitForTimeout(350);
    ok(await tiroir.evaluate(e => getComputedStyle(e).visibility) === 'hidden', `${t} × : ne ferme pas`);

    // ── Mouvement réduit : pas de transition ────────────────────────────
    await p.emulateMedia({ reducedMotion: 'reduce' });
    const tr = await tiroir.evaluate(e => getComputedStyle(e).transitionDuration);
    ok(tr === '0s', `${t} prefers-reduced-motion : transition ${tr}`);
    await p.emulateMedia({ reducedMotion: 'no-preference' });

    // ── Page courante en doré ───────────────────────────────────────────
    await p.goto(url.replace(/\/$/, '') + '/services/lumieres-de-noel-commercial', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('#tiroir-mobile', { state: 'attached' });
    await burger.tap(); await p.waitForTimeout(300);
    await p.locator('#tiroir-mobile button[aria-controls="tiroir-services"]').tap(); await p.waitForTimeout(300);
    const cur = await p.locator('#tiroir-mobile').evaluate(e => [...e.querySelectorAll('a[aria-current="page"]')].map(a => ({ txt: a.textContent.trim(), col: getComputedStyle(a).color })));
    ok(cur.length === 1 && cur[0].txt === 'Lumières de Noël — commercial' && cur[0].col === OR, `${t} page courante : ${JSON.stringify(cur)}`);
    // Le tiroir passe AU-DESSUS de la barre d'action du bas (Appeler /
    // Soumission), pas dessous : c'est ce qui rend l'ancien calcul de
    // réserve inutile.
    const zBarre = await p.evaluate(() => { const b = document.querySelector('.mobile-bottom-bar'); return b ? Number(getComputedStyle(b).zIndex) : -1; });
    ok(zBarre < 1100, `${t} : la barre du bas (z ${zBarre}) passe devant le tiroir`);

    await ctx.close();
  }
  await b.close();
}

console.log(`\nTiroir mobile — ${url}`);
if (baseline.size) {
  console.log(`\nBASELINE axe hors tiroir (préexistant, non bloquant) : ${baseline.size}`);
  for (const [k, v] of baseline) console.log(`  · ${k} — ${v}`);
}
if (echecs.length) { console.log(`❌ ${echecs.length} échec(s)\n` + echecs.map(e => '  ✗ ' + e).join('\n') + '\n'); process.exit(1); }
console.log('✅ tout passe (2 moteurs × 2 fenêtres)\n');
