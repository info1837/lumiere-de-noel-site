"use client";
import Link from "next/link";
import { useState } from "react";
import { charcoal, offWhite, gold, goldText, navy, ivory, line } from "@/components/data";

// --- Bouton CTA pilule (border-radius 300px, pattern de la spec) -------------
export function CTAButton({ children, href, onClick, variant = "primary", type, style = {} }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "19px 32px",
    borderRadius: 300,
    fontFamily: "'Nunito Sans', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    textDecoration: "none",
    cursor: "pointer",
    border: "1.5px solid transparent",
    transition: "transform 0.18s ease, opacity 0.18s ease",
    lineHeight: 1,
  };
  const variants = {
    primary: { background: charcoal, color: offWhite },
    light: { background: offWhite, color: charcoal },
    gold: { background: gold, color: charcoal },
    outlineLight: { background: "transparent", color: offWhite, borderColor: "rgba(250,250,250,0.5)" },
    outlineDark: { background: "transparent", color: charcoal, borderColor: charcoal },
  };
  const s = { ...base, ...(variants[variant] || variants.primary), ...style };
  const hover = (e, on) => { e.currentTarget.style.transform = on ? "translateY(-2px)" : "translateY(0)"; };

  if (href) {
    const external = href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:");
    if (external) {
      return (
        <a href={href} style={s} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} style={s} onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type || "button"} onClick={onClick} style={s}
      onMouseEnter={(e) => hover(e, true)} onMouseLeave={(e) => hover(e, false)}>
      {children}
    </button>
  );
}

// --- Fil d'Ariane (sur pages profondes : services, villes, blog) ------------
// Pour parité visuelle avec le SEO JSON-LD <BreadcrumbList>.
export function Breadcrumb({ items, dark }) {
  const c = dark ? "rgba(243,233,210,0.6)" : "#777";
  const cActive = dark ? ivory : charcoal;
  const sep = dark ? "rgba(243,233,210,0.35)" : "#bbb";
  return (
    <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, marginBottom: 16 }}>
      <ol style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: 6, padding: 0, margin: 0 }}>
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {last || !it.href ? (
                <span style={{ color: cActive, fontWeight: 600 }} aria-current={last ? "page" : undefined}>{it.name}</span>
              ) : (
                <Link href={it.href} style={{ color: c, textDecoration: "none" }}>{it.name}</Link>
              )}
              {!last && <span aria-hidden="true" style={{ color: sep }}>›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// --- Étiquette de section (petit label doré en majuscules) ------------------
export function SectionTag({ children, dark }) {
  return (
    <div style={{
      fontFamily: "'Nunito Sans', sans-serif",
      fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
      color: dark ? gold : goldText, marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

// --- Titre de section (Bebas) ------------------------------------------------
export function SectionTitle({ children, light, style = {} }) {
  return (
    <h2 style={{ color: light ? ivory : charcoal, marginBottom: 20, maxWidth: 720, ...style }}>
      {children}
    </h2>
  );
}

// --- Étoiles ----------------------------------------------------------------
export function Stars({ size = 18, color = "#E5B567" }) {
  return (
    <span aria-label="5 étoiles sur 5" role="img" style={{ display: "inline-flex", gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </span>
  );
}

// --- Badges d'avis Google / Facebook 5.0 ------------------------------------
export function ReviewBadges({ dark }) {
  const c = dark ? "rgba(250,250,250,0.92)" : charcoal;
  const Badge = ({ label }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 16px", borderRadius: 300,
      background: dark ? "rgba(255,255,255,0.08)" : "#fff",
      border: `1px solid ${dark ? "rgba(255,255,255,0.18)" : "#e5dfd0"}`,
    }}>
      <strong style={{ color: c, fontSize: 14 }}>{label}</strong>
      <Stars size={15} />
      <span style={{ color: c, fontSize: 14, fontWeight: 700 }}>5.0</span>
    </div>
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      <Badge label="Google" />
      <Badge label="Facebook" />
    </div>
  );
}

// --- Accordéon FAQ -----------------------------------------------------------
export function FaqAccordion({ items, dark }) {
  const [open, setOpen] = useState(null);
  const txt = dark ? ivory : charcoal;
  const border = dark ? line : "#e5dfd0";
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} style={{ borderBottom: `1px solid ${border}` }}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                gap: 16, padding: "22px 4px", background: "transparent", border: "none",
                cursor: "pointer", textAlign: "left", color: txt,
                fontFamily: "'Nunito Sans', sans-serif", fontSize: 17, fontWeight: 700,
              }}
            >
              <span>{it.q}</span>
              <span aria-hidden="true" style={{ fontSize: 24, lineHeight: 1, color: dark ? gold : goldText, flexShrink: 0 }}>
                {isOpen ? "–" : "+"}
              </span>
            </button>
            {isOpen && (
              <p style={{
                padding: "0 4px 24px", color: dark ? "rgba(243,233,210,0.8)" : "#444",
                fontSize: 16, maxWidth: "none",
              }}>
                {it.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Galerie de projets ------------------------------------------------------
export function Gallery({ items }) {
  return (
    <div className="gallery-grid">
      {items.map((it, i) => (
        <figure key={i} className="glow-card" style={{
          position: "relative", borderRadius: 14, overflow: "hidden",
          aspectRatio: "4 / 3", background: "#11202f",
          border: "1px solid rgba(233,220,192,0.12)",
        }}>
          <img
            src={it.image}
            alt={it.alt}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {it.caption && (
            <figcaption style={{
              position: "absolute", left: 0, right: 0, bottom: 0,
              padding: "28px 16px 12px",
              background: "linear-gradient(to top, rgba(6,18,31,0.85), transparent)",
              color: ivory, fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 18, letterSpacing: "0.05em",
            }}>
              {it.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

// --- Carte de section sombre réutilisable (hero secondaire) -----------------
export function PageHero({ kicker, title, subtitle, image, imageAlt, ctaHref = "/soumission", ctaLabel = "Soumission gratuite" }) {
  return (
    <section style={{ position: "relative", padding: 0, minHeight: "62vh", display: "flex", alignItems: "flex-end", background: navy }}>
      <img
        src={image}
        alt={imageAlt}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,10,20,0.92), rgba(5,10,20,0.45))" }} />
      <div className="container" style={{ position: "relative", padding: "0 24px 72px", width: "100%" }}>
        {kicker && <SectionTag dark>{kicker}</SectionTag>}
        <h1 style={{ color: ivory, maxWidth: 900 }}>{title}</h1>
        {subtitle && (
          <p style={{ color: "rgba(243,233,210,0.85)", fontSize: 19, margin: "18px 0 28px", maxWidth: 620 }}>
            {subtitle}
          </p>
        )}
        <CTAButton href={ctaHref} variant="gold">{ctaLabel}</CTAButton>
      </div>
    </section>
  );
}
