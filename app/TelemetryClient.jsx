"use client";
import { useEffect } from "react";

// Petit client de télémétrie côté navigateur :
//   • intercepte les clics sur les liens tel: (partout dans le site) et
//     émet un événement "call_click" vers Meta Pixel / Google Analytics /
//     Vercel Analytics — utile en octobre pour attribuer les appels au canal.
//   • ne rend rien.
export default function TelemetryClient() {
  useEffect(() => {
    const onClick = (e) => {
      const anchor = e.target?.closest?.('a[href^="tel:"]');
      if (!anchor) return;
      const number = anchor.getAttribute("href")?.replace("tel:", "") || "";
      try {
        if (typeof window.fbq === "function") {
          window.fbq("trackCustom", "CallClick", { phone: number });
        }
        if (typeof window.gtag === "function") {
          window.gtag("event", "call_click", { phone_number: number });
        }
        if (typeof window.va === "function") {
          window.va("event", { name: "call_click", data: { phone: number } });
        }
      } catch { /* silent */ }
    };
    document.addEventListener("click", onClick, { passive: true });
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
