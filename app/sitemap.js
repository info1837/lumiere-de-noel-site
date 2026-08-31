import { company, services, cities, blogPosts } from "@/components/data";

const BASE = company.baseUrl;

export default function sitemap() {
  const now = new Date();

  const staticRoutes = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/realisations`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/eclairage-architectural`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/soumission`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/secteur`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  const serviceRoutes = services.map((s) => ({
    url: `${BASE}/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  const cityRoutes = cities.map((c) => ({
    url: `${BASE}/secteur/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  // Matrice service × ville (long-tail SEO)
  const cityServiceRoutes = [];
  for (const c of cities) {
    for (const s of services) {
      cityServiceRoutes.push({
        url: `${BASE}/secteur/${c.slug}/${s.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  const blogRoutes = blogPosts.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...cityRoutes,
    ...cityServiceRoutes,
    ...blogRoutes,
  ];
}
