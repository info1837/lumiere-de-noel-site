# lumiere-de-noel-site — Solution Lumière de Noël inc.

## Pile
- Next.js 14 (App Router), JSX simple (pas de TypeScript), styles en ligne + `app/globals.css`, **pas de Tailwind**.
- Couleurs, coordonnées (`company`), services, villes : `components/data.js` (source unique). Domaine canonique : `lib/site-url.js` (`https://www.lumieredenoelinc.com`, override `NEXT_PUBLIC_SITE_URL`).
- `npm run build` = `check-photos` → `next build` → `check-pixel-lead`. Autres garde-fous : `npm run check:*` (ex. `check:seo` contre un serveur lancé : description ≤ 155 c., canonical www, un seul H1, titres uniques).

## Déploiement
- Vercel (`vercel.json` : `framework: nextjs`). README : `npx vercel deploy --prod` (repo GitHub `info1837/lumiere-de-noel-site`, travail par PR vers `main`). Ne jamais commiter ni afficher `.env*`.

## Page /concours (règlement du concours Meta)
- Le texte de `app/concours/page.jsx` DOIT correspondre à la config du concours dans le CRM :
  fin des inscriptions **31 octobre 2026 à 23 h 59 (HE)**, tirage **1er novembre 2026**,
  **15 %** de rabais aux participants pour une installation réservée **au plus tard le 15 novembre 2026**.
  Toute modification d'une de ces valeurs se fait des deux côtés en même temps.
- La ligne RACJ (« [À COMPLÉTER — Déclaration à la Régie…] ») est un espace réservé géré par le propriétaire : ne pas l'inventer ni la retirer.
- Ne jamais afficher de prix au pied linéaire (ni sur /concours ni ailleurs dans le texte du concours).

## Git
- Worktrees uniquement dans `~/Code/worktrees/lumiere-de-noel-site-<branche>`, jamais sur le Bureau ni dans iCloud. Retirer le worktree une fois la branche fusionnée ou poussée.
