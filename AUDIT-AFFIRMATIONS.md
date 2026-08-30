# Audit des affirmations — site Lumière de Noël

Balayé le 2026-08-30 contre `fix/retrait-affirmations-accueil` (`64e30df`),
c'est-à-dire **après** ta passe. Ce qui suit est ce qui reste.

Les corrections déjà faites (superlatif, « saison après saison », marqueurs
`// ASSURANCE`, raison sociale) ne sont pas répétées ici. Les affirmations
d'images (galeries légendées, photos partagées) sont réglées par la PR #3.

**Multiplicateurs** — une phrase peut valoir 24 pages :

| Emplacement | Pages touchées |
|---|---|
| `buildFaq()` — `app/secteur/[city]/[service]/page.jsx` | **24** + JSON-LD `FAQPage` |
| `cityFaq()` — `app/secteur/[city]/page.jsx` | **6** + JSON-LD `FAQPage` |
| `services[].forCity()` | **12** |
| `services[].body` / `.bullets` / `.intro` | **7** |
| `cities[].intro` / `.body` | **5** chacune |
| JSON-LD de `app/layout.jsx` | **les 46** |

---

## ⚠️ D'abord : une page entière, pas une phrase

### A1 — `/renouvellement` s'adresse à des clients qui n'existent pas encore

`app/renouvellement/page.jsx` · liée depuis **la navigation** (`app/ClientLayout.jsx:14`) et le **sitemap** (`app/sitemap.js:13`)

| Ligne | Verbatim |
|---|---|
| `:7` | « Renouvellement — **client de l'an passé** » |
| `:9` | « Votre reconduction est plus simple et moins chère — généralement **entre 70 % et 80 % du prix initial** » |
| `:30` | « Les **clients existants** sont servis en premier — vous choisissez votre semaine avant l'ouverture publique » |
| `:50` | « **Beaucoup de nos clients reviennent chaque saison** » |

Première saison : il n'y a pas de client de l'an passé. La page ne peut
convertir personne, et elle publie **un engagement de prix** (70–80 %) qu'on
pourrait te réclamer l'an prochain.

**Ce n'est pas une reformulation, c'est une décision.** Trois options :

1. **Retirer la page, le lien de nav et l'entrée sitemap pour cette saison**
   *(recommandé)* — la remettre l'an prochain, quand elle sera vraie et
   qu'elle aura un public.
2. La reconvertir en page « Réservez tôt » (même formulaire, autre promesse).
3. La garder au futur : « Dès la saison prochaine, votre reconduction… » —
   honnête, mais elle reste une page sans public cette année.

---

## HIGH — affirmations à corriger

### A2 — Équipes en tournée · **24 pages + JSON-LD**
`app/secteur/[city]/[service]/page.jsx:44`
> Oui. ${cityName} fait partie de notre territoire principal — **nos équipes y sont sur la route plusieurs jours par semaine en saison.**

Des équipes au pluriel, physiquement présentes chaque semaine dans 6 villes.
Émis aussi en `FAQPage` JSON-LD : Google le lit comme une réponse structurée.

**Proposé :**
> Oui, ${cityName} est dans notre territoire. On planifie les installations par secteur pour limiter les déplacements — réserver tôt vous laisse le choix de la date.

### A3 — Même chose sur les pages de ville · **6 pages + JSON-LD**
`app/secteur/[city]/page.jsx:41`
> Le plus tôt possible — idéalement en octobre. **Nos équipes couvrent ${cityName} plusieurs jours par semaine en novembre**, mais les meilleures dates partent vite.

**Proposé :**
> Le plus tôt possible — idéalement en octobre. Les dates de novembre partent vite : réserver tôt garantit la vôtre avant les premières neiges.

### A4 — « chaque année » · **12 pages**
`components/data.js:220`
> Nous installons des lumières de Noël résidentielles à ${city} **chaque année.**

**Proposé :**
> Lumières de Noël résidentielles à ${city} : conception, pose, entretien et retrait — tout inclus, sans que vous touchiez à une échelle.

### A5 — Expérience municipale · **7 pages**
`components/data.js:260`
> **Notre expérience municipale couvre** l'éclairage de parcs, l'illumination de rues principales et les grandes propriétés institutionnelles.

Aucun contrat municipal, et **aucune photo municipale** (PR #3 a retiré l'image du volet municipal pour cette raison).

**Proposé :**
> Nous soumissionnons pour les parcs, les rues principales et les grandes propriétés institutionnelles. Devis sur soumission selon l'envergure — on planifie avec votre service technique (alimentation, fixation, accès).

### A6 — Coordination avec les villes · **12 pages**
`components/data.js:262`
> Pour la ville de ${city} et ses propriétés institutionnelles, **on coordonne l'installation avec les services techniques municipaux.**

**Proposé :**
> Pour la ville de ${city} et ses propriétés institutionnelles : devis sur soumission, et une planification faite avec votre service technique.

### A7 — Clientèle commerciale existante · **7 pages**
`components/data.js:239`
> **Nous travaillons avec** des restaurants, hôtels, bureaux, centres commerciaux et concessionnaires **partout au Québec.**

**Proposé :**
> Restaurants, hôtels, bureaux, centres commerciaux, concessionnaires : conception selon votre image de marque, échéancier respecté, un seul interlocuteur du début à la fin.

### A8 — Le sous-titre qui contredit son propre titre · accueil
`components/data.js:136` — **quatre lignes sous ton commentaire `// ASSURANCE`**
> title: « Vous ne montez jamais dans l'échelle »
> desc: « **Installateurs formés et assurés, travail en hauteur effectué selon les normes.** »

Le titre a été corrigé, la description a gardé les trois affirmations retirées.

**Proposé :**
> On fournit l'échelle, le matériel et la main-d'œuvre. Vous ne sortez jamais du salon.  `// ASSURANCE`

### A9 — Reste d'assurance dans le blogue
`app/blog/posts.js:57`
> Notre équipe peut travailler dans ces conditions — **on est assurés, équipés et formés.**

**Proposé :** > Notre équipe travaille dans ces conditions — c'est le métier.  `// ASSURANCE`

### A10 — Conformité / assurances (marqueurs `// ASSURANCE` manquants)
| Fichier:ligne | Verbatim | Proposé |
|---|---|---|
| `components/data.js:257` | « Documentation, **conformité et assurances** » | « Documentation et planification avec votre service technique » |
| `components/data.js:232` | « **équipe formée au travail en hauteur, conformité respectée** » | « on travaille en hauteur, hors de vos heures d'ouverture » |
| `components/data.js:230` | metaDescription : « …**conformité et sécurité** » — *visible dans Google* | « …planification hors-heures, matériel professionnel, échéancier respecté » |
| `components/data.js:253` | « respect strict du calendrier, **conformité et sécurité du public** » | « respect strict du calendrier et sécurité du public » |

### A11 — La garantie est décrite plus large qu'elle ne l'est
Tu l'as définie précisément : **rappels gratuits et illimités, de la pose au
retrait, pour ampoule brûlée ou section tombée.** Le site dit autre chose :

| Fichier:ligne | Verbatim | Proposé |
|---|---|---|
| `components/data.js:466` | « **La garantie couvre le matériel et la main-d'œuvre.** Un appel et nous planifions la réparation. » | « Un appel et on repasse — sans frais, autant de fois qu'il le faut, de la pose au retrait. » |
| `components/data.js:462` | « Le matériel est **couvert par une garantie** — détails fournis à la soumission. » | « Plusieurs années en usage normal. Pendant la saison, tout rappel est sans frais. » |
| `app/soumission/page.jsx:67` | « Garantie : si une lumière brûle pendant la saison, on repasse sans frais. » | « Ampoule brûlée ou section tombée ? On repasse sans frais, autant de fois qu'il le faut — de la pose au retrait. » |

*(Les deux entrées `data.js` sont aussi émises en `FAQPage` JSON-LD.)*

### A12 — Le blogue raconte un historique qui n'existe pas
| Ligne | Verbatim | Proposé |
|---|---|---|
| `posts.js:10` | « des fourchettes réelles, **vécues sur le terrain depuis plusieurs saisons** » | « des fourchettes réelles, basées sur ce qu'on facture » |
| `posts.js:14` | « **Beaucoup de clients reviennent** à environ 70 à 80 % du prix initial » | « La reconduction coûte moins cher : le design est déjà conçu et les attaches sont en place. » |
| `posts.js:63` | « on garde toujours quelques fenêtres pour **les clients réguliers** et les urgences » | « on garde toujours quelques fenêtres — appelez, on vous dira franchement ce qui reste. » |
| `posts.js:69` | « Décembre : **généralement complet sauf clients existants.** » | « Décembre : les disponibilités sont limitées — appelez pour valider. » |
| `posts.js:92` | « **dans nos tests sur le terrain** : impossible pour **la majorité des clients** de distinguer… » | « Côte à côte, la différence est très difficile à voir — c'est ce qui a réglé le débat. » |
| `posts.js:104` | titre « Ce qu'on installe **chez nos clients** » | « Ce qu'on installe » |
| `posts.js:42` | « **Réponse en 48 h.** » | « On vous rappelle rapidement. » *(ou tenir le 48 h — c'est un engagement)* |
| `posts.js:82` | « la différence sur ta facture Hydro peut atteindre **60 à 150 $** » | Vérifier : ~6 semaines × 8 h aux tarifs d'Hydro-Québec donne plutôt **30–50 $**. |

### A13 — Les pages de ville racontent un passé · **5 pages chacune**
| Ligne | Ville | Verbatim | Proposé |
|---|---|---|---|
| `:302` | Blainville | « **l'une des villes où nous installons le plus** de lumières **chaque année** » | « Blainville est au cœur de notre territoire. De Fontainebleau au Plateau, de Chambéry à Notre-Dame — on connaît les rues et les styles d'architecture du secteur. » |
| `:315` | Terrebonne | « Le Vieux-Terrebonne **nous demande** des installations soignées » | « Le Vieux-Terrebonne demande des installations soignées, qui mettent en valeur les façades patrimoniales » |
| `:326` | Saint-Jérôme | « **font partie de notre tournée annuelle** » | « sont dans notre territoire » |
| `:339` | Laval | « **représentent une bonne part de nos installations** résidentielles haut de gamme » | « Les grandes propriétés de Sainte-Dorothée et Sainte-Rose se prêtent bien aux designs haut de gamme. » |
| `:351` | Montréal | « **Notre équipe a l'habitude** des contraintes urbaines » | « Les contraintes urbaines — stationnement, accès, hauteur — font partie du travail. » |
| `:363` | Rive-Sud | « **Nos chantiers** Rive-Sud sont concentrés… commerces du **DIX30** » | « On dessert la couronne sud rapprochée. Pour les commerces des grandes artères, on planifie hors-heures. » *(DIX30 est une marque déposée — l'évoquer suggère qu'on y a travaillé)* |

### A14 — `noelPage.intro` · page portfolio
`components/data.js:494`
> **Chaque année**, nous illuminons **des dizaines** de propriétés à travers le Québec. Voici un aperçu de **projets réalisés**.

Depuis la PR #3, « projets réalisés » est **vrai** — les photos sont réelles.
« Chaque année » et « des dizaines » ne le sont pas.

**Proposé :** > Voici des installations réalisées cette saison, à travers notre territoire.

### A15 — Faux badges 5,0 en code mort
`components/ui.jsx:109` (`Stars`) et `:122` (`ReviewBadges`) — Google 5.0 et
Facebook 5.0 codés en dur, cinq étoiles. **Importés par zéro page** aujourd'hui,
mais prêts à tirer. `company.social` vaut `null` : il n'y a pas de page Facebook
à noter. `components/reviews.js` fait déjà ça proprement (`REVIEWS_PENDING`).

**Proposé :** supprimer les deux fonctions.

---

## MEDIUM

| # | Fichier:ligne | Affirmation | Pages | Proposé |
|---|---|---|---|---|
| B1 | `app/secteur/[city]/page.jsx:33` | « Nous installons **partout** sur le territoire… ainsi que dans les **municipalités avoisinantes** » | 6 + JSON-LD | « Oui — ${cityName} et les municipalités voisines. Si vous êtes en limite de secteur, demandez : on vous dira franchement. » |
| B2 | `app/secteur/[city]/page.jsx:45` | Retrait **et entreposage** garantis, « aucun frais additionnel » | 6 + JSON-LD | Garder si l'entreposage est réel — sinon retirer « et on entrepose ». |
| B3 | `[service]/page.jsx:48` + `data.js:461` | « La plupart des résidences sont **complétées en une journée** » | 24 + 8, JSON-LD | « La plupart des résidences se font en une seule visite. » |
| B4 | `[service]/page.jsx:34` | OG : « **Installation par notre équipe** ${cityIn} » | 24 (aperçus de lien) | « Lumières de Noël ${cityIn} — pose, entretien et retrait inclus. » |
| B5 | `app/secteur/page.jsx:36` | « **notre équipe couvre toute** la grande région de Montréal » | 1 | « notre territoire couvre la grande région de Montréal » |
| B6 | `data.js:140,161,176,216` | « on revient **rapidement**, sans frais » — délai non qualifié, ×4 endroits | 1+1+1+7 | Remplacer par la garantie exacte (voir A11) — plus précis *et* plus vendeur. |
| B7 | `data.js:149` + `app/page.jsx:171` | « Les agendas **se remplissent vite** » | 1 + JSON-LD | Vrai en soi (la capacité est réelle), mais l'accoler à « nos équipes en tournée » crée une rareté fictive. Garder seulement si A2/A3 sont corrigés. |
| B8 | `posts.js:27` | « les **exigences de conformité** » | 1 | « les contraintes d'accès et de hauteur » |
| B9 | `app/layout.jsx` JSON-LD | `openingHoursSpecification` (lun-ven 8-18, sam 9-16), `paymentAccepted` incluant **carte de crédit** (exige un compte marchand), `geo` précis alors que l'adresse n'a **ni rue ni ville** | **les 46** | À confirmer un par un — c'est lu par machine et ça alimente « Ouvert/Fermé » dans Google. |

---

## Deux choses qui ne sont pas des mots

- **RBQ / éclairage permanent.** Décidé : pas de licence, et les lumières
  saisonnières branchées n'en exigent pas. **Reste à valider par téléphone**
  si le permanent *filé* en exige une, avant que
  `/eclairage-architectural` (8 pages) ne soit poussé. C'est la seule
  exposition réglementaire du site.
- **Territoire réel ≠ territoire annoncé** (PLAN-IMAGES.md §4A). De vraies
  photos viennent de **Saint-Donat** (Lanaudière) et **Stratford** (Estrie),
  que le site ne revendique pas. À l'inverse **Laval** et **Brossard/Rive-Sud**
  ont des pages sans aucune photo. Aligner `cities[]` et `serviceArea`
  (`components/data.js`) sur les endroits où le travail a réellement eu lieu :
  meilleur pour le référencement local, et c'est la seule version vraie.
