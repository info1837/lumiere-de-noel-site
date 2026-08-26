/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  // Sert AVIF/WebP automatiquement quand on migrera vers next/image (LCP + SEO).
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400, // 31 jours
  },
  // Redirige les anciens slugs Squarespace s'ils sont encore indexés.
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/index", destination: "/", permanent: true },

      // .ca -> .com. Le .ca est l'ancien domaine : les pubs Meta de la
      // saison passée pointent dessus, et il rend actuellement un 404
      // Squarespace « No Such Website ». On redirige en 308 en gardant le
      // chemin, pour ne perdre ni le trafic ni le jus SEO.
      //
      // Le filtre est sur l'hôte, pas sur le chemin : les deux domaines
      // arrivent sur le MÊME déploiement Vercel, donc sans cette condition
      // on créerait une boucle sur le .com.
      //
      // ⚠️ Inerte tant que le DNS du .ca pointe sur Squarespace
      // (NS = ns-cloud-*.googledomains.com, A = 198.49.23.x / 198.185.159.x).
      // Rien n'atteint Vercel, donc rien ne peut être redirigé. Voir le
      // README / la note de session pour les enregistrements à changer.
      {
        source: "/:path*",
        has: [{ type: "host", value: "(www\\.)?lumieredenoelinc\\.ca" }],
        destination: "https://lumieredenoelinc.com/:path*",
        permanent: true,
      },
    ];
  },
};
export default nextConfig;
