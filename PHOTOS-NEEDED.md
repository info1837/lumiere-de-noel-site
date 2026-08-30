# Photos du site — Solution Lumière de Noël inc.

**Toutes les images générées ont été retirées du dépôt.** Il ne reste que de
vraies photos de chantiers, prises entre le 13 novembre et le 10 décembre 2025.

---

## ⚠️ Lisez ceci avant de déposer une photo

L'ancienne version de ce fichier disait : *« dépose le fichier avec exactement
le même nom — aucun code à toucher »*. **C'était un piège**, et il s'est
refermé : le même fichier servait Blainville, Laval et le portfolio. Une vraie
photo déposée sur ce nom aurait mis **une seule maison sur trois pages de
ville**, chacune la présentant comme un chantier local.

Le mappage est maintenant **explicite**, une clé par ville, dans
[`components/photos.js`](./components/photos.js). Déposer un fichier ne suffit
plus — et c'est voulu.

---

## Ajouter une vraie photo

1. Déposer le fichier dans **`public/images/reel/`**
2. Ajouter son entrée dans `PHOTOS` (`components/photos.js`) avec sa ville et
   un `alt` descriptif
3. Pointer la ville vers cette clé dans `CITY_PHOTO`

```js
"laval-01": {
  src: `${REEL_PREFIX}noel-laval-01.jpg`,
  ville: "Laval",
  alt: "Maison illuminée pour les Fêtes à Laval — ligne de toit et arbustes",
},
// puis :  laval: "laval-01",
```

`npm run build` refuse de compiler si le fichier n'existe pas, si deux villes
partagent la même photo, ou si une image **non réelle** nomme une ville.

---

## Les deux règles

> **1.** Seule une photo vivant sous `public/images/reel/` a le droit de nommer
> une ville dans son `alt`. Tout le reste reste générique — pour toujours.
>
> **2.** Une page de ville ne montre **jamais** la photo d'une autre ville.
> Sa propre photo, ou une générique. Jamais la maison du voisin légendée
> « à Terrebonne ».

La règle 2 existe parce qu'elle a été violée en production : les cartes de
service choisissaient leur image par **type de service** et court-circuitaient
le mappage par ville. `/secteur/laval` affichait la maison de Terrebonne, avec
« à Terrebonne » dans l'alt. Trois photos portaient tout le site.

**Photos SITUÉES** (`ville:` renseignée) : réservées à leur ville.
**Photos GÉNÉRIQUES** (pas de `ville`, aucun nom de ville dans l'alt) :
utilisables partout, y compris sur une ville qu'on n'a pas photographiée.

C'est `scripts/check-photos.mjs` qui l'applique, pas la bonne volonté du
prochain qui passe. Lancer seul : `npm run check:photos`.

---

## Photos manquantes (3)

Perdues lors d'une manipulation Git du 2026-08-30. À redéposer dans
`public/images/reel/` :

| Fichier | Sert à |
|---|---|
| `noel-lery-01.jpg` | Léry (Rive-Sud) **et la section valeur de l'accueil** — elle montre ligne de toit, colonnes, arbustes et arbres dans un seul cadre |
| `noel-mercier-01.jpg` | Mercier — **la version pivotée**, pas celle couchée |
| `noel-montreal-01.jpg` | page ville Montréal |

En attendant, les villes concernées affichent une photo **générique** (sans
nom de ville dans l'alt) — jamais celle d'une autre ville.


## Villes sans photo

| Ville | État |
|---|---|
| Montréal | photo perdue — à redéposer |
| Laval | aucun chantier photographié |
| Rive-Sud | Léry est sur la Rive-Sud — photo perdue, à reverser ici |

Une ville sans photo affiche son titre sur le fond marine dégradé. C'est propre,
et c'est vrai.

---

## Photos non classées

Quatre vraies photos traînent à la racine de `public/` sans être rattachées :
`IMG_5046.jpg`, `3473D25A-…jpg`, `Image 1.jpg`, `Image 2.jpg`. Certaines sont
peut-être les manquantes ci-dessus. À identifier, renommer et déplacer dans
`reel/`.

## Éclairage permanent

Cinq photos prouvent ce service (`perm-led*.jpg`, `permanent 2.jpg`). Ce n'est
pas un service hypothétique : il a sa page, et il mérite sa propre tarification
— **pas** le 12 $/pi linéaire saisonnier.
