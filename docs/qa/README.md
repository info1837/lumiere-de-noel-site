# Preuves visuelles

Captures Playwright prises sur les déploiements preview. Elles servent à la
revue et peuvent être supprimées ensuite.

## seo-p0 — accueil

- `accueil-1440x900.png`
- `accueil-390x844.png`

Mesures au même moment : entête 81 px (desktop) / 70 px (mobile), H1 à
181 px dans les deux cas — aucun chevauchement.

## calc-demo — écran de prix de la calculatrice

- `resultat-satellite-1440.png` — chemin carte satellite, 1440×900
- `resultat-manuel-1440.png` — chemin pieds saisis à la main, 1440×900
- `resultat-manuel-390.png` — même chemin, mobile 390×844
- `maquette-envoyee-1440.png` — confirmation après la demande de maquette

## calc-demo — après rebase sur main (post seo-p0)

- `accueil-1920x1080.png` — hero large, vérifié aussi à 2560×1440

Entête 81 px à 1440, 1920 et 2560 ; H1 à 181 px (317 à 2560, hero centré) —
aucun chevauchement, le formulaire tient dans le hero à toutes ces largeurs.
