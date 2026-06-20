"use client";
import { useState } from "react";
import { CTAButton } from "@/components/ui";
import Select from "@/components/Select";
import { budgetOptions, serviceOptions, sendLead, charcoal } from "@/components/data";

const empty = { nom: "", telephone: "", courriel: "", adresse: "", service: "", budget: "", message: "" };

// Formulaire « Demande de soumission » — 7 champs, incl. groupe radio budget.
// Envoi via sendLead() (Web3Forms) — même endpoint que le hero.
export default function QuoteForm({ compact = false }) {
  const [data, setData] = useState(empty);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const set = (k) => (e) => setData((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!data.nom || !data.telephone || !data.courriel) {
      alert("Veuillez remplir les champs obligatoires : nom, téléphone et courriel.");
      return;
    }
    setStatus("sending");
    const ok = await sendLead({
      subject: "Nouveau lead — Demande de soumission",
      source: "Formulaire de soumission (complet)",
      nom: data.nom,
      telephone: data.telephone,
      courriel: data.courriel,
      adresse: data.adresse,
      service: data.service,
      budget: data.budget,
      message: data.message,
    });
    if (ok) {
      setStatus("sent");
      setData(empty);
      // Suivi conversion Meta Pixel (actif seulement si un Pixel ID est configuré)
      if (typeof window !== "undefined" && window.fbq) window.fbq("track", "Lead");
    } else {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div style={{ background: "#fff", borderRadius: 18, padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
        <h3 style={{ color: charcoal, marginBottom: 8 }}>Demande envoyée</h3>
        <p style={{ margin: "0 auto", color: "#555" }}>
          Merci ! Nous vous rappelons rapidement avec votre estimation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate style={{
      background: "#fff", borderRadius: 18, padding: compact ? 24 : "clamp(24px, 4vw, 40px)",
      boxShadow: "0 18px 50px rgba(11,27,43,0.12)",
    }}>
      <div className="grid-2" style={{ gap: 16, alignItems: "start" }}>
        <div>
          <label htmlFor="qf-nom">Nom complet *</label>
          <input id="qf-nom" type="text" autoComplete="name" value={data.nom} onChange={set("nom")} placeholder="Votre nom" required />
        </div>
        <div>
          <label htmlFor="qf-tel">Téléphone *</label>
          <input id="qf-tel" type="tel" autoComplete="tel" value={data.telephone} onChange={set("telephone")} placeholder="(514) 000-0000" required />
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16, alignItems: "start", marginTop: 16 }}>
        <div>
          <label htmlFor="qf-mail">Courriel *</label>
          <input id="qf-mail" type="email" autoComplete="email" value={data.courriel} onChange={set("courriel")} placeholder="vous@exemple.com" required />
        </div>
        <div>
          <label htmlFor="qf-adr">Adresse / ville</label>
          <input id="qf-adr" type="text" autoComplete="address-level2" value={data.adresse} onChange={set("adresse")} placeholder="Ville" />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="qf-service">Service souhaité</label>
        <Select
          id="qf-service"
          value={data.service}
          onChange={(v) => setData((p) => ({ ...p, service: v }))}
          options={serviceOptions}
          placeholder="Sélectionnez…"
        />
      </div>

      <fieldset style={{ marginTop: 18, border: "none", padding: 0 }}>
        <legend style={{
          fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
          textTransform: "uppercase", marginBottom: 10, color: charcoal,
        }}>
          Budget approximatif
        </legend>
        <div className="radio-row">
          {budgetOptions.map((b) => (
            <label key={b} className={`radio-chip${data.budget === b ? " selected" : ""}`}>
              <input
                type="radio" name="budget" value={b}
                checked={data.budget === b}
                onChange={set("budget")}
              />
              {b}
            </label>
          ))}
        </div>
      </fieldset>

      <div style={{ marginTop: 18 }}>
        <label htmlFor="qf-msg">Détails du projet</label>
        <textarea id="qf-msg" value={data.message} onChange={set("message")} placeholder="Type de propriété, hauteur, sections à illuminer, échéancier…" />
      </div>

      <div style={{ marginTop: 22 }}>
        <CTAButton type="submit" style={{ width: "100%" }}>
          {status === "sending" ? "Envoi en cours…" : "Envoyer ma demande"}
        </CTAButton>
        {status === "error" && (
          <p style={{ color: "#b00020", fontSize: 14, marginTop: 12 }}>
            Une erreur est survenue. Réessayez ou appelez-nous directement.
          </p>
        )}
        <p style={{ fontSize: 12, color: "#888", marginTop: 12 }}>
          * Champs obligatoires. Aucune obligation — soumission gratuite.
        </p>
      </div>
    </form>
  );
}
