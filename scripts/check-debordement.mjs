// =============================================================================
// Garde-fou — aucune page ne défile de côté sur un téléphone
// =============================================================================
//   BASE_URL=http://127.0.0.1:4191 node scripts/check-debordement.mjs
//
// Visite CHAQUE URL du sitemap (plus /simulateur, /merci, /confidentialite
// et le 404) à 375 px, défile jusqu'en bas pour que tout ce qui apparaît
// au défilement soit rendu, et affirme : scrollWidth ≤ innerWidth.
//
// La liste vient du sitemap, pas d'ici : une page ajoutée est vérifiée le
// jour où elle est publiée.
// =============================================================================
import { chromium } from "playwright";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const LARGEUR = 375;

let ok = 0, ko = 0;
const t = (nom, cond, d = "") => {
  console.log(`  ${cond ? "✅" : "❌"} ${nom}${d ? ` — ${d}` : ""}`);
  cond ? ok++ : ko++;
};

const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
const chemins = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
for (const c of ["/simulateur", "/merci", "/confidentialite", "/cette-page-n-existe-pas"]) {
  if (!chemins.includes(c)) chemins.push(c);
}

const nav = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}
);
const ctx = await nav.newContext({
  viewport: { width: LARGEUR, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
});
const page = await ctx.newPage();

console.log(`\n--- ${chemins.length} URLs à ${LARGEUR} px ---`);
for (const c of chemins) {
  await page.goto(BASE + c, { waitUntil: "load" });
  // Jusqu'en bas, par écrans : les révélations au défilement se posent.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  const m = await page.evaluate(() => {
    const de = document.documentElement;
    const fautifs = [...document.querySelectorAll("body *")]
      .filter((e) => e.getClientRects().length && e.getBoundingClientRect().right > innerWidth + 1)
      .filter((e) => getComputedStyle(e).position !== "fixed")
      .slice(0, 3)
      .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]}`);
    return { sw: de.scrollWidth, iw: innerWidth, fautifs };
  });
  t(c, m.sw <= m.iw, m.sw > m.iw ? `${m.sw} > ${m.iw} (${m.fautifs.join(", ")})` : "");
}

await nav.close();
console.log(`\n${ok}/${ok + ko} vérifications passées.`);
process.exit(ko ? 1 : 0);
