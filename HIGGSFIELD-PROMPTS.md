# Batch de génération Higgsfield — Lumière de Noël inc.

Fichier de travail : tous les prompts pour générer les 24 images du site via le MCP
Higgsfield, puis recadrer / optimiser / placer dans `public/images/`.

## Réglages
- Modèle image photoréaliste (Soul 2.0 / Flux 2 / Seedream — le plus réaliste).
- **SUFFIXE** (à concaténer à CHAQUE prompt) :
  > `— shot on full-frame DSLR, 24mm wide lens, long exposure, professional real-estate exterior photography, blue-hour deep navy twilight sky, fresh Québec snow, warm-white champagne-gold C9 LED bulbs, crisp sharp focus, high dynamic range, cinematic color grade, photorealistic, ultra-detailed`
- **NEGATIVE** (partout) :
  > `people, text, watermark, logo, daytime, harsh sun, oversaturated, gaudy, cartoon, CGI look, blurry, distorted architecture, extra roofs`

---

## HERO — ratio 16:9 (~1920×1080)

- **hero-accueil.jpg** — Upscale two-storey suburban Québec home at blue hour, every roofline/eaves/gable elegantly outlined with warm-white C9 Christmas bulbs, snow-covered lawn, two evergreens wrapped in fairy lights, soft golden window glow, **lit house on the RIGHT half, LEFT third = darker open sky + snow (negative space for text)**, classy not tacky.
- **eclairage-hero.jpg** — Modern architect-designed Québec home at dusk with permanent architectural LED lighting: clean continuous warm-white linear light tracing soffits/rooflines/gables, no traditional bulbs, minimalist, sophisticated, snow, deep navy sky, premium.
- **noel-hero.jpg** — Spectacular fully decorated Québec residence at night, abundant warm-white with tasteful red/green accents, lit garlands, wreaths, illuminated trees, gentle falling snow, magical yet elegant.

## MISE EN VALEUR — ratio 4:3 (~1600×1200)

- **valeur-commercial.jpg** — Upscale commercial building/storefront at dusk, facade + parapet outlined with elegant warm-white architectural lights, inviting professional ambience, snow, blue hour.
- **eclairage-feature.jpg** — Extreme close-up macro of discreet permanent mini LED puck lights installed under a house soffit/fascia edge, warm-white glow, shallow depth of field, premium product-detail shot at dusk.

## CARTES SERVICES — ratio 4:3 (~1400×1050)

- **service-residentiel.jpg** — Cozy single-family Québec bungalow, roofline outlined in warm-white lights, snowy yard, one lit evergreen.
- **service-commercial.jpg** — Retail/business facade with refined warm-white light outlining, professional and welcoming, evening.
- **service-municipal.jpg** — Civic scene: town hall + public park, large mature trees fully wrapped in lights, lamp posts with garlands, grand municipal display, snow.

## GALERIE ÉCLAIRAGE ARCHITECTURAL — ratio 4:3 (~1400×1050)

- **eclairage-blainville.jpg** — Elegant Blainville Québec home with permanent warm-white architectural LED outlining rooflines, evening, snow.
- **eclairage-terrebonne.jpg** — Terrebonne Québec two-storey house, crisp permanent linear LED along soffits and gables, dusk.
- **eclairage-magog.jpg** — Magog Québec lakeside-style home with permanent warm-white architectural lighting, blue hour, snow.

## PORTFOLIO LUMIÈRE DE NOËL — ratio 4:3 (~1400×1050)

Varier le type de maison + l'angle (façade / 3-4 / entrée) pour que les 13 diffèrent.

- **noel-blainville-01.jpg** — Suburban Blainville house, rooflines + shrubs outlined warm-white, snow, street view.
- **noel-blainville-02.jpg** — Larger Blainville two-storey, 3/4 angle, warm-white roof + garlands on porch.
- **noel-terrebonne-01.jpg** — Terrebonne brick cottage, warm-white roofline + lit columns, snowy walkway.
- **noel-terrebonne-02.jpg** — Terrebonne bungalow, front-facing, eaves + window frames in warm-white, evergreen lit.
- **noel-brossard-01.jpg** — Modern Brossard residence, clean warm-white roofline, minimalist, dusk.
- **noel-sherbrooke-01.jpg** — Sherbrooke hillside home, full warm-white outline + wrapped trees, deep snow.
- **noel-montreal-01.jpg** — Montréal duplex/triplex, balconies + rooflines in warm-white lights, urban winter evening.
- **noel-sainte-julienne-01.jpg** — Rural Sainte-Julienne country house, generous warm-white outlining + barn, lots of snow.
- **noel-sainte-anne-01.jpg** — Sainte-Anne-des-Plaines family home, roof + bushes + porch garland warm-white, blue hour.
- **noel-granby-01.jpg** — Granby two-storey, symmetrical warm-white roofline + entry arch lights, snowy.
- **noel-mercier-01.jpg** — Mercier bungalow, cozy warm-white eaves + lit small trees, evening.
- **noel-lery-01.jpg** — Léry waterfront-style home, elegant warm-white architectural + tree wraps, dusk snow.
- **noel-magog-01.jpg** — Magog chalet-style residence, warm-white roofline + dormers, mountain winter ambience.

---

## Procédure d'exécution (après OAuth + redémarrage)
1. Pour chaque entrée : `prompt + SUFFIXE`, negative ci-dessus, ratio indiqué, modèle photoréaliste.
2. Télécharger le résultat → recadrer exactement au ratio cible → optimiser (JPEG q≈82) →
   écrire dans `public/images/<nom-de-fichier>` (remplace le placeholder).
3. Galeries : légendes de ville déjà fixées dans `components/data.js` (ne pas changer les noms).
4. Redémarrer le serveur dev, vérifier le rendu.
