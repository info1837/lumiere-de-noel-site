"use client";
import { useEffect, useState } from "react";

// Ambiance festive globale (toutes les pages) : neige douce + apparition au
// scroll des sections. Sobre et professionnel. Respecte prefers-reduced-motion.
const FLAKES = 34;

export default function FestiveLayer() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setReady(true);

    const els = Array.from(document.querySelectorAll("main section"));
    const vh = window.innerHeight;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.9) {
        el.classList.add("reveal", "is-visible"); // déjà visible : aucun flash
      } else {
        el.classList.add("reveal");
        io.observe(el);
      }
    });
    return () => io.disconnect();
  }, []);

  if (!ready) return null;

  const flakes = Array.from({ length: FLAKES }, (_, i) => {
    const size = 2 + (i % 4);
    const left = (i * 97) % 100;
    const dur = 9 + (i % 7) * 2;
    const delay = -((i * 1.7) % 12);
    const dx = ((i % 5) - 2) * 16;
    const o = 0.32 + (i % 4) * 0.08;
    return (
      <span
        key={i}
        className="flake"
        style={{
          left: `${left}vw`,
          width: size,
          height: size,
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
          "--dx": `${dx}px`,
          "--o": o,
        }}
      />
    );
  });

  return (
    <div className="snow" aria-hidden="true">
      {flakes}
    </div>
  );
}
