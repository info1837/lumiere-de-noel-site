"use client";
import { useEffect, useState } from "react";
import { FIN_INSCRIPTIONS } from "@/lib/concours";

// Le temps qui reste avant la fin des inscriptions (5 nov., 23 h 59 HE).
//
// ⚠️ Rendu SERVEUR = la date en clair, pas un compte : le serveur et le
// navigateur n'ont pas la même heure, et un compte calculé des deux côtés
// ferait une erreur d'hydratation. Le compte remplace le texte dans la
// MÊME boîte (hauteur fixe) : aucun décalage de mise en page.
const FIN = new Date(FIN_INSCRIPTIONS).getTime();

function decouper(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { j: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export default function CompteARebours() {
  const [reste, setReste] = useState(null);
  useEffect(() => {
    const maj = () => setReste(FIN - Date.now());
    maj();
    const id = setInterval(maj, 1000);
    return () => clearInterval(id);
  }, []);

  const fini = reste !== null && reste <= 0;
  const d = reste !== null ? decouper(reste) : null;
  return (
    <div className="concours-compte" role="timer" aria-live="off" aria-label="Temps restant pour participer">
      {d === null && <span>Inscriptions jusqu&apos;au 5 novembre, 23 h 59</span>}
      {fini && <span>Les inscriptions sont terminées — tirage le 6 novembre</span>}
      {d && !fini && (
        <>
          <span className="concours-compte__libelle">Fin des inscriptions dans</span>
          {[["j", d.j], ["h", d.h], ["min", d.m], ["s", d.s]].map(([u, v]) => (
            <span key={u} className="concours-compte__bloc">
              <b>{String(v).padStart(2, "0")}</b>{u}
            </span>
          ))}
        </>
      )}
    </div>
  );
}
