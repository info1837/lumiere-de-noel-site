"use client";
import { useState } from "react";
import { CTAButton } from "@/components/ui";
import Select from "@/components/Select";
import { budgetOptions, serviceOptions, sendLead, charcoal, HONEYPOT_FIELD } from "@/components/data";
import { ChampAttribution, CaseConsentement, NoteSoumission } from "@/components/ConsentementAttribution";
import { newLeadEventId, metaPixelBlock, trackLead, laisserPartir, merciUrl } from "@/lib/meta-lead-event";

const empty = { nom: "", telephone: "", courriel: "", adresse: "", service: "", budget: "", message: "", attribution: "", consent: false, [HONEYPOT_FIELD]: "" };

// Formulaire « Demande de soumission » — 7 champs, incl. groupe radio budget.
// Envoi via sendLead() (Web3Forms) — même endpoint que le hero.
export default function QuoteForm({ compact = false, source = "Formulaire de soumission (complet)", extraPayload = null, redirectSrc = "quote", serviceInitial = null, prerempli = null }) {
  // ⚠️ Le service PRÉSÉLECTIONNÉ, rien d'autre.
  //
  // Un gestionnaire d'immeuble qui clique « Demander notre preuve
  // d'assurance » depuis la page commerciale ne devrait pas avoir à
  // rechoisir « commercial » dans une liste — il vient de le dire en
  // cliquant. Les champs, le consentement et l'envoi ne changent pas :
  // c'est la MÊME valeur que le menu déroulant propose, posée d'avance.
  //
  // ⚠️ `prerempli` : LE MÊME PRINCIPE, APPLIQUÉ AU SIMULATEUR.
  //
  // Quelqu'un qui arrive de /simulateur vient d'écrire son adresse, son
  // prénom et son numéro pour débloquer son image. Le renvoyer vers un
  // formulaire vide le ferait tout retaper — et c'est le clic le plus
  // précieux de la page, celui qui suit « Réserver ma date » juste après
  // avoir vu sa maison illuminée.
  //
  // ⚠️ LE CONSENTEMENT N'EST JAMAIS PRÉREMPLI. Il reste décoché, même si
  // la personne l'a donné au simulateur : une case cochée d'avance n'est
  // pas un consentement au sens de la Loi 25. Les champs seulement.
  const [data, setData] = useState({
    ...empty,
    ...(serviceInitial ? { service: serviceInitial } : null),
    ...(prerempli ? {
      nom: prerempli.nom || "",
      telephone: prerempli.telephone || "",
      adresse: prerempli.adresse || "",
      message: prerempli.message || "",
    } : null),
  });
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
    // UN event_id par soumission — pixel et CRM portent le meme, Meta
    // deduplique le jumeau serveur (API Conversions).
    const eventId = newLeadEventId();
    const ok = await sendLead({
      meta_pixel: metaPixelBlock(eventId),
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
      // Lead AVEC son eventID. Sans lui, aucune deduplication : le
      // navigateur et le serveur comptent deux conversions.
      // On ATTEND que le pixel soit pret ET que sa requete parte : une
      // redirection immediate la coupait, et aucun Lead n'etait compte.
      await trackLead(eventId);
      await laisserPartir();
      window.location.assign(`${merciUrl("", eventId)}${eventId ? "&" : "?"}src=${encodeURIComponent(redirectSrc)}`);
      return;
    }
    setStatus("error");
  };

  return (
    <form onSubmit={submit} noValidate data-barre-masque style={{
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
        {/* ⚠️ LE SEUL endroit du site où « gratuit » et « sans obligation »
            ont encore le droit d'exister, et c'est délibéré.

            Dans un titre ou sur un bouton, ces mots vendent le prix : ils
            disent « ça ne vous engage à rien », donc « ce n'est pas grave
            si vous ne venez pas ». Ici, en petit, sous le bouton, ils font
            l'inverse — ils enlèvent la dernière hésitation de quelqu'un qui
            a DÉJÀ décidé de remplir le formulaire. */}
        {/* #888 à 12 px : 3,54:1, sous le AA. #6A6A6A donne 5,41:1. */}
        <p style={{ fontSize: 12, color: "#6A6A6A", marginTop: 12 }}>
          * Champs obligatoires. La consultation est gratuite et sans obligation.
        </p>
      </div>
    </form>
  );
}
