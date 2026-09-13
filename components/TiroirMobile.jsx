"use client";
// ─── Tiroir de navigation mobile (< 1240px, là où vit le hamburger) ─────
//
// Même composant que sur palencia-site, aux couleurs de Lumière de Noël :
// panneau qui glisse depuis la droite, à la place de l'ancien voile plein
// écran crème (menu-overlay) qui listait tout en Bebas Neue 34px sous des
// titres de groupe.
//
// TOUJOURS dans le HTML rendu côté serveur — fermé, il est masqué par
// transform + visibility, jamais par un rendu conditionnel. L'ancien voile
// était `{open && …}` : ses liens n'existaient qu'après un tap.
//
// Accessibilité : role="dialog" aria-modal ; focus PIÉGÉ (Tab / Maj+Tab
// bouclent), posé sur Fermer à l'ouverture, rendu au hamburger à la
// fermeture ; Échap, le voile et × ferment ; accordéons en <button
// aria-expanded aria-controls>, un seul ouvert ; page courante en
// aria-current="page" ; prefers-reduced-motion : aucune glissade.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { company } from "@/components/data";
import { MENU_SERVICES, MENU_SECTEURS } from "@/components/menu";

const FOCUSABLE = 'a[href], button:not([disabled])';

function estCourant(href, pathname) {
  return href === pathname;
}
// Premier niveau : « Blog » reste allumé sur /blog/mon-article.
function estSection(href, pathname) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.57 1 1 0 0 1-.24 1.02z" />
  </svg>
);

function Accordeon({ id, label, ouvert, onBascule, children }) {
  return (
    <li className="tiroir__rangee">
      <button
        type="button"
        className="tiroir__item tiroir__accordeon"
        aria-expanded={ouvert}
        aria-controls={id}
        onClick={onBascule}
      >
        {label}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {/* hidden, pas un rendu conditionnel : les liens restent dans le HTML
          serveur. [hidden] est redéclaré en CSS — la grille des secteurs
          pose un display:grid qui battrait sinon l'attribut. */}
      <div id={id} hidden={!ouvert}>
        {children}
      </div>
    </li>
  );
}

export function TiroirMobile({ ouvert, onFermer, declencheurRef }) {
  const pathname = usePathname() || "/";
  const tiroirRef = useRef(null);
  const fermerRef = useRef(null);
  const [accordeon, setAccordeon] = useState(null);
  const bascule = (nom) => setAccordeon((a) => (a === nom ? null : nom));
  // L'effet ne dépend QUE de `ouvert` : s'il dépendait d'onFermer (une
  // fonction neuve à chaque rendu du parent), chaque changement d'état de
  // l'entête — le fond qui s'opacifie au défilement — le rejouerait :
  // focus volé, verrou de défilement relâché puis reposé.
  const onFermerRef = useRef(onFermer);
  onFermerRef.current = onFermer;

  useEffect(() => {
    if (!ouvert) { setAccordeon(null); return; }
    const fermer = () => onFermerRef.current();

    const html = document.documentElement, body = document.body;
    const avant = [html.style.overflow, body.style.overflow];
    html.style.overflow = "hidden"; body.style.overflow = "hidden";

    fermerRef.current?.focus();

    const surTouche = (e) => {
      if (e.key === "Escape") { e.preventDefault(); fermer(); return; }
      if (e.key !== "Tab" || !tiroirRef.current) return;
      const cibles = [...tiroirRef.current.querySelectorAll(FOCUSABLE)]
        .filter((el) => el.getClientRects().length > 0);
      if (!cibles.length) return;
      const premier = cibles[0], dernier = cibles[cibles.length - 1];
      const actif = document.activeElement;
      if (e.shiftKey && (actif === premier || !tiroirRef.current.contains(actif))) {
        e.preventDefault(); dernier.focus();
      } else if (!e.shiftKey && actif === dernier) {
        e.preventDefault(); premier.focus();
      }
    };
    document.addEventListener("keydown", surTouche);

    return () => {
      document.removeEventListener("keydown", surTouche);
      html.style.overflow = avant[0]; body.style.overflow = avant[1];
      const actif = document.activeElement;
      if (!actif || actif === document.body || tiroirRef.current?.contains(actif)) {
        declencheurRef?.current?.focus?.();
      }
    };
  }, [ouvert]); // eslint-disable-line react-hooks/exhaustive-deps

  const sousLien = (l) => (
    <li key={l.href}>
      <Link href={l.href} onClick={onFermer} className="tiroir__sous-lien"
        aria-current={estCourant(l.href, pathname) ? "page" : undefined}>
        {l.label}
      </Link>
    </li>
  );
  const item = (href, label) => (
    <li className="tiroir__rangee">
      <Link href={href} onClick={onFermer} className="tiroir__item"
        aria-current={estSection(href, pathname) ? "page" : undefined}>
        {label}
      </Link>
    </li>
  );

  return (
    <>
      <div className="tiroir-voile" data-ouvert={ouvert ? "1" : undefined} aria-hidden="true" onClick={onFermer} />

      <div
        id="tiroir-mobile"
        ref={tiroirRef}
        className="tiroir"
        data-ouvert={ouvert ? "1" : undefined}
        role="dialog"
        aria-modal={ouvert ? "true" : undefined}
        aria-label="Menu"
      >
        <div className="tiroir__entete">
          <Link href="/" onClick={onFermer} className="tiroir__marque" aria-label={`${company.shortName} — accueil`}>
            <img src="/images/logo-horizontal-transparent-fonce.svg" alt="" width={82} height={28} />
          </Link>
          <button type="button" ref={fermerRef} className="tiroir__fermer" onClick={onFermer} aria-label="Fermer le menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>
        </div>

        <nav className="tiroir__corps" aria-label="Navigation mobile">
          <ul className="tiroir__liste">
            {item("/", "Accueil")}
            <Accordeon id="tiroir-services" label="Services" ouvert={accordeon === "services"} onBascule={() => bascule("services")}>
              <ul className="tiroir__sous">{MENU_SERVICES.map(sousLien)}</ul>
            </Accordeon>
            <Accordeon id="tiroir-secteurs" label="Secteurs" ouvert={accordeon === "secteurs"} onBascule={() => bascule("secteurs")}>
              <ul className="tiroir__sous" data-colonnes="2">{MENU_SECTEURS.map(sousLien)}</ul>
            </Accordeon>
            {item("/realisations", "Réalisations")}
            {item("/calculatrice", "Calculatrice")}
            {item("/blog", "Blog")}
            {item("/soumission", "Soumission")}
          </ul>
        </nav>

        <div className="tiroir__pied">
          <Link href="/calculatrice" onClick={onFermer} className="tiroir__cta">Prix en 60 s</Link>
          <a href={company.phoneHref} className="tiroir__tel">
            <PhoneIcon /> Appeler {company.phoneDisplay}
          </a>
        </div>
      </div>
    </>
  );
}
