"use client";
import { useState } from "react";
import { CTAButton } from "@/components/ui";
import { sendLead, charcoal, HONEYPOT_FIELD } from "@/components/data";

// Formulaire dédié aux clients de l'an dernier — plus court que QuoteForm :
// pas de choix de service (on sait déjà ce qu'ils avaient), pas de budget
// (on part de leur prix précédent). Case pré-cochée "Je suis déjà client"
// pour qu'ils confirment d'un clic.
const empty = {
  nom: "",
  telephone: "",
  courriel: "",
  adresse: "",
  message: "",
  existingClient: true,
  [HONEYPOT_FIELD]: "",
};

export default function RenewalForm() {
  const [data, setData] = useState(empty);
  const [status, setStatus] = useState("idle");

  const set = (k) => (e) => setData((p) => ({ ...p, [k]: e.target.value }));
  const setBool = (k) => (e) => setData((p) => ({ ...p, [k]: e.target.checked }));

  const submit = async (e) => {
    e.preventDefault();
    if (!data.nom || !data.telephone || !data.courriel) {
      alert("Veuillez remplir les champs obligatoires : nom, téléphone et courriel.");
      return;
    }
    setStatus("sending");
    const ok = await sendLead({
      subject: "Nouveau lead — Renouvellement (client existant)",
      source: "Formulaire /renouvellement",
      nom: data.nom,
      telephone: data.telephone,
      courriel: data.courriel,
      adresse: data.adresse,
      message: data.message,
      existingClient: data.existingClient ? "oui" : "non",
      [HONEYPOT_FIELD]: data[HONEYPOT_FIELD],
    });
    if (ok) {
      if (typeof window !== "undefined" && window.fbq) window.fbq("track", "Lead");
      window.location.assign("/merci?src=renouvellement");
      return;
    }
    setStatus("error");
  };

  return (
    <form onSubmit={submit} noValidate style={{
      background: "#fff", borderRadius: 18, padding: "clamp(24px, 4vw, 40px)",
      boxShadow: "0 18px 50px rgba(11,27,43,0.12)",
    }}>
      <h3 style={{ color: charcoal, marginBottom: 6 }}>Reconduire mon installation</h3>
      <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
        On vous rappelle avec votre prix de reconduction.
      </p>

      <div className="grid-2" style={{ gap: 16, alignItems: "start" }}>
        <div>
          <label htmlFor="rf-nom">Nom complet *</label>
          <input id="rf-nom" type="text" autoComplete="name" value={data.nom} onChange={set("nom")} placeholder="Votre nom" required />
        </div>
        <div>
          <label htmlFor="rf-tel">Téléphone *</label>
          <input id="rf-tel" type="tel" autoComplete="tel" value={data.telephone} onChange={set("telephone")} placeholder="(514) 000-0000" required />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="rf-mail">Courriel *</label>
        <input id="rf-mail" type="email" autoComplete="email" value={data.courriel} onChange={set("courriel")} placeholder="vous@exemple.com" required />
      </div>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="rf-adr">Adresse d'installation (de l'an passé)</label>
        <input id="rf-adr" type="text" autoComplete="street-address" value={data.adresse} onChange={set("adresse")} placeholder="Adresse civique + ville" />
      </div>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="rf-msg">Changements souhaités (facultatif)</label>
        <textarea id="rf-msg" value={data.message} onChange={set("message")} placeholder="Sections à ajouter ou retirer, couleurs, effets…" />
      </div>

      <label style={{
        display: "flex", alignItems: "center", gap: 12, marginTop: 20,
        padding: "14px 18px", borderRadius: 10, background: "#faf4e6",
        border: "1px solid #ece5d4", cursor: "pointer",
        fontSize: 15, fontWeight: 600, color: charcoal, textTransform: "none", letterSpacing: 0,
      }}>
        <input
          type="checkbox"
          checked={data.existingClient}
          onChange={setBool("existingClient")}
          style={{ width: 20, height: 20, accentColor: charcoal, margin: 0 }}
        />
        Je suis déjà client — c'est une reconduction
      </label>

      {/* Honeypot anti-bot */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor={`rf-${HONEYPOT_FIELD}`}>Ne pas remplir</label>
        <input id={`rf-${HONEYPOT_FIELD}`} type="text" tabIndex={-1} autoComplete="off" value={data[HONEYPOT_FIELD]} onChange={set(HONEYPOT_FIELD)} />
      </div>

      <div style={{ marginTop: 22 }}>
        <CTAButton type="submit" style={{ width: "100%" }}>
          {status === "sending" ? "Envoi en cours…" : "Réserver ma date"}
        </CTAButton>
        {status === "error" && (
          <p style={{ color: "#b00020", fontSize: 14, marginTop: 12 }}>
            Une erreur est survenue. Réessayez ou appelez-nous directement.
          </p>
        )}
        <p style={{ fontSize: 12, color: "#888", marginTop: 12 }}>
          * Champs obligatoires. Aucune obligation.
        </p>
      </div>
    </form>
  );
}
