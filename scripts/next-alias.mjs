// Résout l'alias `@/` de Next pour que les scripts Node puissent importer
// les modules du site tels quels. Sans lui, `import … from "@/lib/…"`
// échoue avec ERR_MODULE_NOT_FOUND et aucun test ne peut charger
// components/data.js.
//
// On choisit le candidat avec existsSync : next() ne lève pas de façon
// synchrone, donc un try/catch autour de lui ne sait pas si le chemin
// existe et laisse passer l'extension manquante.
import { pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
const ROOT = path.join(import.meta.dirname, '..');
export function resolve(spec, ctx, next) {
  if (spec.startsWith('@/')) {
    const base = path.join(ROOT, spec.slice(2));
    const cand = [base, `${base}.js`, `${base}.jsx`, `${base}.mjs`, path.join(base, 'index.js')]
      .find((c) => { try { return fs.statSync(c).isFile(); } catch { return false; } });
    if (cand) return next(pathToFileURL(cand).href, ctx);
  }
  return next(spec, ctx);
}
