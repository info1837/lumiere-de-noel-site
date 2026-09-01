"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav, company, navy, ivory, gold, charcoal, offWhite } from "@/components/data";

// Items du menu horizontal desktop.
//
// POURQUOI SEULEMENT CINQ ENTRÉES : la barre dispose de 576 px entre le logo
// (152 px) et le groupe téléphone + CTA (372 px). Les sept entrées plates
// d'avant mesuraient 791 px — 215 px de trop. Comme le lien du logo était le
// seul élément flex compressible de l'entête, le navigateur l'écrasait à 0 px
// de large : le logo se téléchargeait (200 OK) mais ne s'affichait sur AUCUNE
// page à partir de 1024 px. Aplatir « Services » avait libéré la place que ces
// deux entrées ont reprise. Le dropdown la rend.
//
// Avant d'ajouter une entrée ici : 5 entrées ≈ 555 px. Il ne reste que ~20 px.
// Une sixième n'entre pas — elle va dans le dropdown.
const desktopNav = [
  { label: "Accueil", href: "/" },
  {
    label: "Services",
    href: "/services",
    groups: [
      {
        title: "Nos services",
        items: [
          { label: "Lumières de Noël — résidentiel", href: "/services/lumieres-de-noel-residentiel" },
          { label: "Lumières de Noël — commercial", href: "/services/lumieres-de-noel-commercial" },
          { label: "Éclairage architectural permanent", href: "/services/eclairage-architectural-permanent" },
          { label: "Tous les services", href: "/services" },
        ],
      },
      {
        title: "Autres",
        items: [
          { label: "Blog", href: "/blog" },
          { label: "Renouvellement", href: "/renouvellement" },
        ],
      },
    ],
  },
  // « Secteurs » plutôt que « Zones desservies » : 37px de moins dans la barre,
  // ce qui suffit à faire tenir la nav horizontale sur un portable 1280px au
  // lieu de la renvoyer au hamburger. Le libellé long reste partout ailleurs
  // (menu mobile, pied de page, titre de la page /secteur) — c'est seulement
  // la barre desktop qui manque de place.
  { label: "Secteurs", href: "/secteur" },
  { label: "Réalisations", href: "/realisations" },
  { label: "Calculatrice", href: "/calculatrice" },
];

export function NavBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const headerRef = useRef(null);

  // Hauteurs MESURÉES de l'en-tête et de la barre du bas, publiées en
  // variables CSS. On ne les code pas en dur : ce dépôt s'est déjà fait avoir
  // par une hauteur « espérée » de 76px alors que la vraie était 73,75px, et
  // par un en-tête qui recouvrait le h1. La hauteur change avec la largeur
  // (paliers du logo), avec la taille de police du système et quand un libellé
  // passe sur deux lignes. Un ResizeObserver suit les trois.
  useEffect(() => {
    const racine = document.documentElement;
    const mesurer = () => {
      const h = headerRef.current?.getBoundingClientRect().height;
      if (h) racine.style.setProperty("--hauteur-entete", `${Math.ceil(h)}px`);
      const b = document.querySelector(".mobile-bottom-bar");
      const hb = b && getComputedStyle(b).display !== "none"
        ? b.getBoundingClientRect().height : 0;
      racine.style.setProperty("--hauteur-barre-bas", `${Math.ceil(hb)}px`);
    };
    mesurer();
    const ro = new ResizeObserver(mesurer);
    if (headerRef.current) ro.observe(headerRef.current);
    const bb = document.querySelector(".mobile-bottom-bar");
    if (bb) ro.observe(bb);
    window.addEventListener("resize", mesurer);
    window.addEventListener("orientationchange", mesurer);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", mesurer);
      window.removeEventListener("orientationchange", mesurer);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => { setOpen(false); }, [pathname]);

  const solid = scrolled || open;

  return (
    <>
    <header
      ref={headerRef}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: solid ? "rgba(11,27,43,0.97)" : "transparent",
        borderBottom: `1px solid ${solid ? "rgba(233,220,192,0.16)" : "transparent"}`,
        transition: "background 0.25s, border-color 0.25s",
      }}
    >
      <div className="container" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 24px", gap: 16,
      }}>
        <Link href="/" aria-label={`${company.name} — accueil`} className="site-logo-link">
          <img src="/images/logo-horizontal-transparent-fonce.svg" alt={company.name}
            className="site-logo" />
        </Link>

        {/* Nav horizontale — desktop uniquement (≥1024px) */}
        <nav className="header-desktop-nav" aria-label="Navigation principale">
          {desktopNav.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            const inGroups = item.groups?.some((g) => g.items.some((c) => pathname === c.href));
            if (item.groups) {
              return (
                <div key={item.label} className="nav-dropdown">
                  <Link href={item.href} className="nav-link" data-active={active || inGroups ? "true" : undefined}>
                    {item.label}
                    <svg className="nav-caret" width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                  </Link>
                  <div className="nav-panel" role="menu">
                    {item.groups.map((g) => (
                      <div key={g.title} className="nav-panel-group">
                        <p className="nav-panel-title">{g.title}</p>
                        {g.items.map((c) => (
                          <Link key={c.href} href={c.href} role="menuitem"
                            className="nav-panel-link" data-active={pathname === c.href ? "true" : undefined}>
                            {c.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <Link key={item.href} href={item.href} className="nav-link" data-active={active ? "true" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Tap-to-call persistant */}
          <a href={company.phoneHref} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: 300,
            background: gold, color: charcoal, textDecoration: "none",
            fontWeight: 700, fontSize: 14, letterSpacing: "0.03em",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.57 1 1 0 0 1-.24 1.02z" />
            </svg>
            <span className="phone-label">{company.phoneDisplay}</span>
          </a>

          {/* CTA header — visible à toutes les largeurs, label réduit sur très petit écran */}
          <Link href="/soumission" className="header-cta">
            <span className="cta-label">Soumission gratuite</span>
            <svg className="cta-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>

          <button
            type="button"
            className="header-hamburger"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: ivory, padding: 6, alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {open
                ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
            </svg>
          </button>
        </div>
      </div>
    </header>

      {open && (
        // Le menu ne défile PLUS derrière l'en-tête ni sous la barre du bas.
        // Avant : un seul bloc en overflow:auto avec paddingTop 104px et AUCUN
        // padding en bas — les derniers liens et le courriel restaient sous la
        // barre fixe, inatteignables même en défilant jusqu'au bout, et le haut
        // de la liste passait derrière l'en-tête en coupant les mots en deux.
        // Maintenant : une colonne flex dont la réserve haute vaut la hauteur
        // MESURÉE de l'en-tête, et une zone de défilement qui réserve en bas la
        // hauteur MESURÉE de la barre plus l'encoche.
        <div className="menu-overlay">
          <div className="menu-overlay-defile">
          <nav className="container" style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            {nav.filter((i) => i.href !== "/soumission").map((item) =>
              item.children ? (
                <div key={item.label} style={{ marginBottom: 8 }}>
                  <div style={{
                    fontFamily: "'Nunito Sans', sans-serif", fontSize: 15, fontWeight: 800,
                    letterSpacing: "0.16em", textTransform: "uppercase", color: "#8A6A1C",
                    margin: "18px 0 10px",
                  }}>
                    {item.label}
                  </div>
                  {item.children.map((c) => (
                    <Link key={c.href} href={c.href} style={overlayLink}>{c.label}</Link>
                  ))}
                </div>
              ) : (
                <Link key={item.href} href={item.href} style={overlayLink}>{item.label}</Link>
              )
            )}
            {/* SOUMISSION traité comme bouton plein (pas comme un lien de plus) */}
            <Link href="/soumission" className="overlay-cta">Soumission gratuite</Link>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              <a href={company.phoneHref} style={{ ...overlayLink, color: charcoal, fontWeight: 700 }}>
                {company.phoneDisplay}
              </a>
              <a href={company.emailHref} style={{ ...overlayLink, fontSize: 18 }}>
                {company.email}
              </a>
            </div>
          </nav>
          </div>
        </div>
      )}
    </>
  );
}

// Barre fixe en bas d'écran (mobile / tablette) — Appeler / Soumission.
// Masquée à ≥1024px où la nav horizontale + CTA d'entête suffisent.
export function MobileBottomBar() {
  return (
    <div className="mobile-bottom-bar" role="navigation" aria-label="Actions rapides">
      <a href={company.phoneHref} className="bottom-bar-call">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.57 1 1 0 0 1-.24 1.02z" />
        </svg>
        Appeler
      </a>
      <Link href="/soumission" className="bottom-bar-quote">
        Soumission gratuite
      </Link>
    </div>
  );
}

const overlayLink = {
  display: "block",
  width: "fit-content",
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: 34,
  letterSpacing: "0.04em",
  color: navy,
  textDecoration: "none",
  padding: "8px 0",
};
