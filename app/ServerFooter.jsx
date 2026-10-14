import Link from "next/link";
import { company, services, cities, navy, ivory, gold, line } from "@/components/data";

export function ServerFooter() {
  const linkStyle = {
    fontSize: 14, color: "rgba(243,233,210,0.6)",
    textDecoration: "none", padding: "4px 0", display: "inline-block",
  };
  return (
    <footer style={{ background: navy, color: "rgba(243,233,210,0.6)", padding: "64px 24px 32px" }}>
      <div className="container">
        <div style={{
          display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 36, marginBottom: 40,
        }} className="footer-grid-seo">
          {/* Identité */}
          <div>
            <img src="/images/logo-horizontal-transparent-fonce.svg" alt={company.name}
              style={{ height: 68, width: "auto", display: "block", marginBottom: 16 }} />
            <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 340, marginBottom: 18 }}>
              Installation clé en main de lumières de Noël et d'éclairage architectural permanent —
              résidentiel et commercial. {company.region}.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
              <a href={company.phoneHref} style={{ color: gold, textDecoration: "none", fontWeight: 700 }}>
                {company.phoneDisplay}
              </a>
              <a href={company.emailHref} style={{ color: "rgba(243,233,210,0.7)", textDecoration: "none" }}>
                {company.email}
              </a>
              {/* Les comptes publics de Lumière — les mêmes URL que le
                  `sameAs` du JSON-LD (components/data.js → company.social). */}
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                {Object.values(company.social || {}).map((r) => (
                  <a key={r.href} href={r.href} target="_blank" rel="noopener noreferrer me"
                    style={{ color: "rgba(243,233,210,0.85)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                    {r.label === "Instagram" ? `Instagram ${r.handle}` : r.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Services (maillage interne pour SEO) */}
          <div>
            <h2 style={{ color: ivory, fontSize: 16, marginBottom: 14 }}>Services</h2>
            {services.map((s) => (
              <div key={s.slug}>
                <Link href={`/services/${s.slug}`} style={linkStyle}>{s.title}</Link>
              </div>
            ))}
            <div style={{ marginTop: 6 }}>
              <Link href="/services" style={{ ...linkStyle, color: gold }}>Voir tous les services →</Link>
            </div>
          </div>

          {/* Zones desservies (maillage interne) */}
          <div>
            <h2 style={{ color: ivory, fontSize: 16, marginBottom: 14 }}>Zones desservies</h2>
            {cities.map((c) => (
              <div key={c.slug}>
                <Link href={`/secteur/${c.slug}`} style={linkStyle}>{c.name}</Link>
              </div>
            ))}
            <div style={{ marginTop: 6 }}>
              <Link href="/secteur" style={{ ...linkStyle, color: gold }}>Voir toutes les zones →</Link>
            </div>
          </div>

          {/* Ressources */}
          <div>
            <h2 style={{ color: ivory, fontSize: 16, marginBottom: 14 }}>Ressources</h2>
            <div><Link href="/blog" style={linkStyle}>Blog</Link></div>
            <div><Link href="/realisations" style={linkStyle}>Réalisations</Link></div>
            <div><Link href="/concours" style={linkStyle}>Règlement du concours</Link></div>
            <div style={{ marginTop: 6 }}>
              <Link href="/soumission" style={{ ...linkStyle, color: gold, fontWeight: 700 }}>
                Réserver ma date →
              </Link>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: `1px solid ${line}`, paddingTop: 24,
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, fontSize: 13,
        }}>
          <div>© {new Date().getFullYear()} {company.name} — Tous droits réservés.</div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <Link href="/" style={{ color: "rgba(243,233,210,0.5)", textDecoration: "none" }}>Accueil</Link>
            <Link href="/services" style={{ color: "rgba(243,233,210,0.5)", textDecoration: "none" }}>Services</Link>
            <Link href="/secteur" style={{ color: "rgba(243,233,210,0.5)", textDecoration: "none" }}>Zones</Link>
            <Link href="/blog" style={{ color: "rgba(243,233,210,0.5)", textDecoration: "none" }}>Blog</Link>
            <Link href="/soumission" style={{ color: "rgba(243,233,210,0.5)", textDecoration: "none" }}>Soumission</Link>
            <Link href="/concours" style={{ color: "rgba(243,233,210,0.5)", textDecoration: "none" }}>Règlement du concours</Link>
            <Link href="/confidentialite" style={{ color: "rgba(243,233,210,0.5)", textDecoration: "none" }}>Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
