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

## Effets et performance (règle permanente, 2026-10-26)
- **Défilement natif partout** : aucun smooth-scroll (JS ou `scroll-behavior`), aucun `scroll-snap`, aucun parallaxe, rien de piloté par le défilement. Aucune librairie d'animation (framer-motion, GSAP, AOS, Lenis…).
- **Premier écran immobile** : hero, titre, bandeau, guirlande s'affichent tels quels, sans fondu ni cascade. Une section de premier écran qui n'est pas `.hero-section` porte `data-sans-apparition`.
- **Plus bas** : seulement l'apparition de `components/FestiveLayer.jsx` (opacité + 10 px, 320 ms ease-out, une fois, `rootMargin` 15 %, cascade de 3 au plus). L'état masqué n'existe que sous `html.mvt` : sans JS, tout est visible.
- **Micro-interactions** : survols 150 à 200 ms ; le comparateur avant/après suit le doigt. Aucune boucle `infinite` sauf la démo des DEL (`.led--*`).
- **`prefers-reduced-motion`** : aucune animation (garde global en fin de `globals.css`).
- **Perf** : images en `next/image` avec `sizes`, une seule image `priority` par page (l'image LCP), polices locales (`public/fonts`, préchargées, replis calibrés `Bebas Repli` / `Nunito Repli` à garder dans chaque `font-family`), Meta Pixel différé (stub + chargement après `load`). Garde : `node scripts/check-animations.mjs`. Objectif Lighthouse mobile ≥ 90, CLS < 0,1.

## Déploiement
- Vercel (`vercel.json` : `framework: nextjs`). README : `npx vercel deploy --prod` (repo GitHub `info1837/lumiere-de-noel-site`, travail par PR vers `main`). Ne jamais commiter ni afficher `.env*`.

## Page /concours (règlement du concours)
- Règlement fourni par Yahir le 2026-10-25 (aligné sur la vidéo de la pub) : fin des inscriptions **jeudi 5 novembre 2026 à 23 h 59 (HE)**, tirage **vendredi 6 novembre 2026** en direct sur Instagram, prix jusqu'à **1 000 $** (ligne de toit, jusqu'à 100 pi, installée avant le 20 novembre 2026), résidents de **Blainville, Sainte-Thérèse, Rosemère, Boisbriand**, **15 %** sur une réservation faite **avant le 6 novembre 2026**, remboursement de la valeur du prix si le gagnant a déjà réservé.
- La section RACJ a été retirée à la demande de Yahir (2026-10-25) : ne pas la remettre sans lui.
- Toute modification d'une de ces valeurs se fait aussi dans la config du concours du CRM (palencia-crm `lib/concours-2026.js`).
- Ne jamais afficher de prix au pied linéaire (ni sur /concours ni ailleurs dans le texte du concours).

## Git
- Worktrees uniquement dans `~/Code/worktrees/lumiere-de-noel-site-<branche>`, jamais sur le Bureau ni dans iCloud. Retirer le worktree une fois la branche fusionnée ou poussée.
