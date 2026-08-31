# Plan images — Solution Lumière de Noël inc.
Établi le 2026-08-30 après inspection visuelle des 21 photos réelles
déposées dans `public/images/`. **Toutes les images générées ont été
supprimées par Yahir.** Il n'en reste aucune dans le dépôt.

> ⚠️ ÉTAT ACTUEL : LE SITE EST CASSÉ. 20 des 24 images référencées par le
> code n'existent plus sur le disque. Chaque hero, chaque carte de service
> et la plupart des pages de ville rendent une image brisée. C'est le
> correctif prioritaire — avant les réclamations, avant la calculatrice.

---

## 1. Ce que Yahir possède réellement

21 photos, toutes prises entre le 13 novembre et le 10 décembre 2025 —
c'est-à-dire pendant la vraie saison d'installation. Ce sont de vrais
chantiers. Le camion visible sur plusieurs est un Ford Ranger blanc **sans
identification** : aucune ancienne marque à retirer.

**Deux conclusions qui changent le contenu du site :**

1. **L'éclairage architectural permanent est un vrai service.** Cinq photos
   le prouvent (`perm-led*.jpg`, `permanent 2.jpg`), dont une maison
   complète en couleurs changeantes et un gros plan de pastilles DEL RGB.
   La page `eclairage-architectural` est légitime et doit rester.
2. **Aucune photo municipale n'existe.** Zéro. Le service municipal ne peut
   donc s'appuyer sur aucune preuve. Voir §4.

---

## 2. Attribution — pages principales

| Emplacement | Fichier | Pourquoi |
|---|---|---|
| **Hero accueil** | `noel-blainville-01.jpg` | La meilleure photo du lot. 2080×1170 paysage, nuit sèche, nette. Maison contemporaine à toit plat, arbre dénudé illuminé — image forte et distinctive. |
| **Section valeur (accueil)** | `noel-lery-01.jpg` | Montre le forfait complet en une image : ligne de toit, colonnes enrubannées, arbustes, arbres. C'est la preuve visuelle du « tout inclus ». |
| **Service — Résidentiel** | `noel-terrebonne.jpg` | Maison classique, neige, chaleureuse. C'est celle où le propriétaire moyen se reconnaît. |
| **Service — Commercial** | `noel-commercial.jpg` | Un vrai commerce (chocolaterie Fleur de Sel, 601), ligne de toit illuminée, enseigne sur pylône, échelle appuyée au mur, camion sur place. La meilleure preuve de travail du dossier. |
| **Commercial — 2e image** | `lights1.jpg` | Même commerce, autre angle. |
| **Éclairage permanent — hero** | `perm-led1.jpg` | Maison complète en éclairage permanent couleur. |
| **Éclairage permanent — détail** | `perm-led-02.jpg` | Gros plan des pastilles DEL RGB. Excellente photo produit — rare et convaincante. |
| **Éclairage permanent — galerie** | `perm-led.jpg`, `perm-led2.jpg`, `permanent 2.jpg` | Dont une installation en cours (échelle sur la façade) : la preuve du métier. |
| **Arbres / extras** | `noel-trees-01.jpg`, `noel-trees-02.jpg` | Conifères enrubannés dans la neige. À utiliser là où l'on parle d'arbres — jamais dans le prix automatique. |

---

## 3. Attribution — pages de ville

Une ville n'obtient une image **que** si une vraie photo y correspond. Les
autres n'affichent aucune image plutôt qu'une image d'ailleurs.

| Ville | Fichier | Note |
|---|---|---|
| Blainville | `noel-blainville-01.jpg` | Partagée avec le hero — acceptable, c'est une vraie photo de Blainville. |
| Mirabel | `noel-mirabel-01.jpg` | |
| Terrebonne | `noel-terrebonne.jpg` | |
| Saint-Jérôme | `noel-st-jerome-01.jpg` | |
| Montréal | `noel-montreal-01.jpg` | |
| Sainte-Julienne | `noel-ste-julienne-01.jpg` | Heure bleue, guirlande chaude. Très belle. |
| Léry | `noel-lery-01.jpg` | Montérégie / Rive-Sud. |
| Mercier | `noel-mercier-01.jpg` | **Nouvelle version pivotée** — l'originale `noel-st-mercier-01.jpg` était couchée de 90°. Supprimer l'ancienne. |
| Sainte-Anne | `noel-ste-anne.jpg` | |
| Saint-Donat | `noel-st-donat-02.jpg` | Très sombre. Utilisable, faible. |
| Stratford | `noel-stratford-01.jpg` | Maison anguleuse, ligne de toit multicolore sur neige. Percutante. |

**Aucune image** pour toute autre ville. Alt générique, sans nom de ville.

---

## 4. Trois décisions de contenu qui découlent des photos

**A — Le territoire réel ne correspond pas au territoire annoncé.**
Le site annonce Rive-Sud · Montréal · Rive-Nord. Les photos viennent aussi
de **Saint-Donat (Lanaudière)** et **Stratford (Estrie)**. À l'inverse,
**Laval et Brossard sont annoncés sans aucune photo**. Aligner les pages de
ville sur les endroits où le travail a réellement eu lieu : c'est meilleur
pour le référencement local *et* c'est la seule version vraie.

**B — Le service municipal n'a aucune preuve.**
Aucune photo, aucun contrat, aucune ville nommable. Deux options honnêtes :
retirer le volet municipal pour cette saison, ou le garder en *capacité*
(« sur soumission ») sans image, sans étude de cas et sans affirmation
d'expérience passée. Recommandation : le garder en capacité, page allégée.

**C — L'éclairage permanent mérite mieux que ce qu'il a.**
C'est un vrai service, prouvé, vendu hors saison et à meilleure marge que
le saisonnier. Il a sa propre page mais aucune tarification. À traiter
comme un produit à part entière — pas 12 $/pi.li., pas octobre-décembre.

---

## 5. Règle d'alt — permanente

Toutes les photos ci-dessus sont **réelles**. Elles ont donc le droit de
nommer leur ville dans l'alt :

    alt="Maison illuminée pour les Fêtes à Terrebonne — ligne de toit,
         colonnes et arbustes"

Si une image générée revient un jour dans le dépôt, elle n'a jamais ce
droit. Le garde de build (`scripts/check-photos.mjs`) doit faire échouer la
compilation si un fichier hors `reel/` porte un nom de ville dans son alt.

---

## 6. Ordre d'exécution recommandé

1. **Réparer les 20 références brisées** avec le tableau ci-dessus. Le site
   est cassé en production jusque-là.
2. Supprimer `noel-st-mercier-01.jpg` (couchée) au profit de
   `noel-mercier-01.jpg`.
3. Réécrire `PHOTOS-NEEDED.md` — ses instructions actuelles sont le piège
   qui a mis une maison sur trois pages de ville.
4. Ensuite seulement : la liste des affirmations, la calculatrice, les leads.
