// =============================================================================
// Autotest de l'audit visuel — prouve que les contrôles savent passer au ROUGE
// =============================================================================
//   npm run audit:visuel:autotest
//
// Un audit visuel incapable d'échouer est pire que pas d'audit : il rend
// « ok » et on cesse de regarder. Ce fichier casse volontairement une page,
// une fois par contrôle, et exige que le contrôle correspondant échoue.
//
// Il vérifie AUSSI le sens inverse : sans injection, la même route doit
// passer au vert. Un contrôle qui hurle tout le temps ne vaut pas mieux
// qu'un contrôle muet.
// =============================================================================

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROUTE = "/secteur/laval";

const CAS = [
  { inj: null,           attendu: null,                       titre: "sans injection → doit être VERT" },
  { inj: "entete",       attendu: "recouvrement en-tête",     titre: "texte sous l'en-tête fixe" },
  { inj: "barre-bas",    attendu: "recouvrement barre bas",   titre: "texte sous la barre du bas" },
  { inj: "debordement",  attendu: "débordement",              titre: "élément plus large que la fenêtre" },
  { inj: "image",        attendu: "image cassée",             titre: "image dont le fichier manque" },
  { inj: "console",      attendu: "console",                  titre: "erreur de console" },
];

const lancer = (inj) => {
  const a = ["scripts/audit-visuel.mjs", "--no-build", `--route=${ROUTE}`];
  if (inj) a.push(`--injecter=${inj}`);
  const r = spawnSync("node", a, { cwd: RACINE, encoding: "utf8" });
  let rapport = { echecs: [] };
  const f = join(RACINE, ".audit-visuel", "rapport.json");
  if (existsSync(f)) { try { rapport = JSON.parse(readFileSync(f, "utf8")); } catch {} }
  return { code: r.status, echecs: rapport.echecs || [] };
};

if (!existsSync(join(RACINE, ".next"))) {
  console.error("✖ aucun .next — lancer `npm run build` d'abord.");
  process.exit(2);
}

console.log(`Autotest — route témoin ${ROUTE}\n`);
let ko = 0;
for (const c of CAS) {
  const { code, echecs } = lancer(c.inj);
  let ok, note;
  if (c.attendu === null) {
    ok = code === 0 && echecs.length === 0;
    note = ok ? "vert comme attendu" : `attendu vert, obtenu code=${code} (${echecs.map((e) => e.quoi).join(", ")})`;
  } else {
    const vu = echecs.some((e) => e.quoi === c.attendu);
    ok = code === 1 && vu;
    note = ok ? `rouge sur « ${c.attendu} »` :
      `attendu ROUGE sur « ${c.attendu} », obtenu code=${code} quoi=[${echecs.map((e) => e.quoi).join(", ") || "rien"}]`;
  }
  if (!ok) ko++;
  console.log(`  ${ok ? "✓" : "✖"} ${c.titre.padEnd(42)} ${note}`);
}

console.log();
if (ko) { console.error(`✖ AUTOTEST : ${ko} contrôle(s) ne se comportent pas comme annoncé.`); process.exit(1); }
console.log("✓ AUTOTEST : chaque contrôle passe au rouge sur son défaut, et au vert sans.");
