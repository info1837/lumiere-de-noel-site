"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { company, ivory, gold, charcoal } from "@/components/data";
import { TiroirMobile } from "@/components/TiroirMobile";

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
  const hamburgerRef = useRef(null);

  // (Le ResizeObserver qui publiait --hauteur-entete / --hauteur-barre-bas
  // est parti avec le voile plein écran : le tiroir couvre toute la hauteur,
  // au-dessus de l'entête et de la barre du bas, il n'a rien à réserver.)

  useEffect(() => {
    // 24 px : l'entête devient opaque dès le premier geste de défilement,
    // avant que le texte du hero ne passe dessous.
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Le verrou de défilement vit dans le tiroir (html ET body, iOS oblige).
  // Navigation client (next/link) : le tiroir se ferme au changement de route.
  useEffect(() => { setOpen(false); }, [pathname]);

  const solid = scrolled || open;

  return (
    <>
    <header
      className="entete-pilule"
      style={{
        position: "fixed", zIndex: 100,
        // La pilule est TOUJOURS visible : contrairement à l'ancienne barre
        // pleine largeur, elle ne peut pas être transparente — elle flotte
        // au-dessus du hero et ses liens doivent rester lisibles dès le
        // premier pixel. Seule l'opacité varie au défilement.
        background: solid ? "rgba(11,27,43,0.92)" : "rgba(11,27,43,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "background 0.25s",
      }}
    >
      {/* 14 px + logo 44 px + 14 px = 72 px, la hauteur sur laquelle le
          padding du hero est calculé (globals.css .hero-section). */}
      <div className="container header-row" style={{
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

          {/* Le hamburger ne se transforme plus en × : le tiroir couvre
              l'entête d'un voile et porte son propre bouton Fermer. */}
          <button
            type="button"
            ref={hamburgerRef}
            className="header-hamburger"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            aria-controls="tiroir-mobile"
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              // 8 + 28 + 8 = 44 : cible tactile de 44px, comme le bouton
              // Fermer du tiroir qui s'ouvre exactement dessous.
              color: ivory, padding: 8, alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </header>

      <TiroirMobile ouvert={open} onFermer={() => setOpen(false)} declencheurRef={hamburgerRef} />
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

