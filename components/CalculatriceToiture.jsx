"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { navy, ivory, gold, charcoal, offWhite } from "@/components/data";
import { evenement } from "@/lib/evenements";
import { CAS_DEMO, PANNEAUX, cheminPanneau } from "@/components/demos";
import { CaseConsentement, NoteSoumission } from "@/components/ConsentementAttribution";

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

// Chemin manuel — le filet de sécurité. Il existe pour deux raisons : la
// carte peut ne pas charger (quota, réseau, navigateur), et certains
// visiteurs connaissent déjà leur métrage et n'ont aucune envie de tracer.
// Les bornes 40–1000 pi sont les mêmes que côté serveur : au-delà, pas de
// prix automatique.
const MANUEL_MIN = 40;
const MANUEL_MAX = 1000;
const DELAI_CARTE_MS = 4000;
const PRESETS = [
  { titre: "Bungalow", plage: "120–160 pi", valeur: 140 },
  { titre: "Cottage", plage: "160–220 pi", valeur: 190 },
  { titre: "Grand cottage", plage: "220–300 pi", valeur: 260 },
];

// --- Chargement de Google Maps -----------------------------------------------
// DEUX ÉCHECS DISTINCTS, et il faut les deux :
//
//   1. le script ne charge pas       → `onerror`
//   2. le script charge, PUIS Google REFUSE la clé (domaine non autorisé,
//      facturation absente) → `gm_authFailure`, qui arrive APRÈS que le
//      callback a résolu.
//
// Le cas 2 est le piège : la promesse est déjà tenue, l'assistant reste sur
// l'étape « tracez », et le visiteur voit une carte vide avec des boutons qui
// ne font rien. Vérifié : sur un domaine non autorisé, Google rend
// `RefererNotAllowedMapError` et la carte ne s'affiche jamais.
//
// On garde donc un drapeau + des abonnés, pour que le composant bascule sur le
// repli même quand le refus arrive tard.
let promesseMaps = null;
let cleRefusee = false;
const abonnes = new Set();

export const cleMapsRefusee = () => cleRefusee;
function signalerRefus() {
  cleRefusee = true;
  promesseMaps = null;
  abonnes.forEach((f) => { try { f(); } catch {} });
}
function surRefus(f) { abonnes.add(f); return () => abonnes.delete(f); }

function chargerMaps() {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (cleRefusee) return Promise.reject(new Error("cle_refusee"));
  if (window.google?.maps?.geometry) return Promise.resolve(window.google.maps);
  if (promesseMaps) return promesseMaps;
  promesseMaps = new Promise((resolve, reject) => {
    // `loading=async` OBLIGE le paramètre `callback` : sinon `onload` se
    // déclenche AVANT que window.google.maps existe, et un chargeur qui s'y
    // fie rejette systématiquement. Même motif que la calculatrice de
    // gouttières, qui tourne en production.
    const nom = "__lumiereMapsPret_" + Math.random().toString(36).slice(2, 8);
    window[nom] = () => { resolve(window.google.maps); delete window[nom]; };
    window.gm_authFailure = () => { signalerRefus(); reject(new Error("cle_refusee")); };

    const el = document.createElement("script");
    el.async = true; el.defer = true;
    el.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(CLE_MAPS)}`
      + `&libraries=places,geometry&callback=${nom}&v=weekly&loading=async`;
    el.onerror = () => { promesseMaps = null; reject(new Error("script refusé")); };
    document.head.appendChild(el);
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
  const [manuel, setManuel] = useState(false);
  const [piedsManuels, setPiedsManuels] = useState("");
  const [carteLente, setCarteLente] = useState(false);
  const [maquette, setMaquette] = useState({ ouvert: false, nom: "", telephone: "", adresse: "", consent: false, statut: "idle" });

  const divCarte = useRef(null);
  const carte = useRef(null);
  const traces = useRef([]);
  const champAdresse = useRef(null);

  // Un refus de clé peut arriver APRÈS le chargement du script : on s'abonne
  // pour basculer sur le repli à ce moment-là, plutôt que de laisser une
  // carte vide et des boutons inertes.
  useEffect(() => surRefus(() => setCarteKO(true)), []);

  // Pas de clé, script refusé, refus tardif : dans tous les cas le visiteur
  // garde un chemin qui aboutit à un prix. Avant, il tombait sur un
  // formulaire « on viendra mesurer » — un rendez-vous au lieu d'un chiffre.
  useEffect(() => { if (carteKO) setManuel(true); }, [carteKO]);

  // Si l'étape « mesure » reste sans carte au bout de 4 s, on ne laisse pas
  // le visiteur devant un rectangle noir : on passe au chemin manuel et on
  // le dit. Mieux vaut un prix saisi qu'un écran mort.
  useEffect(() => {
    if (etape !== "mesure" || manuel || carteKO) return;
    const t = setTimeout(() => {
      if (!carte.current) { setCarteLente(true); setManuel(true); evenement("calc_manual_used", { raison: "carte_lente" }); }
    }, DELAI_CARTE_MS);
    return () => clearTimeout(t);
  }, [etape, manuel, carteKO]);

  // --- Carte ---------------------------------------------------------------
  useEffect(() => {
    if (etape !== "mesure" || carteKO || manuel || carte.current) return;
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
  }, [etape, carteKO, manuel, adresse]);

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
          ...(manuel ? { measure_method: "manual", linearFt: Number(piedsManuels) } : {}),
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
      evenement("calc_price_shown", {
        price: d.quotable ? d.total : null,
        linear_ft: d.linearFt ?? null,
        measure_method: d.measureMethod || (manuel ? "manual" : "map"),
      });
    } catch {
      setErreur("Connexion perdue. Réessayez, ou appelez-nous.");
    }
    setEnvoi(false);
  }

  const champ = { width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #d9d2c2", fontSize: 16 };
  const carteBlanche = { background: "#fff", borderRadius: 18, padding: "clamp(20px,3vw,30px)" };

  // Le repli « on viendra mesurer » a été retiré (2026-09-03) : quand la
  // carte ne charge pas, le visiteur passe par le chemin manuel et repart
  // avec un prix, pas avec une promesse de rappel.
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
            onClick={() => { evenement("calc_address_entered"); setEtape("mesure"); }}>Voir ma toiture →</button>
          {/* Le chemin manuel est offert d'emblée, pas seulement en cas de
              panne : un client qui connaît son métrage ne veut pas tracer. */}
          <button type="button"
            onClick={() => { setManuel(true); setEtape("mesure"); evenement("calc_manual_used", { raison: "choix_client" }); }}
            style={{ display: "block", marginTop: 14, background: "none", border: "none", padding: 0,
              color: charcoal, textDecoration: "underline", cursor: "pointer", fontSize: 15 }}>
            Je préfère entrer mes pieds linéaires
          </button>
        </>
      )}

      {etape === "mesure" && manuel && (
        <>
          <h3 style={{ marginBottom: 8 }}>Vos pieds linéaires</h3>
          {(carteLente || carteKO) && (
            <p style={{ background: "#FFF6E5", border: "1px solid #EBD9AE", borderRadius: 12,
              padding: "12px 14px", color: "#6B4E00", fontSize: 15, marginBottom: 14 }}>
              L'image satellite n'est pas disponible pour le moment — entrez vos pieds linéaires.
            </p>
          )}
          <p style={{ color: "#444", marginBottom: 16, fontSize: 15 }}>
            La longueur de toiture et de gouttières à illuminer, en pieds. Si vous ne l'avez pas,
            partez du gabarit le plus proche de votre maison — on valide la mesure sur place.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 16 }}>
            {PRESETS.map((p) => {
              const actif = Number(piedsManuels) === p.valeur;
              return (
                <button key={p.titre} type="button" onClick={() => setPiedsManuels(String(p.valeur))}
                  style={{ textAlign: "left", padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                    border: actif ? `2px solid ${charcoal}` : "1px solid #d9d2c2",
                    background: actif ? offWhite : "#fff" }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.titre}</div>
                  <div style={{ color: "#666", fontSize: 14 }}>{p.plage}</div>
                </button>
              );
            })}
          </div>
          <label htmlFor="pieds-manuels" style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
            Pieds linéaires
          </label>
          <input id="pieds-manuels" style={champ} type="number" inputMode="numeric"
            min={MANUEL_MIN} max={MANUEL_MAX} placeholder="ex. 165"
            value={piedsManuels} onChange={(e) => setPiedsManuels(e.target.value)} />
          <p style={{ color: "#666", fontSize: 13, marginTop: 8, marginBottom: 0 }}>
            Entre {MANUEL_MIN} et {MANUEL_MAX} pi. Hors de cette plage, on passe par une visite.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <button style={btn()}
              disabled={!(Number(piedsManuels) >= MANUEL_MIN && Number(piedsManuels) <= MANUEL_MAX)}
              onClick={() => setEtape("extras")}>Continuer →</button>
            {!carteLente && !carteKO && CLE_MAPS && (
              <button type="button" onClick={() => { setManuel(false); setPiedsManuels(""); }}
                style={{ ...btn("ghost"), color: charcoal, border: "1px solid #d9d2c2" }}>
                Tracer sur la carte
              </button>
            )}
          </div>
        </>
      )}

      {etape === "mesure" && !manuel && (
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
          <button style={{ ...btn(), marginTop: 16 }} disabled={sections < 1}
            onClick={() => { evenement("calc_roof_traced", { sections, pi_apercu: piApercu }); setEtape("extras"); }}>
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
                fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(40px,10vw,64px)",
                color: charcoal, lineHeight: 1, marginBottom: 8,
              }}>
                Votre prix : {Number(resultat.total).toLocaleString("fr-CA")} $ tout inclus
              </div>
              <div style={{ color: "#444", fontSize: 15, marginBottom: 4 }}>
                Colonnes, arbres et arbustes en sus, évalués sur place.
              </div>
              <div style={{ color: "#444", fontSize: 15, marginBottom: 16 }}>
                Prix ferme confirmé lors de la visite.
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
          <BlocMaquette
            resultat={resultat}
            adresse={adresse}
            manuel={manuel}
            maquette={maquette}
            setMaquette={setMaquette}
          />

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

// =============================================================================
// « Avant d'installer, vous voyez le résultat » + demande de maquette
// =============================================================================
// Trois vrais chantiers en trois panneaux (maison → maquette → résultat), puis
// le seul geste qui reste au visiteur convaincu : demander SA maquette.
//
// Les images sont fournies par Yahir. Tant qu'un dossier de cas est vide, le
// composant montre l'explication sans les vignettes plutôt qu'un cadre cassé
// ou une image d'illustration — ce site a déjà été pris à légender des rendus
// générés comme de vraies réalisations.
function BlocMaquette({ resultat, adresse, manuel, maquette, setMaquette }) {
  const [casDispo, setCasDispo] = useState([]);

  // On teste les images côté navigateur : pas de manifeste à maintenir, et un
  // dossier rempli plus tard apparaît tout seul au prochain chargement.
  useEffect(() => {
    let vivant = true;
    Promise.all(
      CAS_DEMO.map((c) =>
        Promise.all(
          PANNEAUX.map((p) => new Promise((res) => {
            const img = new Image();
            img.onload = () => res(true);
            img.onerror = () => res(false);
            img.src = cheminPanneau(c.slug, p.cle);
          }))
        ).then((r) => (r.every(Boolean) ? c : null))
      )
    ).then((r) => { if (vivant) setCasDispo(r.filter(Boolean)); });
    return () => { vivant = false; };
  }, []);

  const majM = (k, v) => setMaquette((p) => ({ ...p, [k]: v }));

  async function demanderMaquette() {
    majM("statut", "envoi");
    try {
      const r = await fetch("/api/calc-noel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "maquette",
          contact: { nom: maquette.nom, telephone: maquette.telephone },
          address: maquette.adresse,
          linearFt: resultat.linearFt,
          estimatedPrice: resultat.quotable ? resultat.total : null,
          measure_method: manuel ? "manual" : "map",
          photoParTexto: true,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.ok === false) { majM("statut", "erreur"); return; }
      majM("statut", "envoye");
      evenement("maquette_requested", {
        linear_ft: resultat.linearFt ?? null,
        price: resultat.quotable ? resultat.total : null,
      });
    } catch { majM("statut", "erreur"); }
  }

  const champM = { width: "100%", padding: "13px 15px", borderRadius: 12, border: "1px solid #d9d2c2", fontSize: 16 };

  return (
    <div style={{ textAlign: "left", marginTop: 26, paddingTop: 26, borderTop: "1px solid #e6e0d0" }}>
      <h3 style={{ marginBottom: 8 }}>Avant d'installer, vous voyez le résultat</h3>

      {casDispo.length > 0 && (
        <div style={{ display: "grid", gap: 18, marginBottom: 18 }}>
          {casDispo.map((c) => (
            <figure key={c.slug} style={{ margin: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {PANNEAUX.map((p) => (
                  <div key={p.cle}>
                    <img src={cheminPanneau(c.slug, p.cle)} alt={`${p.titre} — ${c.ville}`} loading="lazy"
                      style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 10, display: "block" }} />
                    <div style={{ fontSize: 12, color: "#666", marginTop: 5 }}>{p.legende}</div>
                  </div>
                ))}
              </div>
              <figcaption style={{ fontSize: 13, color: "#444", marginTop: 8 }}>
                {c.ville} · {c.pieds} pi linéaires
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <p style={{ color: "#444", fontSize: 15, lineHeight: 1.7, marginBottom: 18 }}>
        Après votre soumission, vous recevez une maquette de votre maison avec le design proposé.
        Vous ajustez — couleurs, sections, arbres — et on installe exactement ce que vous avez approuvé.
      </p>

      {maquette.statut === "envoye" ? (
        <p style={{ background: "#EAF5EF", border: "1px solid #BFE0CE", borderRadius: 12,
          padding: "14px 16px", color: "#2E6B4F", fontSize: 15, margin: 0 }}>
          ✓ Demande reçue. On prépare votre maquette et on vous rappelle pour valider le design.
        </p>
      ) : !maquette.ouvert ? (
        <button style={btn()} onClick={() => setMaquette((p) => ({
          ...p, ouvert: true, adresse: p.adresse || adresse,
        }))}>
          Recevoir ma maquette gratuite
        </button>
      ) : (
        <div style={{ display: "grid", gap: 12, background: offWhite, borderRadius: 14, padding: 18 }}>
          <div>
            <label htmlFor="mq-nom" style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 5 }}>Nom *</label>
            <input id="mq-nom" style={champM} value={maquette.nom} onChange={(e) => majM("nom", e.target.value)} />
          </div>
          <div>
            <label htmlFor="mq-tel" style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 5 }}>Téléphone *</label>
            <input id="mq-tel" style={champM} inputMode="tel" value={maquette.telephone} onChange={(e) => majM("telephone", e.target.value)} />
          </div>
          <div>
            <label htmlFor="mq-adr" style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 5 }}>Adresse</label>
            <input id="mq-adr" style={champM} value={maquette.adresse} onChange={(e) => majM("adresse", e.target.value)} />
          </div>
          <p style={{ fontSize: 14, color: "#444", margin: 0 }}>
            Une photo de votre maison aide au design — envoyez-la par texto au{" "}
            <a href="tel:4388126635" style={{ color: charcoal, fontWeight: 700 }}>(438) 812-6635</a>.
          </p>
          <CaseConsentement id="mq-consent" checked={maquette.consent}
            onChange={(v) => majM("consent", v)} />
          <button style={btn()}
            disabled={maquette.statut === "envoi" || !maquette.nom || !maquette.telephone || !maquette.consent}
            onClick={demanderMaquette}>
            {maquette.statut === "envoi" ? "Envoi…" : "Recevoir ma maquette gratuite"}
          </button>
          {maquette.statut === "erreur" && (
            <p style={{ color: "#9E2A2A", fontSize: 14, margin: 0 }}>
              On n'a pas pu enregistrer votre demande. Appelez-nous au (438) 812-6635.
            </p>
          )}
          <NoteSoumission />
        </div>
      )}
    </div>
  );
}
