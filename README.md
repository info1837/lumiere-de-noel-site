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
