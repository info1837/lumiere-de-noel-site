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
- **Micro-interactions** : survols 150 à 200 ms ; le comparateur avant/après suit le doigt. Aucune boucle `infinite` sauf la démo des DEL (`.led--*`) et la lueur lente du cadre « ampoule » (`.cadre-ampoule__lueur`, demandée par Yahir le 2026-11-11).
- **`prefers-reduced-motion`** : aucune animation (garde global en fin de `globals.css`).
- **Perf** : images en `next/image` avec `sizes`, une seule image `priority` par page (l'image LCP), polices locales (`public/fonts`, préchargées, replis calibrés `Bebas Repli` / `Nunito Repli` à garder dans chaque `font-family`), Meta Pixel différé (stub + chargement après `load`). Garde : `node scripts/check-animations.mjs`. Objectif Lighthouse mobile ≥ 90, CLS < 0,1.

## Vidéo du hero d'accueil (2026-11-11)
- **Téléphone / écran vertical** : `public/videos/hero-portrait.mp4` (1080×1920, 13,1 s, 2,7 Mo, H.264 sans piste audio, faststart) + `hero-portrait.jpg` (affiche = image 0 du montage, `debut: 0`). Montage muet de 8 plans drone en coupes franches (≈ 1,6 s, dernier 2 s) : pignon de pierre (Terrebonne) → sapin en orbite (Terrebonne) → maison entière (Blainville) → pignon en mouvement (Sainte-Anne) → orbite (Saint-Valentin) → pignon en montée (Blainville) → survol (Lorraine) → recul du drone (Sainte-Anne, accéléré ×2), puis la boucle repart sur le pignon.
- **Étalonnage commun** : chaque plan est d'abord ramené à la même balance des lumières (R/G ≈ 1,2, B/G ≈ 0,55 — Saint-Valentin et le sapin étaient jaune-vert), puis une seule courbe : ombres tirées vers le marine de la page (#0A1524), lumières chaudes, saturation +12 %. Expositions ajustées pour que la coupe de la boucle (dernier → premier plan) ne saute pas. Aucun passant, aucun texte, aucun nom de client (villes seulement).
- **Desktop** : la photo de Mirabel (`PHOTOS["mirabel-01"]`, clé `AFFICHE_PAYSAGE` dans `lib/hero-media.js`), **sans vidéo** (`paysage.video = null`). Il n'existe qu'UN plan de nuit tourné en paysage (DJI_0457, Terrebonne, avec passants et poteaux) : il en faut au moins 6 pour un montage desktop — demandés au monteur. Ne jamais recadrer les plans verticaux en 16/9. Mirabel ne doit pas revenir dans la vitrine (`check-photos` §7 la compte).
- **Pages de secteur** (`/secteur` et chaque `/secteur/<ville>`) : le même montage, par `HeroPage montage` (`components/sections.jsx`) — affiche du montage + `HeroVideo` en portrait, la photo de la page (`arbre-enrubanne`) sans vidéo sur desktop ; titre, texte, boutons et voile (`.hero-voile`) de chaque page inchangés. Sans la prop `montage`, `HeroPage` ne change pas (services, page commerciale, blog, ville × service). `/secteur` n'avait pas de zone d'image : il a pris le gabarit `HeroPage` des villes.
- **`HeroVideo` rend sa connexion en quittant la page** (`pagehide` / démontage : pause, `src` retiré, `load()` ; reprise au retour par « Précédent »). Sans ça, sept pages vidéo de suite dans un onglet épuisaient les 6 connexions par hôte et la page suivante restait bloquée (`check-debordement` en timeout). Ne pas retirer.
- Code : `components/Hero.jsx` (`<picture>` : affiche du montage en portrait, Mirabel sinon = image LCP), `components/HeroVideo.jsx` (portrait seulement, après `load`, rien si `prefers-reduced-motion` ou économie de données), `lib/hero-media.js` (requête média commune, `debut`, clé de l'affiche desktop).
- Rushes : `~/Downloads/lumiere-header/src` (aussi dans le dossier Google Drive « drone »). Nouvelle affiche portrait = re-mesurer `debut` (image du montage d'où elle est tirée), sinon la vidéo saute au démarrage.

## Cadre « ampoule » (2026-11-11)
- **Ce que c'est** : l'ampoule du logo comme cadre photo — contour crème et culot EXACTS du logo (tracés copiés dans `lib/logo-ampoule.js`, vérifiés mot pour mot contre `public/images/icone-pour-fond-fonce.svg` par `check-photos` §8b : on ne redessine pas le logo), sans le S ; la photo reste droite dans le verre incliné (17°) ; lueur ambrée qui respire (coupée sous `prefers-reduced-motion`) ; étalonnage CSS (pierre plus sombre et froide, guirlandes chaudes), photo jamais retouchée.
- **Code** : `components/CadreAmpoule.jsx` (`CadreAmpoule` réutilisable : `photo`, `inclinaison`, `placement`, `placementMobile` ; `CadreAmpouleOffre` pour les sections offre), `lib/logo-ampoule.js` (tracés + `geometrieAmpoule(deg)`), styles `.cadre-ampoule*` et `.offre--cadre` dans `app/globals.css`.
- **Où** : accueil, section « Votre propriété, illuminée — sans le tracas » (`app/page.jsx`) ; page commerciale, « Ce qui est compris » (`CeQuiEstCompris` + `cadre` dans `components/data.js`). Photo : `PHOTOS["installateur-vieux-montreal"]` (Vieux-Montréal).
- **Desktop (approuvé)** : grand visuel à gauche, plus haut que le texte, sort par le bas de la section. **Téléphone (approuvé)** : petite ampoule à droite du prix et du bouton, sans grandir la section (47 % de l'écran, 46 % plafonné à 180 px sur la page commerciale, où le bloc prix est plus court) ; rythme vertical resserré.
- **Placements de la photo** (`ampoule`, `ampouleMobile` dans `components/photos.js`) : CALCULÉS par recherche (la photo couvre le verre, tête et mains à distance du contour, corps centré), pas au jugé. Nouvelle photo ou nouvelle taille = recalculer, puis vérifier à 360, 390, 430 et 1440 qu'aucun texte ne touche le contour.

## Déploiement
- Vercel (`vercel.json` : `framework: nextjs`). README : `npx vercel deploy --prod` (repo GitHub `info1837/lumiere-de-noel-site`, travail par PR vers `main`). Ne jamais commiter ni afficher `.env*`.

## Page /concours (règlement du concours)
- Règlement fourni par Yahir le 2026-10-25 (aligné sur la vidéo de la pub) : fin des inscriptions **jeudi 5 novembre 2026 à 23 h 59 (HE)**, tirage **vendredi 6 novembre 2026** en direct sur Instagram, prix jusqu'à **1 000 $** (ligne de toit, jusqu'à 100 pi, installée avant le 20 novembre 2026), résidents de **Blainville, Sainte-Thérèse, Rosemère, Boisbriand**, **15 %** sur une réservation faite **avant le 6 novembre 2026**, remboursement de la valeur du prix si le gagnant a déjà réservé.
- La section RACJ a été retirée à la demande de Yahir (2026-10-25) : ne pas la remettre sans lui.
- Toute modification d'une de ces valeurs se fait aussi dans la config du concours du CRM (palencia-crm `lib/concours-2026.js`).
- Ne jamais afficher de prix au pied linéaire (ni sur /concours ni ailleurs dans le texte du concours).

## Git
- Worktrees uniquement dans `~/Code/worktrees/lumiere-de-noel-site-<branche>`, jamais sur le Bureau ni dans iCloud. Retirer le worktree une fois la branche fusionnée ou poussée.
