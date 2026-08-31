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
  // Note : `permanent: true` fait émettre un 308 par Next, pas un 301. Les
  // deux sont des redirections permanentes et Google les traite de façon
  // identique ; on garde `permanent: true` partout pour que ce fichier se
  // lise d'une seule façon, sans exception à expliquer.
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      // Le portfolio s'appelait /lumiere-de-noel — une URL qui ne dit pas ce
      // qu'elle contient, et que le pied de page appelait « Portfolio lumières »
      // pendant que la nav disait « Réalisations ». Un seul nom, une seule URL,
      // et une redirection permanente pour ne rien perdre de l'ancienne.
      { source: "/lumiere-de-noel", destination: "/realisations", permanent: true },
      // Volet municipal retiré pour la saison 2026 : aucun chantier municipal,
      // donc aucune photo, aucune étude de cas — la page ne pouvait
      // qu'affirmer une expérience inexistante. La redirection garde l'URL vivante.
      // CONDITION POUR RETIRER CETTE REDIRECTION ET REMETTRE LA PAGE :
      // un vrai contrat municipal livré, ET une photographie du chantier.
      // Pas l'un sans l'autre.
      { source: "/services/lumieres-de-noel-municipal", destination: "/services/lumieres-de-noel-commercial", permanent: true },
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
