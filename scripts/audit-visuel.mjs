// =============================================================================
// Audit visuel — chaque route, sur un vrai téléphone et sur bureau
// =============================================================================
//   npm run audit:visuel              construit, sert, vérifie, capture
//   npm run audit:visuel -- --no-build   réutilise le .next existant
//   npm run audit:visuel -- --route=/secteur/laval
//
// POURQUOI CE FICHIER EXISTE
// Trois défauts sont partis en production sans que rien les voie : un
// en-tête fixe qui recouvrait le h1 de toutes les pages sauf l'accueil,
// une barre du bas dont la hauteur réelle dépassait la réserve du body, et
// un flocon `content: "❄"` rendu en emoji couleur sur iOS. Nos contrôles
// regardaient le débordement horizontal et les images — jamais le
// RECOUVREMENT par un élément fixe. C'est ce trou-là que ce script ferme.
//
// CE QU'IL AFFIRME, PAR ROUTE ET PAR LARGEUR
//   1. aucun texte sous une barre fixe du HAUT (en-tête)
//   2. aucun texte sous une barre fixe du BAS (barre d'action mobile)
//   3. aucun débordement horizontal
//   4. aucune image cassée
//   5. aucune erreur de console
//
// DEUX RÈGLES QU'IL S'IMPOSE
//   - Il démarre TOUJOURS son propre serveur, sur un port libre, et attend
//     un vrai 200 avant de mesurer. Un audit qui interroge un serveur
//     périmé rend « ok » avec des chiffres inventés.
//   - Ses assertions sont vérifiables : `npm run audit:visuel:autotest`
//     casse volontairement une page et exige que le contrôle passe au
//     rouge. Un audit visuel incapable d'échouer est pire que pas d'audit.
// =============================================================================

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const SORTIE = join(RACINE, ".audit-visuel");
const args = process.argv.slice(2);
const opt = (n, d = null) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=").slice(1).join("=") : d; };
const flag = (n) => args.includes(`--${n}`);

const LARGEURS = [
  { nom: "mobile",  width: 390, height: 844, mobile: true,
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
  { nom: "bureau",  width: 1440, height: 900, mobile: false, ua: undefined },
];

// Bruit local connu : ces scripts n'existent que sur l'infrastructure Vercel,
// donc ils rendent 404 en `next start` local. Les compter ferait échouer
// TOUTES les routes pour une raison qui n'existe pas en production — le
// meilleur moyen de rendre l'audit ininterprétable et de cesser de le lire.
const BRUIT_LOCAL = [/\/_vercel\/(insights|speed-insights)\//];
const estBruit = (t) => BRUIT_LOCAL.some((r) => r.test(t));

const sh = (cmd, a, o = {}) => new Promise((res, rej) => {
  const p = spawn(cmd, a, { cwd: RACINE, stdio: "inherit", ...o });
  p.on("exit", (c) => (c === 0 ? res() : rej(new Error(`${cmd} a rendu ${c}`))));
});

async function portLibre(depart = 3400) {
  const net = await import("node:net");
  for (let p = depart; p < depart + 60; p++) {
    const libre = await new Promise((r) => {
      const s = net.createServer().once("error", () => r(false)).once("listening", () => s.close(() => r(true))).listen(p, "127.0.0.1");
    });
    if (libre) return p;
  }
  throw new Error("aucun port libre");
}

async function attendre200(url, msMax = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < msMax) {
    try { const r = await fetch(url); if (r.ok) return true; } catch {}
    await new Promise((r) => setTimeout(r, 350));
  }
  return false;
}

// --- La mesure, exécutée DANS la page ---------------------------------------
// Une « barre fixe » = tout élément position:fixed/sticky collé en haut ou en
// bas de la fenêtre. On cherche ensuite les FEUILLES DE TEXTE visibles qui
// recoupent son rectangle, en excluant la barre elle-même et ses descendants.
const MESURE = () => {
  const V = { w: window.innerWidth, h: window.innerHeight };
  const vis = (e) => {
    const s = getComputedStyle(e);
    if (s.display === "none" || s.visibility === "hidden" || parseFloat(s.opacity) === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const tous = [...document.querySelectorAll("body *")];
  const fixes = tous.filter((e) => {
    const s = getComputedStyle(e);
    return (s.position === "fixed" || s.position === "sticky") && vis(e);
  });
  const barres = { haut: [], bas: [] };
  for (const e of fixes) {
    const r = e.getBoundingClientRect();
    if (e.closest("[data-audit-ignore]")) continue;
    if (r.top <= 2 && r.height > 8 && r.height < V.h * 0.5) barres.haut.push(e);
    if (r.bottom >= V.h - 2 && r.height > 8 && r.height < V.h * 0.5) barres.bas.push(e);
  }
  // Ne garder que la barre la plus haute de chaque côté (les enfants fixes
  // d'une barre ne sont pas des barres distinctes).
  const dedupe = (l) => l.filter((e) => !l.some((o) => o !== e && o.contains(e)));
  barres.haut = dedupe(barres.haut); barres.bas = dedupe(barres.bas);

  const feuillesTexte = tous.filter((e) => {
    if (!vis(e)) return false;
    if (e.getAttribute("aria-hidden") === "true") return false;
    if (["SCRIPT", "STYLE", "SVG", "PATH"].includes(e.tagName)) return false;
    const propre = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    return propre;
  });

  const recouvre = (barre) => {
    const b = barre.getBoundingClientRect();
    const coupables = [];
    for (const e of feuillesTexte) {
      if (barre.contains(e) || e.contains(barre)) continue;
      if (getComputedStyle(e).position === "fixed") continue;
      const r = e.getBoundingClientRect();
      const chevauche = r.top < b.bottom && r.bottom > b.top && r.left < b.right && r.right > b.left;
      if (!chevauche) continue;
      const px = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
      if (px < 3) continue; // frôlement d'un pixel : pas un défaut
      coupables.push({
        sel: e.tagName.toLowerCase() + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/)[0] : ""),
        texte: e.textContent.trim().slice(0, 60), px: Math.round(px),
      });
    }
    return coupables.sort((a, b2) => b2.px - a.px).slice(0, 3);
  };

  const de = document.documentElement;
  const deborde = de.scrollWidth > V.w + 1;
  const coupablesLargeur = !deborde ? [] : tous.filter((e) => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.right > V.w + 1;
  }).slice(0, 3).map((e) => ({
    sel: e.tagName.toLowerCase() + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/)[0] : ""),
    droite: Math.round(e.getBoundingClientRect().right),
  }));

  const imagesCassees = [...document.images]
    .filter((i) => i.complete && i.naturalWidth === 0)
    .map((i) => i.getAttribute("src") || "(src vide)");

  return {
    vp: V.w, doc: de.scrollWidth, deborde, coupablesLargeur, imagesCassees,
    nbBarreHaut: barres.haut.length, nbBarreBas: barres.bas.length,
    sousEnTete: barres.haut.flatMap(recouvre),
    sousBarreBas: barres.bas.flatMap(recouvre),
  };
};

// --- Injection de défauts, pour prouver que les contrôles savent échouer ----
// Utilisé par `npm run audit:visuel:autotest`. Chaque injection reproduit UN
// des défauts réellement partis en production, ou son équivalent direct.
const INJECTIONS = {
  entete: () => {            // texte glissé sous l'en-tête fixe
    const d = document.createElement("p");
    d.textContent = "DEFAUT INJECTE — texte sous l'en-tete";
    d.style.cssText = "position:absolute;top:8px;left:20px;z-index:1;color:#fff;font-size:18px";
    document.body.appendChild(d);
  },
  "barre-bas": () => {       // texte glissé sous la barre d'action du bas
    const d = document.createElement("p");
    d.textContent = "DEFAUT INJECTE — texte sous la barre du bas";
    d.style.cssText = "position:absolute;left:20px;color:#000;font-size:18px;z-index:1";
    d.style.top = (document.body.scrollHeight - 30) + "px";
    document.body.appendChild(d);
  },
  debordement: () => {       // élément plus large que la fenêtre
    const d = document.createElement("div");
    d.textContent = "DEFAUT INJECTE";
    d.style.cssText = "width:3000px;height:20px;background:red";
    document.body.appendChild(d);
  },
  image: () => {             // image dont le fichier n'existe pas
    const i = document.createElement("img");
    i.src = "/images/ce-fichier-nexiste-pas.jpg"; i.alt = "DEFAUT INJECTE";
    document.body.appendChild(i);
  },
  console: () => { console.error("DEFAUT INJECTE — erreur de console"); },
};

// Les sections `.reveal` s'animent à l'entrée dans la fenêtre. Mesurer
// pendant l'animation donne des rectangles faux — c'est exactement d'où
// venaient les « chiffres inventés » d'une première tentative d'audit. On
// exige donc deux mesures identiques à 250 ms d'intervalle avant de juger.
const stabiliser = async (page, essais = 12) => {
  const empreinte = () => page.evaluate(() => {
    const e = [...document.querySelectorAll("h1,h2,header,.container")].slice(0, 25);
    return e.map((x) => { const r = x.getBoundingClientRect(); return `${Math.round(r.top)},${Math.round(r.height)}`; }).join("|");
  });
  let prec = await empreinte();
  for (let i = 0; i < essais; i++) {
    await page.waitForTimeout(250);
    const cur = await empreinte();
    if (cur === prec) return true;
    prec = cur;
  }
  return false;
};

const defiler = async (page) => {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40));
    }
  });
  await page.waitForTimeout(350);
};

async function routes(base) {
  const seule = opt("route");
  if (seule) return [seule];
  const r = await fetch(`${base}/sitemap.xml`);
  const xml = await r.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const chemins = urls.map((u) => { try { return new URL(u).pathname; } catch { return null; } }).filter(Boolean);
  return [...new Set(chemins)].sort();
}

// --- Programme ---------------------------------------------------------------
let serveur;
const arreter = () => { if (serveur && !serveur.killed) { try { process.kill(-serveur.pid); } catch {} } };
process.on("exit", arreter); process.on("SIGINT", () => { arreter(); process.exit(130); });

try {
  if (!flag("no-build")) { console.log("→ construction…"); await sh("npm", ["run", "build"]); }
  else if (!existsSync(join(RACINE, ".next"))) throw new Error("--no-build mais aucun .next");

  const port = await portLibre();
  const base = `http://127.0.0.1:${port}`;
  console.log(`→ serveur NEUF sur ${port}…`);
  serveur = spawn("npx", ["next", "start", "-p", String(port)], { cwd: RACINE, detached: true, stdio: "ignore" });
  if (!(await attendre200(base + "/"))) throw new Error(`le serveur n'a jamais répondu 200 sur ${base}`);
  console.log("  serveur prêt (200 vérifié)\n");

  mkdirSync(SORTIE, { recursive: true });
  const liste = await routes(base);
  console.log(`→ ${liste.length} routes × ${LARGEURS.length} largeurs\n`);

  const nav = await chromium.launch();
  const echecs = [];
  const lignes = [];

  for (const L of LARGEURS) {
    const ctx = await nav.newContext({
      viewport: { width: L.width, height: L.height },
      isMobile: L.mobile, hasTouch: L.mobile, deviceScaleFactor: L.mobile ? 3 : 1,
      ...(L.ua ? { userAgent: L.ua } : {}),
    });
    for (const route of liste) {
      const page = await ctx.newPage();
      const erreurs = [];
      page.on("console", (m) => {
        if (m.type() !== "error") return;
        // Le texte d'un « Failed to load resource » ne contient PAS l'URL —
        // il faut regarder la localisation du message, sinon le bruit passe.
        const ou = (m.location && m.location().url) || "";
        if (estBruit(m.text()) || estBruit(ou)) return;
        erreurs.push(m.text().slice(0, 140) + (ou ? ` ← ${ou.slice(-60)}` : ""));
      });
      page.on("requestfailed", (r) => { if (!estBruit(r.url())) erreurs.push(`requête échouée: ${r.url().slice(-70)}`); });
      page.on("response", (r) => { if (r.status() >= 400 && !estBruit(r.url())) erreurs.push(`HTTP ${r.status()} ← ${r.url().slice(-70)}`); });
      page.on("pageerror", (e) => erreurs.push("pageerror: " + String(e.message).slice(0, 140)));

      let m, statut = 0;
      try {
        const rep = await page.goto(base + route, { waitUntil: "networkidle", timeout: 30000 });
        statut = rep ? rep.status() : 0;
        await defiler(page);
        const inj = opt("injecter");
        if (inj) {
          if (!INJECTIONS[inj]) throw new Error(`injection inconnue : ${inj}`);
          await page.evaluate(INJECTIONS[inj]);
          await page.waitForTimeout(250);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        if (!(await stabiliser(page))) erreurs.push("mise en page jamais stabilisée (animations sans fin ?)");
        m = await page.evaluate(MESURE);
        // La barre du bas se juge en bas de page, là où elle recouvre.
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await stabiliser(page);
        const bas = await page.evaluate(MESURE);
        m.sousBarreBas = bas.sousBarreBas;
        await page.evaluate(() => window.scrollTo(0, 0));
        await stabiliser(page);
        const nom = (route === "/" ? "accueil" : route.replace(/^\//, "").replace(/\//g, "_"));
        await page.screenshot({ path: join(SORTIE, `${L.nom}-${nom}.png`), fullPage: false });
      } catch (e) {
        echecs.push({ route, largeur: L.nom, quoi: "chargement", detail: String(e.message).slice(0, 120) });
        await page.close(); continue;
      }

      const p = [];
      if (statut >= 400) { p.push(`HTTP ${statut}`); echecs.push({ route, largeur: L.nom, quoi: "http", detail: statut }); }
      if (m.sousEnTete.length) { p.push(`sous en-tête ×${m.sousEnTete.length}`); echecs.push({ route, largeur: L.nom, quoi: "recouvrement en-tête", detail: m.sousEnTete.map((c) => `${c.sel} (${c.px}px) « ${c.texte} »`).join(" · ") }); }
      if (m.sousBarreBas.length) { p.push(`sous barre bas ×${m.sousBarreBas.length}`); echecs.push({ route, largeur: L.nom, quoi: "recouvrement barre bas", detail: m.sousBarreBas.map((c) => `${c.sel} (${c.px}px) « ${c.texte} »`).join(" · ") }); }
      if (m.deborde) { p.push(`déborde ${m.doc}>${m.vp}`); echecs.push({ route, largeur: L.nom, quoi: "débordement", detail: m.coupablesLargeur.map((c) => `${c.sel} → ${c.droite}px`).join(" · ") }); }
      if (m.imagesCassees.length) { p.push(`images cassées ×${m.imagesCassees.length}`); echecs.push({ route, largeur: L.nom, quoi: "image cassée", detail: m.imagesCassees.join(" · ") }); }
      if (erreurs.length) { p.push(`console ×${erreurs.length}`); echecs.push({ route, largeur: L.nom, quoi: "console", detail: erreurs.join(" · ") }); }

      lignes.push(`  ${(L.nom + " " + route).padEnd(44)} ${p.length ? "✖ " + p.join(", ") : "✓"}`);
      await page.close();
    }
    await ctx.close();
  }
  await nav.close();

  console.log(lignes.join("\n"));
  writeFileSync(join(SORTIE, "rapport.json"), JSON.stringify({ routes: liste, echecs }, null, 2));

  console.log(`\ncaptures : .audit-visuel/  (${liste.length * LARGEURS.length} fichiers)`);
  if (echecs.length) {
    console.error(`\n✖ AUDIT VISUEL : ${echecs.length} défaut(s)\n`);
    for (const e of echecs) console.error(`  [${e.largeur}] ${e.route}\n    ${e.quoi} : ${e.detail}\n`);
    arreter(); process.exit(1);
  }
  console.log(`\n✓ AUDIT VISUEL : ${liste.length} routes × ${LARGEURS.length} largeurs, aucun défaut.`);
  arreter(); process.exit(0);
} catch (e) {
  console.error("✖ audit interrompu :", e.message);
  arreter(); process.exit(2);
}
