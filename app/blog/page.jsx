import Link from "next/link";
import { SectionTag, CTAButton, Breadcrumb } from "@/components/ui";
import { BreadcrumbJsonLd } from "@/components/jsonld";
import { blogPosts, navy, offWhite, ivory, gold, charcoal, goldText } from "@/components/data";
import { PHOTOS } from "@/components/photos";

export const metadata = {
  title: "Blog — conseils et tarifs",
  description:
    "Conseils, tarifs et guides sur les lumières de Noël et l'éclairage architectural permanent. Articles pratiques pour résidences et commerces.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog | Solution Lumière de Noël inc.",
    description:
      "Conseils et tarifs sur l'installation de lumières de Noël au Québec — articles pratiques.",
    url: "/blog",
    images: [PHOTOS["blainville-01"].src],
  },
};

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });

export default function BlogIndex() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Accueil", url: "/" }, { name: "Blog", url: "/blog" }]} />

      <section className="snowy" style={{ background: navy, paddingTop: 140 }}>
        <div className="container">
          <Breadcrumb dark items={[{ name: "Accueil", href: "/" }, { name: "Blog" }]} />
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <SectionTag dark>Blog</SectionTag>
            <h1 style={{ color: ivory, marginBottom: 18 }}>Conseils, tarifs et guides</h1>
            <p style={{ color: "rgba(243,233,210,0.82)", fontSize: 19, margin: "0 auto", maxWidth: 700 }}>
              Articles pratiques sur les lumières de Noël, les tarifs réels au Québec, et comment
              planifier votre saison.
            </p>
          </div>
        </div>
      </section>

      <section style={{ background: offWhite }}>
        <div className="container">
          <div className="grid-3" style={{ gap: 24 }}>
            {blogPosts.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="glow-card-light" style={{
                display: "flex", flexDirection: "column", textDecoration: "none",
                background: "#fff", borderRadius: 16, overflow: "hidden",
                border: "1px solid #ece5d6",
              }}>
                <div style={{ aspectRatio: "16 / 10", background: "#11202f" }}>
                  <img src={p.image} alt={p.imageAlt} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: 22, display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ color: goldText, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>
                    {p.tags?.[0]} · {p.readingTime}
                  </div>
                  <h2 style={{ color: charcoal, fontSize: 22, marginBottom: 8, lineHeight: 1.15 }}>{p.title}</h2>
                  <p style={{ color: "#555", fontSize: 15, marginBottom: 14, flex: 1 }}>{p.excerpt}</p>
                  <div style={{ color: "#888", fontSize: 13 }}>{fmtDate(p.date)}</div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 56 }}>
            <CTAButton href="/soumission">Soumission gratuite</CTAButton>
          </div>
        </div>
      </section>
    </>
  );
}
