// =============================================================================
// Helpers JSON-LD — schema.org structured data
// -----------------------------------------------------------------------------
// Composants serveur (zéro JS client). Chacun rend un <script type="application/ld+json">
// avec le payload sérialisé. Utilisation :
//   <FaqJsonLd items={[{q,a}, ...]} />
//   <BreadcrumbJsonLd items={[{name,url}, ...]} />
//   <ServiceJsonLd service={s} areaServed={[city, ...]} />
//   <ArticleJsonLd post={postMeta} url={absoluteUrl} body={...} />
// =============================================================================

import { company } from "@/components/data";

const BASE = company.baseUrl;

function Script({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function FaqJsonLd({ items }) {
  if (!items?.length) return null;
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }) {
  if (!items?.length) return null;
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.name,
          item: it.url?.startsWith("http") ? it.url : `${BASE}${it.url || ""}`,
        })),
      }}
    />
  );
}

// VideoObject — une vidéo hébergée sur le site (fichiers dans public/videos).
export function VideoObjectJsonLd({ name, description, thumbnail, contentUrl, duration, uploadDate, pageUrl }) {
  const abs = (u) => (u.startsWith("http") ? u : `${BASE}${u}`);
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name,
        description,
        thumbnailUrl: [abs(thumbnail)],
        contentUrl: abs(contentUrl),
        uploadDate,
        duration,
        encodingFormat: "video/mp4",
        inLanguage: "fr-CA",
        ...(pageUrl ? { url: abs(pageUrl) } : {}),
        publisher: { "@type": "Organization", name: company.name, url: BASE },
      }}
    />
  );
}

export function ServiceJsonLd({ service, areaServed, urlPath }) {
  if (!service) return null;
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: service.title,
        name: service.h1 || service.title,
        description: service.metaDescription,
        provider: {
          "@type": "LocalBusiness",
          name: company.name,
          telephone: company.phoneHref ? company.phoneHref.replace("tel:", "") : undefined,
          email: company.email,
          url: BASE,
        },
        areaServed: (areaServed || []).map((c) => ({ "@type": "City", name: c })),
        url: `${BASE}${urlPath || ""}`,
        image: service.heroImage ? `${BASE}${service.heroImage}` : undefined,
      }}
    />
  );
}

export function ArticleJsonLd({ post, urlPath }) {
  if (!post) return null;
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.metaDescription || post.excerpt,
        image: post.image ? `${BASE}${post.image}` : undefined,
        datePublished: post.date,
        dateModified: post.date,
        author: { "@type": "Organization", name: company.name },
        publisher: {
          "@type": "Organization",
          name: company.name,
          logo: {
            "@type": "ImageObject",
            url: `${BASE}/favicon-512.png`,
          },
        },
        mainEntityOfPage: `${BASE}${urlPath}`,
      }}
    />
  );
}
