"use client";
import { useState } from "react";
import { CTAButton } from "@/components/ui";
import Select from "@/components/Select";
import { budgetOptions, serviceOptions, sendLead, charcoal, HONEYPOT_FIELD } from "@/components/data";
import { ChampAttribution, CaseConsentement, NoteSoumission } from "@/components/ConsentementAttribution";

const empty = { nom: "", telephone: "", courriel: "", adresse: "", service: "", budget: "", message: "", attribution: "", consent: false, [HONEYPOT_FIELD]: "" };

// Formulaire « Demande de soumission » — 7 champs, incl. groupe radio budget.
// Envoi via sendLead() (Web3Forms) — même endpoint que le hero.
export default function QuoteForm({ compact = false, source = "Formulaire de soumission (complet)", extraPayload = null, redirectSrc = "quote" }) {
  const [data, setData] = useState(empty);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [erreurConsent, setErreurConsent] = useState(false);

  const set = (k) => (e) => setData((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    // SEO P0 §3.7 — le courriel n'est plus obligatoire : il coupait les
    // visiteurs qui n'ont que leur téléphone, et le rappel se fait par
    // téléphone de toute façon.
    if (!data.nom || !data.telephone) {
      alert("Veuillez remplir les champs obligatoires : nom et téléphone.");
      return;
    }
    if (!data.consent) { setErreurConsent(true); return; }
    setErreurConsent(false);
    setStatus("sending");
    const ok = await sendLead({
      subject: "Nouveau lead — Demande de soumission",
      source: `${source}${data.attribution ? ` · ${data.attribution}` : ""}`,
      consentement: `accordé le ${new Date().toISOString().slice(0, 10)} via ${source}`,
      nom: data.nom,
      telephone: data.telephone,
      courriel: data.courriel,
      adresse: data.adresse,
      service: data.service,
      budget: data.budget,
      message: data.message,
      [HONEYPOT_FIELD]: data[HONEYPOT_FIELD],
      ...(extraPayload || {}),
    });
    if (ok) {
      if (typeof window !== "undefined" && window.fbq) window.fbq("track", "Lead");
      window.location.assign(`/merci?src=${encodeURIComponent(redirectSrc)}`);
      return;
    }
    setStatus("error");
  };

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
          <label htmlFor="qf-mail">Courriel</label>
          <input id="qf-mail" type="email" autoComplete="email" value={data.courriel} onChange={set("courriel")} placeholder="vous@exemple.com" />
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

      {/* Honeypot anti-bot — invisible, hors du flux de tabulation */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor={`qf-${HONEYPOT_FIELD}`}>Ne pas remplir</label>
        <input id={`qf-${HONEYPOT_FIELD}`} type="text" tabIndex={-1} autoComplete="off" value={data[HONEYPOT_FIELD]} onChange={set(HONEYPOT_FIELD)} />
      </div>

      <div style={{ marginTop: 22 }}>
        <ChampAttribution id="qf-attribution" value={data.attribution}
          onChange={(v) => setData((p) => ({ ...p, attribution: v }))} />
        <CaseConsentement id="qf-consent" checked={data.consent}
          onChange={(v) => setData((p) => ({ ...p, consent: v }))}
          erreur={erreurConsent ? "Votre consentement est requis pour vous répondre." : ""} />
        <div style={{ marginTop: 16 }}>
          <CTAButton type="submit" style={{ width: "100%" }}>
            {status === "sending" ? "Envoi en cours…" : "Réserver ma date"}
          </CTAButton>
          <NoteSoumission />
        </div>
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
