// /formation — formation des installateurs, pour les employés.
//
// Un gestionnaire de route et non une page : c'est un outil mobile plein
// écran, donc aucun layout racine (ni en-tête, ni pied de page, ni pixel, ni
// balise Google Ads). Le HTML vit tel quel dans formation.html ; il est lu une
// fois au build et servi en statique. Noindex dans le fichier, et volontairement
// absent de app/sitemap.js. Ne pas l'interdire dans robots.js : Google doit
// pouvoir lire le noindex.

import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-static';

export async function GET() {
  const html = await readFile(path.join(process.cwd(), 'app/formation/formation.html'), 'utf8');
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
