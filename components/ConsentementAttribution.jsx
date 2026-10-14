"use client";

// SEO P0 §5.3 — la case que TOUS les formulaires du site doivent
// porter, extraits ici pour qu'ils ne divergent pas d'un formulaire à l'autre.
//
// Le consentement n'est pas décoratif : Sophie B envoie des SMS aux leads,
// et ni la Loi 25 ni la LCAP ne se contentent d'un formulaire soumis. La case
// est décochée par défaut — une case pré-cochée n'est pas un consentement.

export function CaseConsentement({ id = "consent", checked, onChange, erreur }) {
  return (
    <div style={{ marginTop: 14 }}>
      <label htmlFor={id} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.55, cursor: "pointer", fontWeight: 400 }}>
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
          style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: "#E9DCC0" }} />
        <span>
          J&apos;accepte de recevoir des messages texte et des courriels de Solution Lumière de Noël
          au sujet de ma demande. Mes informations sont traitées selon la{" "}
          <a href="/confidentialite" style={{ textDecoration: "underline" }}>politique de confidentialité</a>.
        </span>
      </label>
      {erreur && <p style={{ color: "#b00020", fontSize: 13, marginTop: 6 }}>{erreur}</p>}
    </div>
  );
}

export function NoteSoumission() {
  return (
    <p style={{ fontSize: 13, opacity: 0.75, textAlign: "center", marginTop: 10, marginBottom: 0 }}>
      Nous confirmons votre place et votre prix après un court appel
    </p>
  );
}
