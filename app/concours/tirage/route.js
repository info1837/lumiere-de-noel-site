// /concours/tirage — le dévoilement du tirage, filmé au téléphone pour Instagram.
//
// Un gestionnaire de route et non une page, comme /formation : plein écran,
// donc aucun layout racine (ni en-tête, ni pied de page, ni pixel, ni balise
// Google Ads). Données fixes dans tirage.html : aucun appel au CRM, le tirage
// a eu lieu le 6 novembre (palencia-crm scripts/concours-2026-tirage.mjs).
// Noindex dans le fichier et dans l'en-tête, volontairement absent de
// app/sitemap.js. Ne pas l'interdire dans robots.js : Google doit pouvoir lire
// le noindex.

import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-static';

export async function GET() {
  const html = await readFile(path.join(process.cwd(), 'app/concours/tirage/tirage.html'), 'utf8');
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' },
  });
}
