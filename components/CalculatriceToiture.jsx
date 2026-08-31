"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { navy, ivory, gold, charcoal, offWhite } from "@/components/data";

// =============================================================================
// Calculatrice de toiture — le visiteur trace, le serveur chiffre
// =============================================================================
// Ce composant ne calcule JAMAIS un prix. Il affiche une longueur pendant le
// tracé (confort), envoie les POINTS à /api/calc-noel, et rend le nombre que
// le serveur renvoie. Le tarif et le plancher n'existent nulle part ici.
//
// Colonnes, arbres et arbustes sont des cases à cocher qui ne touchent pas au
// total : elles basculent la demande en « évaluation sur place ». Guirlandes
// et couronnes n'apparaissent pas — elles se vendent en personne.
//
// SANS CLÉ GOOGLE MAPS, la carte n'est pas affichée du tout : on bascule sur
// le formulaire d'évaluation. Un carré gris cassé ferait plus de mal que pas
// de calculatrice.
// =============================================================================

const CLE_MAPS = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
const ETAPES = ["adresse", "mesure", "extras", "contact", "prix"];

let promesseMaps = null;
function chargerMaps() {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.google?.maps?.geometry) return Promise.resolve(window.google.maps);
  if (promesseMaps) return promesseMaps;
  promesseMaps = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${CLE_MAPS}&libraries=places,geometry&v=weekly&loading=async`;
    s.async = true;
    s.onerror = () => reject(new Error("script refusé"));
    // Google appelle gm_authFailure quand la clé est refusée (domaine non
    // autorisé, facturation absente). Sans ce crochet, la carte reste grise
    // et on ne saurait pas pourquoi.
    window.gm_authFailure = () => reject(new Error("cle_refusee"));
    s.onload = () => (window.google?.maps ? resolve(window.google.maps) : reject(new Error("maps absent")));
    document.head.appendChild(s);
  });
  return promesseMaps;
}

const btn = (variant = "gold") => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "14px 22px", borderRadius: 300, border: "none", cursor: "pointer",
  fontWeight: 700, fontSize: 15, letterSpacing: "0.02em",
  background: variant === "gold" ? gold : "transparent",
  color: variant === "gold" ? charcoal : ivory,
  boxShadow: variant === "gold" ? "0 6px 20px rgba(11,27,43,0.16)" : "none",
  ...(variant === "ghost" ? { border: `1px solid rgba(243,233,210,0.4)` } : {}),
});

export default function CalculatriceToiture() {
  const [etape, setEtape] = useState("adresse");
  const [adresse, setAdresse] = useState("");
  const [lignes, setLignes] = useState([[]]);
  const [piApercu, setPiApercu] = useState(0);
  const [extras, setExtras] = useState({ colonnes: false, arbres: false, arbustes: false });
  const [contact, setContact] = useState({ nom: "", telephone: "", courriel: "" });
  const [pot, setPot] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [carteKO, setCarteKO] = useState(!CLE_MAPS);

  const divCarte = useRef(null);
  const carte = useRef(null);
  const traces = useRef([]);
  const champAdresse = useRef(null);

  // --- Carte ---------------------------------------------------------------
  useEffect(() => {
    if (etape !== "mesure" || carteKO || carte.current) return;
    let annule = false;
    chargerMaps()
      .then((maps) => {
        if (annule || !divCarte.current) return;
        carte.current = new maps.Map(divCarte.current, {
          center: { lat: 45.6722, lng: -73.8736 }, zoom: 20, mapTypeId: "satellite",
          tilt: 0, disableDefaultUI: true, gestureHandling: "greedy",
        });
        if (adresse) {
          new maps.Geocoder().geocode({ address: adresse + ", Québec, Canada" }, (r, st) => {
            if (st === "OK" && r[0] && carte.current) {
              carte.current.setCenter(r[0].geometry.location);
              carte.current.setZoom(20);
            }
          });
        }
      })
      .catch(() => { if (!annule) setCarteKO(true); });
    return () => { annule = true; };
  }, [etape, carteKO, adresse]);

  // Redessine les polylignes et met à jour l'aperçu de longueur.
  const redessiner = useCallback((nouvelles) => {
    const maps = window.google?.maps;
    if (!maps || !carte.current) return;
    traces.current.forEach((t) => t.setMap(null));
    traces.current = [];
    let metres = 0;
    for (const l of nouvelles) {
      if (l.length < 1) continue;
      const p = new maps.Polyline({
        path: l, map: carte.current, strokeColor: "#E9DCC0",
        strokeWeight: 4, strokeOpacity: 0.95,
      });
      traces.current.push(p);
      if (l.length >= 2) metres += maps.geometry.spherical.computeLength(p.getPath());
    }
    // Aperçu seulement — le prix vient du serveur, qui remesure.
    setPiApercu(Math.round(metres * 3.28084));
  }, []);

  const ajouterCoin = () => {
    const c = carte.current?.getCenter();
    if (!c) return;
    setLignes((prev) => {
      const n = prev.map((l) => [...l]);
      n[n.length - 1].push({ lat: c.lat(), lng: c.lng() });
      redessiner(n);
      return n;
    });
  };
  const nouvelleSection = () => setLignes((p) => (p[p.length - 1].length >= 2 ? [...p, []] : p));
  const annulerCoin = () => setLignes((prev) => {
    const n = prev.map((l) => [...l]);
    for (let i = n.length - 1; i >= 0; i--) { if (n[i].length) { n[i].pop(); break; } }
    redessiner(n);
    return n;
  });

  const sections = lignes.filter((l) => l.length >= 2).length;

  // --- Envoi ---------------------------------------------------------------
  async function envoyer() {
    setEnvoi(true); setErreur(null);
    try {
      const r = await fetch("/api/calc-noel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lignes, address: adresse, extras, contact, website: pot,
        }),
      });
      const d = await r.json();
      if (!r.ok || d.ok === false) {
        setErreur(d.error === "mauvaise_entreprise"
          ? "Configuration à corriger de notre côté. Appelez-nous, on s'en occupe."
          : "On n'arrive pas à calculer votre prix en ce moment. Appelez-nous — on vous le donne au téléphone.");
        setEnvoi(false); return;
      }
      setResultat(d); setEtape("prix");
    } catch {
      setErreur("Connexion perdue. Réessayez, ou appelez-nous.");
    }
    setEnvoi(false);
  }

  const champ = { width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #d9d2c2", fontSize: 16 };
  const carteBlanche = { background: "#fff", borderRadius: 18, padding: "clamp(20px,3vw,30px)" };

  // --- Repli sans carte -----------------------------------------------------
  if (carteKO && etape !== "prix") {
    return (
      <div style={carteBlanche}>
        <h3 style={{ marginBottom: 10 }}>Estimation sur place</h3>
        <p style={{ color: "#444", marginBottom: 20 }}>
          La carte satellite n'est pas disponible en ce moment. Laissez-nous votre adresse :
          on mesure votre toiture et on vous rappelle avec votre prix — c'est gratuit et sans obligation.
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          <input style={champ} placeholder="Adresse civique + ville" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
          <input style={champ} placeholder="Votre nom" value={contact.nom} onChange={(e) => setContact({ ...contact, nom: e.target.value })} />
          <input style={champ} placeholder="Téléphone" inputMode="tel" value={contact.telephone} onChange={(e) => setContact({ ...contact, telephone: e.target.value })} />
          <input style={champ} placeholder="Courriel" inputMode="email" value={contact.courriel} onChange={(e) => setContact({ ...contact, courriel: e.target.value })} />
          <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={pot} onChange={(e) => setPot(e.target.value)}
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
          <button style={btn()} disabled={envoi || !contact.nom || !contact.telephone} onClick={envoyer}>
            {envoi ? "Envoi…" : "Demander mon estimation"}
          </button>
          {erreur && <p style={{ color: "#9E2A2A", fontSize: 14, margin: 0 }}>{erreur}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={carteBlanche}>
      {/* fil des étapes */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {ETAPES.map((e) => (
          <div key={e} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: ETAPES.indexOf(etape) >= ETAPES.indexOf(e) ? gold : "#e6e0d0",
          }} />
        ))}
      </div>

      {etape === "adresse" && (
        <>
          <h3 style={{ marginBottom: 8 }}>Votre adresse</h3>
          <p style={{ color: "#444", marginBottom: 18 }}>
            On ouvre l'image satellite de votre propriété — vous tracerez votre ligne de toit dessus.
          </p>
          <input ref={champAdresse} style={champ} placeholder="123 rue Principale, Blainville"
            value={adresse} onChange={(e) => setAdresse(e.target.value)} />
          <button style={{ ...btn(), marginTop: 16 }} disabled={adresse.trim().length < 6}
            onClick={() => setEtape("mesure")}>Voir ma toiture →</button>
        </>
      )}

      {etape === "mesure" && (
        <>
          <h3 style={{ marginBottom: 8 }}>Tracez votre ligne de toit</h3>
          <p style={{ color: "#444", marginBottom: 14, fontSize: 15 }}>
            Placez la croix sur un coin du toit, touchez <strong>Ajouter un coin</strong>, puis suivez la
            ligne. Une nouvelle section pour le garage ou l'arrière.
          </p>
          <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", height: 340, background: "#0b1b2b" }}>
            <div ref={divCarte} style={{ position: "absolute", inset: 0 }} />
            {/* croix fixe : c'est la carte qui bouge, pas le doigt */}
            <div aria-hidden="true" style={{
              position: "absolute", top: "50%", left: "50%", width: 26, height: 26,
              transform: "translate(-50%,-50%)", pointerEvents: "none",
              borderRadius: "50%", border: `3px solid ${gold}`, boxShadow: "0 0 0 2px rgba(0,0,0,0.35)",
            }} />
            <div style={{
              position: "absolute", left: 12, top: 12, padding: "6px 12px", borderRadius: 300,
              background: "rgba(11,27,43,0.82)", color: ivory, fontSize: 13, fontWeight: 700,
            }}>
              {piApercu} pi · {sections} section{sections > 1 ? "s" : ""}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            <button style={btn()} onClick={ajouterCoin}>Ajouter un coin</button>
            <button style={{ ...btn("ghost"), color: charcoal, border: "1px solid #d9d2c2" }} onClick={annulerCoin}>Annuler</button>
            <button style={{ ...btn("ghost"), color: charcoal, border: "1px solid #d9d2c2" }} onClick={nouvelleSection}>Nouvelle section</button>
          </div>
          <button style={{ ...btn(), marginTop: 16 }} disabled={sections < 1} onClick={() => setEtape("extras")}>
            Continuer →
          </button>
        </>
      )}

      {etape === "extras" && (
        <>
          <h3 style={{ marginBottom: 8 }}>Autre chose à illuminer ?</h3>
          <p style={{ color: "#444", marginBottom: 16, fontSize: 15 }}>
            Ces éléments <strong>ne changent pas</strong> le prix affiché : on les évalue sur place,
            avec vous.
          </p>
          <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
            {[["colonnes", "Colonnes / poteaux"], ["arbres", "Arbres"], ["arbustes", "Arbustes et haies"]].map(([k, l]) => (
              <label key={k} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                border: `1px solid ${extras[k] ? gold : "#e0d9c8"}`, borderRadius: 12, cursor: "pointer",
              }}>
                <input type="checkbox" checked={extras[k]} onChange={(e) => setExtras({ ...extras, [k]: e.target.checked })} />
                <span style={{ fontSize: 16 }}>{l}</span>
              </label>
            ))}
          </div>
          <button style={btn()} onClick={() => setEtape("contact")}>Voir mon prix →</button>
        </>
      )}

      {etape === "contact" && (
        <>
          <h3 style={{ marginBottom: 8 }}>Où vous envoyer votre prix</h3>
          <p style={{ color: "#444", marginBottom: 18, fontSize: 15 }}>
            {piApercu} pi linéaires sur {sections} section{sections > 1 ? "s" : ""}. Votre prix s'affiche à l'écran.
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            <input style={champ} placeholder="Votre nom" value={contact.nom} onChange={(e) => setContact({ ...contact, nom: e.target.value })} />
            <input style={champ} placeholder="Téléphone" inputMode="tel" value={contact.telephone} onChange={(e) => setContact({ ...contact, telephone: e.target.value })} />
            <input style={champ} placeholder="Courriel (facultatif)" inputMode="email" value={contact.courriel} onChange={(e) => setContact({ ...contact, courriel: e.target.value })} />
            <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={pot} onChange={(e) => setPot(e.target.value)}
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
            <button style={btn()} disabled={envoi || !contact.nom || !contact.telephone} onClick={envoyer}>
              {envoi ? "Calcul…" : "Afficher mon prix"}
            </button>
            {erreur && <p style={{ color: "#9E2A2A", fontSize: 14, margin: 0 }}>{erreur}</p>}
          </div>
        </>
      )}

      {etape === "prix" && resultat && (
        <div style={{ textAlign: "center" }}>
          {resultat.quotable ? (
            <>
              <div style={{ color: "#666", fontSize: 14, marginBottom: 6 }}>
                {resultat.linearFt} pi linéaires de toiture
              </div>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(48px,12vw,72px)",
                color: charcoal, lineHeight: 1, marginBottom: 6,
              }}>
                {Number(resultat.total).toLocaleString("fr-CA")} $
              </div>
              {/* Phrase composée par le serveur. On l'affiche, on ne la fabrique pas. */}
              {resultat.note && (
                <div style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>{resultat.note}</div>
              )}
              <div style={{ background: offWhite, borderRadius: 14, padding: 18, textAlign: "left", marginBottom: 18 }}>
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Tout inclus :</div>
                <ul style={{ margin: 0, paddingLeft: 20, color: "#444", fontSize: 15, lineHeight: 1.7 }}>
                  {resultat.includes.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
              {resultat.surPlace?.length > 0 && (
                <p style={{ color: "#444", fontSize: 15, marginBottom: 18 }}>
                  <strong>{resultat.surPlace.join(", ")}</strong> : évalués séparément, sur place.
                </p>
              )}
            </>
          ) : (
            <>
              <h3 style={{ marginBottom: 10 }}>On vient mesurer avec vous</h3>
              <p style={{ color: "#444", marginBottom: 18 }}>
                {resultat.reason || "Votre toiture demande une évaluation sur place."} On vous rappelle
                pour fixer un moment — c'est gratuit et sans obligation.
              </p>
            </>
          )}
          <p style={{ color: resultat.leadEnregistre ? "#2E6B4F" : "#9E2A2A", fontSize: 14, margin: 0 }}>
            {resultat.leadEnregistre
              ? "✓ On vous rappelle pour confirmer votre date."
              : "Appelez-nous pour confirmer — on n'a pas pu enregistrer votre demande."}
          </p>
        </div>
      )}
    </div>
  );
}
