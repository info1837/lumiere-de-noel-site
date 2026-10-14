# lumiere-de-noel-site — Solution Lumière de Noël inc.

## Pile
- Next.js 14 (App Router), JSX simple (pas de TypeScript), styles en ligne + `app/globals.css`, **pas de Tailwind**.
- Couleurs, coordonnées (`company`), services, villes : `components/data.js` (source unique). Domaine canonique : `lib/site-url.js` (`https://www.lumieredenoelinc.com`, override `NEXT_PUBLIC_SITE_URL`).
- `npm run build` = `check-photos` → `next build` → `check-pixel-lead`. Autres garde-fous : `npm run check:*` (ex. `check:seo` contre un serveur lancé : description ≤ 155 c., canonical www, un seul H1, titres uniques).

## Cohérence site ↔ CRM ↔ Sophie ↔ pubs (règle permanente)
- **Source unique** pour le téléphone, le courriel, les réseaux sociaux, le prix d'entrée et la région : `company` dans `components/data.js`. Jamais un numéro, un courriel ou un prix écrit en dur dans une page, une meta, l'OG ou le JSON-LD.
- **Places de la saison** : le CRM, et rien d'autre (`lum_places_saison`, posé par `palencia-crm/scripts/multi-business/poser-places-saison-lumiere.mjs` ; capacité par mois `lum_capacite_semaine` en repli). Le site les lit via `lib/disponibilites.js`. Les pubs Meta doivent dire le même chiffre — si on le change, on change la clé ET les pubs.
- **Offre** (−15 % si le client RÉSERVE — dépôt — en octobre, installation n'importe quand avant le 20 novembre ; réservations fermées le 20 novembre) : vient aussi du CRM (`lum_october_discount`, `season_signing_deadline`). Le texte qui la cite doit dire la même chose que Sophie.
- **Parcours** : texto de Sophie en moins d'une minute (8 h–20 h 30) → appel avec Yahir (avant-midi ou après-midi, toiture mesurée sur Google Maps) → prix ferme écrit. Aucune « visite d'évaluation », aucune « réponse sous 24 h ». Les étapes vivent dans `processSteps` (`components/data.js`).
- **Tout nouveau champ de formulaire** doit être (1) relayé par `app/api/lead/route.js` (ou `app/api/calc-noel/route.js`) vers une colonne du CRM (`/api/leads` : `address`, `city`, `service`, `notes`, `formAnswers`…), (2) visible dans le contexte de Sophie (CRM : `lib/lumiere-qualification.js` → `ceQueLaFicheSait`, `lib/sophie-v2/contexte.js`), et (3) couvert par `scripts/dry-run-formulaires.mjs`. Un champ qui n'arrive pas jusqu'à Sophie, c'est une question qu'elle reposera au client.
- **L'adresse** est demandée sur tous les formulaires (« Adresse de la propriété », `components/AdresseAutocomplete.jsx` → `/api/adresse`) et part dans `address` + `city`, les mêmes champs que le formulaire Meta : Sophie la CONFIRME au lieu de la demander.
- **Saisonnier vs permanent** : retrait, entreposage et « de la pose au retrait » ne valent que pour les lumières saisonnières ; le permanent reste en place toute l'année (garantie 10 ans, sur soumission). `/permanent` redirige vers `/services/eclairage-architectural-permanent`.
- **Aucune mention de Palencia** sur le site, sauf la divulgation légale de `/confidentialite` (même outil de gestion des clients).

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
