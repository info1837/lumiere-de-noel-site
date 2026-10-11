import Link from "next/link";
import { notFound } from "next/navigation";
import { CTAButton } from "@/components/ui";
import { HeroPage } from "@/components/sections";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/jsonld";
import { blogPosts, findPost } from "@/components/data";
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

      {/* Partie 3 : le hero de toutes les pages intérieures, avec la photo
          de l'article. Puis une seule colonne lisible — crème sur marine,
          18 px, ~68 caractères — l'encadré de réservation APRÈS l'article,
          et « À lire ensuite » dessous, à toutes les largeurs. */}
      <HeroPage
        photo={{ src: p.image, alt: p.imageAlt }}
        kicker={`${p.tags?.[0] ? `${p.tags[0]} · ` : ""}${p.readingTime} · ${fmtDate(p.date)}`}
        titre={p.title}
        reserver="/soumission"
        preuve={false}
        filAriane={[{ name: "Accueil", href: "/" }, { name: "Blog", href: "/blog" }, { name: p.title }]}
      />

      <section className="section-article" style={{ background: "#0A1524" }}>
        <div className="container">
          {/* ⚠️ LA GRILLE VIT DANS globals.css, JAMAIS EN STYLE EN LIGNE.
              Un `gridTemplateColumns` en ligne gagne contre toute media query :
              à 375 px la grille restait à deux colonnes, résolue en
              « 0px 280px », et l'article s'affichait un mot par ligne à côté
              de « À lire ensuite ». Gardé par scripts/check-blog-mobile.mjs. */}
          <div className="blog-grid">
            <article className="blog-article">
              <BlogContent blocks={body} />
            </article>

            <div className="blog-reserver">
              <div className="blog-reserver__tag">Prêt à démarrer ?</div>
              <h2 className="blog-reserver__titre">Réservez votre date</h2>
              <p>Une estimation claire pour votre propriété, après une courte consultation.</p>
              <CTAButton href="/soumission" variant="creme">Réserver ma date</CTAButton>
            </div>

            <aside className="blog-aside" aria-labelledby="a-lire-ensuite">
              <div id="a-lire-ensuite" className="blog-reserver__tag">À lire ensuite</div>
              {others.map((o) => (
                <Link key={o.slug} href={`/blog/${o.slug}`} className="blog-suivant">
                  <span className="blog-suivant__titre">{o.title}</span>
                  <span className="blog-suivant__meta">{o.readingTime} · {fmtDate(o.date)}</span>
                </Link>
              ))}
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
