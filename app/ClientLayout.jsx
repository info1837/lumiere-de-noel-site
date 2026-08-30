"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav, company, navy, ivory, gold, charcoal, offWhite } from "@/components/data";

// Items du menu horizontal desktop — on aplatit "Services" (dropdown gardé pour
// le menu mobile plein écran, mais pas nécessaire sur desktop).
const desktopNav = [
  { label: "Accueil", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Zones desservies", href: "/secteur" },
  { label: "Réalisations", href: "/lumiere-de-noel#realisations" },
  { label: "Blog", href: "/blog" },
];

export function NavBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

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
        <Link href="/" aria-label={`${company.name} — accueil`} style={{ display: "flex", alignItems: "center" }}>
          <img src="/images/logo-horizontal-transparent-fonce.svg" alt={company.name}
            className="site-logo" />
        </Link>

        {/* Nav horizontale — desktop uniquement (≥1024px) */}
        <nav className="header-desktop-nav" aria-label="Navigation principale">
          {desktopNav.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: ivory, textDecoration: "none",
                  fontFamily: "'Nunito Sans', sans-serif",
                  fontSize: 14, fontWeight: 600, letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  borderBottom: active ? `2px solid ${gold}` : "2px solid transparent",
                  paddingBottom: 4,
                }}
              >
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
        <div style={{
          position: "fixed", inset: 0, background: offWhite, zIndex: 90,
          paddingTop: 104, display: "flex", flexDirection: "column", overflowY: "auto",
        }}>
          <nav className="container" style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            {nav.filter((i) => i.href !== "/soumission").map((item) =>
              item.children ? (
                <div key={item.label} style={{ marginBottom: 8 }}>
                  <div style={{
                    fontFamily: "'Nunito Sans', sans-serif", fontSize: 13, fontWeight: 700,
                    letterSpacing: "0.18em", textTransform: "uppercase", color: "#9b8c66",
                    margin: "12px 0 6px",
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
