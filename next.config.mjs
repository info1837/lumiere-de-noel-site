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
    ];
  },
};
export default nextConfig;
