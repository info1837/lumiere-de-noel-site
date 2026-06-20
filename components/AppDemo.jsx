"use client";
import { useState } from "react";
import { SectionTag, SectionTitle } from "@/components/ui";
import { offWhite, charcoal, gold } from "@/components/data";

// --- Démo interactive : "l'application" qui contrôle l'éclairage permanent ---
// 100% SVG/CSS. DEL placées comme du VRAI éclairage permanent : lignes de toit
// (triangle), ligne de gouttière/fascia, et toit + gouttière du garage.
// Aucune DEL sur les murs verticaux. État indépendant et persistant.

const AMBIANCES = [
  { key: "chaud", label: "Blanc chaud", palette: ["#FFE3A6"] },
  { key: "multi", label: "Multicolore", palette: ["#E0473C", "#36A95B", "#3E7DE0", "#F0B23C", "#8A4FD0", "#37C7C7"] },
  { key: "noel", label: "Noël", palette: ["#E0473C", "#2FAE5A", "#FFEBC8"] },
  { key: "halloween", label: "Halloween", palette: ["#F0871F", "#7B3FD0"] },
  { key: "valentin", label: "St-Valentin", palette: ["#F06FA8", "#E0473C", "#FFD6E6"] },
  { key: "quebec", label: "Fête nationale", palette: ["#2E6BE0", "#EAF1FF"] },
];

const EFFETS = [
  { key: "fixe", label: "Fixe", cls: "" },
  { key: "scintille", label: "Scintillement", cls: "led--twinkle" },
  { key: "poursuite", label: "Poursuite", cls: "led--chase" },
  { key: "fondu", label: "Fondu", cls: "led--breathe" },
];

function sample(p1, p2, n, skipFirst) {
  const out = [];
  for (let i = skipFirst ? 1 : 0; i < n; i++) {
    const t = i / (n - 1);
    out.push([p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t]);
  }
  return out;
}
// Maison 2 étages + garage attaché. Runs ordonnés (toit → gouttière → garage)
// pour que la "poursuite" voyage le long de l'architecture.
const ROOF_L = sample([46, 98], [131, 38], 9);          // pente de toit gauche
const ROOF_R = sample([131, 38], [216, 98], 9, true);   // pente de toit droite
const EAVE   = sample([58, 101], [204, 101], 13);       // gouttière / fascia principale
const GAR_L  = sample([202, 152], [245, 124], 5);       // toit garage gauche
const GAR_R  = sample([245, 124], [288, 152], 5, true); // toit garage droit
const GAR_E  = sample([210, 155], [282, 155], 7);       // gouttière garage
const LIGHTS = [...ROOF_L, ...ROOF_R, ...EAVE, ...GAR_L, ...GAR_R, ...GAR_E];
const N = LIGHTS.length;

export default function AppDemo() {
  const [ambKey, setAmbKey] = useState("chaud");
  const [effKey, setEffKey] = useState("fixe");
  const [bri, setBri] = useState(90);
  const [on, setOn] = useState(true);

  const amb = AMBIANCES.find((a) => a.key === ambKey);
  const eff = EFFETS.find((e) => e.key === effKey);
  const groupOpacity = on ? 0.35 + (bri / 100) * 0.65 : 0.05;

  // Fonction (PAS un composant) -> pas de remontage à chaque render.
  // key={effKey} sur le <g> -> redémarrage net de l'animation au changement d'effet.
  const lights = (r) => (
    <g key={effKey}>
      {LIGHTS.map(([x, y], i) => (
        <circle
          key={i}
          className={`led ${eff.cls}`}
          cx={x} cy={y} r={r}
          fill={amb.palette[i % amb.palette.length]}
          style={animDelay(effKey, i)}
        />
      ))}
    </g>
  );

  return (
    <section style={{ background: offWhite }}>
      <div className="container grid-2" style={{ alignItems: "center" }}>
        <div>
          <SectionTag>L'application</SectionTag>
          <SectionTitle>Changez d'ambiance en un geste</SectionTitle>
          <p style={{ color: "#444", fontSize: 18, marginBottom: 18 }}>
            Une fois l'éclairage permanent installé, tout se contrôle depuis votre téléphone :
            couleur, intensité, effets et scènes pour chaque occasion — sans jamais ressortir l'échelle.
          </p>
          <p style={{ color: "#444", fontSize: 16, marginBottom: 24 }}>
            👉 Essayez la démo : touchez une ambiance et un effet, la maison réagit en direct.
          </p>
          <ul style={{ listStyle: "none" }}>
            {["Des millions de couleurs", "Effets animés (scintillement, poursuite, fondu)",
              "Scènes prêtes : Noël, Halloween, Saint-Valentin, Fête nationale", "Minuteries et zones"].map((t, i) => (
              <li key={i} style={{ display: "flex", gap: 10, marginBottom: 10, color: charcoal, fontSize: 16 }}>
                <span className="bulb bulb--tw" aria-hidden="true" />{t}
              </li>
            ))}
          </ul>
        </div>

        {/* --- Maquette téléphone --- */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div role="group" aria-label="Démo de l'application d'éclairage" style={{
            width: "min(320px, 84vw)", aspectRatio: "1 / 2.04", background: "#0c0c10",
            borderRadius: 46, padding: 11, boxShadow: "0 30px 70px rgba(11,27,43,0.35)",
            border: "1px solid #23232b",
          }}>
            <div style={{
              position: "relative", width: "100%", height: "100%", borderRadius: 36,
              overflow: "hidden", background: "#0a0e16", display: "flex", flexDirection: "column",
            }}>
              <div aria-hidden="true" style={{
                position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
                width: 84, height: 22, background: "#000", borderRadius: 20, zIndex: 3,
              }} />

              {/* En-tête app — décalé SOUS l'encoche */}
              <div style={{
                padding: "44px 18px 10px", display: "flex", alignItems: "center",
                justifyContent: "space-between", color: "#EAEAF0", flexShrink: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span aria-hidden="true" style={{
                    width: 16, height: 16, borderRadius: "50%",
                    background: `radial-gradient(circle at 35% 30%, ${gold}, #b9923f)`,
                    boxShadow: `0 0 8px ${gold}`,
                  }} />
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, letterSpacing: "0.06em" }}>
                    LUMIÈRE · CONTRÔLE
                  </span>
                </div>
                <button
                  onClick={() => setOn((v) => !v)}
                  aria-label={on ? "Éteindre" : "Allumer"}
                  aria-pressed={on}
                  style={{
                    width: 40, height: 24, borderRadius: 20, border: "none", cursor: "pointer",
                    background: on ? gold : "#33333d", position: "relative", transition: "background .2s",
                    flexShrink: 0,
                  }}
                >
                  <span aria-hidden="true" style={{
                    position: "absolute", top: 3, left: on ? 19 : 3, width: 18, height: 18,
                    borderRadius: "50%", background: "#0a0e16", transition: "left .2s",
                  }} />
                </button>
              </div>

              {/* Scène : maison 2 étages + garage */}
              <div style={{ position: "relative", flex: "1 1 auto", minHeight: 0 }}>
                <svg viewBox="0 0 300 230" preserveAspectRatio="xMidYMid slice"
                  width="100%" height="100%" aria-hidden="true" style={{ display: "block" }}>
                  <defs>
                    <linearGradient id="adsky" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#0e1830" />
                      <stop offset="1" stopColor="#0a0e16" />
                    </linearGradient>
                    <filter id="adglow" x="-60%" y="-60%" width="220%" height="220%">
                      <feGaussianBlur stdDeviation="2.4" />
                    </filter>
                  </defs>
                  <rect x="0" y="0" width="300" height="230" fill="url(#adsky)" />
                  {[[30,28],[70,52],[120,22],[210,40],[262,26],[286,70],[18,86]].map(([x,y],i)=>(
                    <circle key={i} cx={x} cy={y} r="1.1" fill="#9fb0d0" opacity="0.5" />
                  ))}
                  <ellipse cx="150" cy="244" rx="240" ry="48" fill="#1a2236" />
                  <polygon points="14,184 32,138 50,184" fill="#0c1322" />

                  {/* Corps : maison principale (2 étages) + garage attaché */}
                  <polygon points="42,100 131,36 220,100" fill="#0b1018" />          {/* toit principal */}
                  <rect x="54" y="96" width="154" height="110" fill="#0b1018" />       {/* mur principal */}
                  <rect x="166" y="58" width="12" height="40" fill="#0b1018" />        {/* cheminée */}
                  <polygon points="200,154 245,122 290,154" fill="#0c111a" />          {/* toit garage */}
                  <rect x="208" y="150" width="76" height="56" fill="#0c111a" />       {/* mur garage */}

                  {/* Fenêtres / portes (lueur chaude douce) */}
                  {[70, 118, 166].map((fx) => (
                    <rect key={fx} x={fx} y="112" width="26" height="24" rx="2" fill="#d8b06a" opacity="0.5" />
                  ))}
                  <rect x="92" y="158" width="28" height="48" rx="2" fill="#e0b878" opacity="0.6" />
                  <rect x="150" y="162" width="26" height="24" rx="2" fill="#d8b06a" opacity="0.5" />
                  <rect x="220" y="166" width="54" height="40" rx="2" fill="#11161f" />

                  {/* Halo flou des DEL */}
                  <g filter="url(#adglow)" style={{ opacity: groupOpacity, transition: "opacity .3s" }}>
                    {lights(3.4)}
                  </g>
                  {/* Cœur net */}
                  <g style={{ opacity: groupOpacity, transition: "opacity .3s" }}>
                    {lights(1.7)}
                  </g>
                </svg>
              </div>

              {/* Panneau de contrôle */}
              <div style={{
                background: "#11151f", borderTop: "1px solid #1f2533", padding: "14px 16px 18px",
                flexShrink: 0,
              }}>
                <Label>Ambiance</Label>
                <Chips items={AMBIANCES} activeKey={ambKey} onPick={setAmbKey} swatch />
                <div style={{ height: 12 }} />
                <Label>Effet</Label>
                <Chips items={EFFETS} activeKey={effKey} onPick={setEffKey} />
                <div style={{ height: 14 }} />
                <Label>Intensité</Label>
                <input
                  type="range" min="20" max="100" value={bri}
                  onChange={(e) => setBri(+e.target.value)}
                  aria-label="Intensité lumineuse"
                  style={{ width: "100%", accentColor: gold, marginTop: 4 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Label({ children }) {
  return (
    <div style={{
      fontFamily: "'Nunito Sans', sans-serif", fontSize: 11, fontWeight: 700,
      letterSpacing: "0.16em", textTransform: "uppercase", color: "#7f8aa3", marginBottom: 7,
    }}>
      {children}
    </div>
  );
}

function Chips({ items, activeKey, onPick, swatch }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {items.map((it) => {
        const isOn = it.key === activeKey;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onPick(it.key)}
            aria-pressed={isOn}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 12px", borderRadius: 300, cursor: "pointer",
              fontFamily: "'Nunito Sans', sans-serif", fontSize: 12.5, fontWeight: 600,
              border: `1px solid ${isOn ? gold : "#2a3142"}`,
              background: isOn ? gold : "transparent",
              color: isOn ? "#10131a" : "#c7cede",
              transition: "all .18s",
            }}
          >
            {swatch && (
              <span aria-hidden="true" style={{
                width: 12, height: 12, borderRadius: "50%",
                background: it.palette.length > 1
                  ? `conic-gradient(${it.palette.join(",")})`
                  : it.palette[0],
                border: "1px solid rgba(0,0,0,0.25)",
              }} />
            )}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// "poursuite" = délai négatif réparti -> tête lumineuse qui voyage (base reste allumée).
// "scintillement" = délai pseudo-aléatoire. Sinon synchronisé.
function animDelay(effKey, i) {
  if (effKey === "poursuite") return { animationDelay: `${(-(i / N) * 2.6).toFixed(2)}s` };
  if (effKey === "scintille") return { animationDelay: `${((i * 0.41) % 1.9).toFixed(2)}s` };
  return {};
}
