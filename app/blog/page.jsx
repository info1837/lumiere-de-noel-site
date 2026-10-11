import Image from "next/image";
import { flouDe } from "@/components/photos-flou";
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

      <section style={{ background: "#060E18" }}>
        <div className="container">
          <div className="grid-3" style={{ gap: 24 }}>
            {blogPosts.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="glow-card" style={{
                display: "flex", flexDirection: "column", textDecoration: "none",
                background: "#0F1E33", borderRadius: 16, overflow: "hidden",
                border: "1px solid rgba(240,234,222,0.12)",
              }}>
                <div style={{ position: "relative", aspectRatio: "16 / 10", background: "#11202f" }}>
                  <Image src={p.image} alt={p.imageAlt} fill sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 380px"
                    placeholder="blur" blurDataURL={flouDe(p.image)} style={{ objectFit: "cover" }} />
                </div>
                <div style={{ padding: 22, display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ color: gold, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>
                    {p.tags?.[0]} · {p.readingTime}
                  </div>
                  <h2 style={{ color: ivory, fontSize: 22, marginBottom: 8, lineHeight: 1.15 }}>{p.title}</h2>
                  <p style={{ color: "rgba(240,234,222,0.76)", fontSize: 15, marginBottom: 14, flex: 1 }}>{p.excerpt}</p>
                  <div style={{ color: "rgba(240,234,222,0.62)", fontSize: 13 }}>{fmtDate(p.date)}</div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 56 }}>
            <CTAButton href="/soumission" variant="creme">Réserver ma date</CTAButton>
          </div>
        </div>
      </section>
    </>
  );
}
