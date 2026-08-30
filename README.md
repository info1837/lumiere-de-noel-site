# Solution Lumière de Noël inc. — site web (Next.js)

Reconstruction du site Squarespace expiré de **Solution Lumière de Noël inc.**, en version
**améliorée**, prête à héberger gratuitement sur Vercel. Même pile technique que
`palencia-site` (Next.js 14 App Router, sans TypeScript, sans Tailwind, CSS + tokens JS).

## Démarrer

```bash
cd lumiere-de-noel-site
npm install
npm run dev          # http://localhost:3000
npm run build && npm start   # build de production
```

## Pages

| Page | Route |
|---|---|
| Accueil (6 sections + améliorations) | `/` |
| Éclairage architectural | `/eclairage-architectural` |
| Lumière de Noël (portfolio) | `/lumiere-de-noel` |
| Soumission | `/soumission` |

## ⚠️ À remplir avant la mise en ligne (TODO)

Tous les éléments ci-dessous sont des valeurs de remplacement clairement marquées :

1. **Photos** — voir [`PHOTOS-NEEDED.md`](./PHOTOS-NEEDED.md). Déposez vos vraies
   photos dans `public/images/` **en gardant exactement les mêmes noms de fichiers**.
   Aucune modification de code nécessaire.
2. **Formspree** — dans `components/data.js`, remplacez `FORMSPREE_ENDPOINT`
   (`https://formspree.io/f/YOUR_FORM_ID`) par votre vrai ID de formulaire
   ([formspree.io](https://formspree.io)). Sans ça, les formulaires ne livrent rien.
3. **Meta Pixel** (optionnel) — dans `app/layout.jsx`, remplacez `META_PIXEL_ID`.
   Tant qu'il vaut `YOUR_PIXEL_ID`, le pixel reste **désactivé** (aucun script chargé).
4. **Domaine** — dans `components/data.js`, `company.baseUrl` est
   `https://www.lumieredenoelinc.ca`. Ajustez si le domaine final diffère
   (utilisé par les métadonnées SEO, le sitemap et le JSON-LD).
5. **Témoignages** — dans `components/data.js`, le tableau `testimonials`
   contient des `PLACEHOLDER`. Collez de vrais avis Google/Facebook (texte + nom + ville).
6. **Réseaux sociaux & nombre d'avis** — `company.social` et `company.rating.count`
   dans `components/data.js`.
7. **Logo** — ✅ fait. Le vrai logo officiel a été récupéré depuis le formulaire
   en ligne (`formulaire.lumieredenoelinc.ca`) et est déjà en place dans l'en-tête
   et le pied de page (`public/images/logo.png`).

> **Note d'honnêteté :** le texte intégral de l'ancien site Squarespace n'a pas pu
> être récupéré dans cette session (site hors ligne, aucun outil navigateur). La
> structure et les titres connus proviennent de la spec ; les paragraphes plus longs
> sont marqués `DRAFT COPY` dans le code et rédigés dans la voix de marque — à
> remplacer si le texte original est retrouvé.

## Contrôles automatiques

Deux gardes tournent sur ce dépôt. Les deux sont conçus pour **échouer**,
pas pour rassurer.

### `npm run build` — garde des photos

`scripts/check-photos.mjs` casse la compilation si :

- une image référencée par le code n'existe pas sur le disque ;
- deux villes partagent la même photo ;
- une image **non réelle** nomme une ville dans son alt ;
- une page de ville affiche la photo d'une **autre** ville.

Le dernier point existe parce qu'il est parti en production : `/secteur/laval`
affichait la maison de Terrebonne, légendée « à Terrebonne ».

### `npm run audit:visuel` — audit visuel

Construit, démarre **son propre serveur** sur un port libre, attend un vrai
200, puis charge chaque route du sitemap en Playwright à **390×844** et
**1440×900**. Par route et par largeur, il affirme :

1. aucun texte sous l'en-tête fixe ;
2. aucun texte sous la barre d'action du bas ;
3. aucun débordement horizontal ;
4. aucune image cassée ;
5. aucune erreur de console (les scripts d'analytics Vercel, qui n'existent
   qu'en production, sont exclus).

Une capture par route et par largeur atterrit dans `.audit-visuel/`.

Il existe parce que trois défauts sont partis en production sans que rien les
voie : un en-tête fixe qui recouvrait le h1 de **toutes** les pages sauf
l'accueil, une barre du bas plus haute que la réserve du `body`, et un flocon
`content: "❄"` rendu en emoji couleur sur iOS. Les contrôles d'alors
regardaient le débordement et les images — jamais le **recouvrement** par un
élément fixe.

### `npm run audit:visuel:autotest` — l'audit qui vérifie l'audit

Casse volontairement une page, une fois par contrôle, et exige que le contrôle
correspondant passe au rouge — puis que la même page sans injection passe au
vert.

**Un audit visuel incapable d'échouer est pire que pas d'audit** : il rend
« ok » et on cesse de regarder. Lancer l'autotest après toute modification de
`scripts/audit-visuel.mjs`.

## Déploiement (Vercel)

```bash
npx vercel deploy --prod
```

Aucune redirection de domaine n'est encore configurée dans `vercel.json`
(à ajouter une fois le domaine choisi, sur le modèle de `palencia-site`).

## Améliorations appliquées vs. l'ancien site

- Méta-descriptions + OpenGraph/Twitter sur chaque page (l'ancien site était vide).
- Bouton **tap-to-call** persistant dans l'en-tête (conversion mobile).
- Bandeau de **témoignages** (structure prête, à remplir).
- Section **« Zone de service »** listant les villes (SEO local).
- Slugs propres — correction du typo `/home#servicess` de l'ancien site.
- **JSON-LD LocalBusiness** (téléphone, courriel, `areaServed`, etc.).
- Favicon / app-icon (l'ancien site utilisait le défaut Squarespace).
- Accessibilité : lien d'évitement, focus visible, libellés, `alt`, `prefers-reduced-motion`.
- Mobile/perf : grilles responsives, images en `loading="lazy"`, zéro dépendance lourde.

## Structure

```
app/            layout, pages, robots, sitemap, nav (ClientLayout), footer
components/     data.js (tokens + contenu), ui.jsx, Hero.jsx, QuoteForm.jsx
public/images/  placeholders étiquetés (à remplacer)
```
