import { company } from "@/components/data";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${company.baseUrl}/sitemap.xml`,
  };
}
