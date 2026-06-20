// Guirlande de Noël réaliste : fil qui drape (caténaire) + grosses ampoules
// rouge / jaune / vert / or qui s'allument en VAGUE de gauche à droite.
// Pur SVG/CSS (pas de JS) — se place en haut d'une section (position: relative).

const W = 1440;
const SPAN = 160;          // distance entre points d'accroche
const HANG = 12;           // hauteur aux accroches
const CTRL = 2 * 54 - HANG; // point de contrôle quadratique → creux ~54
const COLORS = ["#E8473B", "#F3C747", "#37A85A", "#F2C879"]; // rouge, jaune, vert, or

function wireY(x) {
  const i = Math.floor(x / SPAN);
  const x0 = i * SPAN;
  const t = (x - x0) / SPAN;
  return (1 - t) * (1 - t) * HANG + 2 * (1 - t) * t * CTRL + t * t * HANG;
}

// Tracé du fil
let d = `M 0 ${HANG}`;
for (let x0 = 0; x0 < W; x0 += SPAN) {
  d += ` Q ${x0 + SPAN / 2} ${CTRL} ${x0 + SPAN} ${HANG}`;
}

// Ampoules réparties le long du fil
const BULBS = [];
for (let x = 26, i = 0; x < W - 10; x += 38, i++) {
  BULBS.push({ x, y: wireY(x), c: COLORS[i % COLORS.length], i });
}

export default function LightString({ height = 70 }) {
  return (
    <div aria-hidden="true" style={{
      position: "absolute", top: 0, left: 0, right: 0, height,
      overflow: "hidden", pointerEvents: "none", zIndex: 2,
    }}>
      <svg viewBox={`0 0 ${W} 90`} preserveAspectRatio="xMidYMin slice"
        width="100%" height="100%" style={{ display: "block" }}>
        <defs>
          <filter id="lsGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        {/* fil */}
        <path d={d} fill="none" stroke="rgba(20,24,32,0.9)" strokeWidth="2.4" />
        {/* halo flou (derrière) */}
        <g filter="url(#lsGlow)">
          {BULBS.map((b) => (
            <circle key={b.i} className="ls-bulb" cx={b.x} cy={b.y + 13} r="9"
              fill={b.c} style={{ animationDelay: `${(b.i * 0.09).toFixed(2)}s` }} />
          ))}
        </g>
        {/* ampoules nettes */}
        {BULBS.map((b) => (
          <g key={b.i} className="ls-bulb" style={{ animationDelay: `${(b.i * 0.09).toFixed(2)}s` }}>
            <line x1={b.x} y1={b.y} x2={b.x} y2={b.y + 5} stroke="#1b1f27" strokeWidth="2.4" />
            <ellipse cx={b.x} cy={b.y + 13} rx="5.4" ry="7.4" fill={b.c} />
            <ellipse cx={b.x - 1.6} cy={b.y + 10.5} rx="1.5" ry="2.4" fill="rgba(255,255,255,0.65)" />
          </g>
        ))}
      </svg>
    </div>
  );
}
