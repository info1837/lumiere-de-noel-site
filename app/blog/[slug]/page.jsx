import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionTag, CTAButton, Breadcrumb } from "@/components/ui";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/jsonld";
import { blogPosts, findPost, navy, offWhite, ivory, gold, charcoal, goldText } from "@/components/data";
import { postBodies, BlogContent } from "../posts";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const p = findPost(params.slug);
  if (!p) return {};
  return {
    // SEO P0 — les 3 titres d'articles dépassaient 60 c. avec le suffixe.
    // `seoTitle` (data.js) porte la forme courte; `title` reste le titre
    // éditorial affiché en H1 et sur la carte.
    title: { absolute: p.seoTitle || p.title },
    description: p.metaDescription || p.excerpt,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: {
      type: "article",
      title: `${p.seoTitle || p.title} | Solution Lumière de Noël`,
      description: p.metaDescription || p.excerpt,
      url: `/blog/${p.slug}`,
      images: [p.image],
      publishedTime: p.date,
    },
  };
}

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });

export default function BlogPost({ params }) {
  const p = findPost(params.slug);
  if (!p) return notFound();
  const body = postBodies[p.slug];
  const others = blogPosts.filter((x) => x.slug !== p.slug);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: p.title, url: `/blog/${p.slug}` },
        ]}
      />
      <ArticleJsonLd post={p} urlPath={`/blog/${p.slug}`} />

      {/* Hero compact (image + titre) */}
      <section style={{ position: "relative", padding: 0, background: navy, paddingTop: 100 }}>
        <div style={{ position: "relative", height: 380, overflow: "hidden" }}>
          <img src={p.image} alt={p.imageAlt}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,10,20,0.92), rgba(5,10,20,0.45))" }} />
          <div className="container" style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 24px 32px" }}>
            <div style={{ color: gold, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>
              {p.tags?.[0]} · {p.readingTime} · {fmtDate(p.date)}
            </div>
            <h1 style={{ color: ivory, fontSize: "clamp(2rem, 4.5vw, 3.2rem)", maxWidth: 900 }}>{p.title}</h1>
          </div>
        </div>
      </section>

      {/* Corps de l'article */}
      <section style={{ background: offWhite }}>
        <div className="container">
          <Breadcrumb items={[
            { name: "Accueil", href: "/" },
            { name: "Blog", href: "/blog" },
            { name: p.title },
          ]} />
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 56, alignItems: "start" }} className="blog-grid">
            <article>
              <BlogContent blocks={body} />
              <div style={{ marginTop: 32, padding: 24, background: "#fff", border: "1px solid #ece5d6", borderRadius: 14 }}>
                <div style={{ color: goldText, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
                  Prêt à démarrer ?
                </div>
                <h3 style={{ color: charcoal, fontSize: 22, marginBottom: 10 }}>Soumission gratuite et sans obligation</h3>
                <p style={{ color: "#555", marginBottom: 16 }}>
                  Réponse rapide avec une estimation claire pour votre propriété.
                </p>
                <CTAButton href="/soumission">Soumission gratuite</CTAButton>
              </div>
            </article>

            <aside style={{ position: "sticky", top: 100 }}>
              <div style={{ background: "#fff", border: "1px solid #ece5d6", borderRadius: 14, padding: 18 }}>
                <div style={{ color: goldText, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
                  À lire ensuite
                </div>
                {others.map((o) => (
                  <Link key={o.slug} href={`/blog/${o.slug}`} style={{
                    display: "block", textDecoration: "none", color: charcoal,
                    padding: "10px 0", borderBottom: "1px solid #f0ebde",
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>{o.title}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{o.readingTime} · {fmtDate(o.date)}</div>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
