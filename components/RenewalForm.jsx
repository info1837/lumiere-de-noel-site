"use client";
import { useState } from "react";
import { CTAButton } from "@/components/ui";
import { sendLead, HONEYPOT_FIELD } from "@/components/data";
import { CaseConsentement } from "@/components/ConsentementAttribution";
import AdresseAutocomplete from "@/components/AdresseAutocomplete";
import { villeDeAdresse } from "@/lib/adresse";
import { newLeadEventId, metaPixelBlock, trackLead, laisserPartir, merciUrl } from "@/lib/meta-lead-event";
import { trackQuoteConversion } from "@/lib/google-ads";

// Formulaire dédié aux clients de l'an dernier — plus court que QuoteForm :
// pas de choix de service (on sait déjà ce qu'ils avaient), pas de budget
// (on part de leur prix précédent). Case pré-cochée "Je suis déjà client"
// pour qu'ils confirment d'un clic.
const empty = {
  nom: "",
  telephone: "",
  courriel: "",
  adresse: "",
  ville: "",
  message: "",
  existingClient: true,
  consent: false,
  [HONEYPOT_FIELD]: "",
};

export default function RenewalForm() {
  const [data, setData] = useState(empty);
  const [status, setStatus] = useState("idle");
  const [erreurChamps, setErreurChamps] = useState(false);
  const [erreurConsent, setErreurConsent] = useState(false);

  const set = (k) => (e) => setData((p) => ({ ...p, [k]: e.target.value }));
  const setBool = (k) => (e) => setData((p) => ({ ...p, [k]: e.target.checked }));

  const submit = async (e) => {
    e.preventDefault();
    // ⚠️ L'ADRESSE EST OBLIGATOIRE (2026-10-14). Elle était facultative :
    // la fiche de reconduction arrivait sans adresse, et Sophie devait la
    // redemander à un client qui nous l'avait donnée l'an dernier.
    if (!data.nom || !data.telephone || !data.courriel || !/\d/.test(data.adresse)) { setErreurChamps(true); return; }
    setErreurChamps(false);
    // ⚠️ LA CASE LOI 25 MANQUAIT ICI (trouvé à la partie 3). C'était le seul
    // formulaire du site qui créait une fiche sans consentement — donc sans
    // trace qui autorise les SMS de Sophie B. Même case, même trace datée
    // que les autres formulaires ; décochée, obligatoire.
    if (!data.consent) { setErreurConsent(true); return; }
    setErreurConsent(false);
    setStatus("sending");
    // UN event_id par soumission — pixel et CRM portent le meme, Meta
    // deduplique le jumeau serveur (API Conversions).
    const eventId = newLeadEventId();
    const ok = await sendLead({
      meta_pixel: metaPixelBlock(eventId),
      subject: "Nouveau lead — Renouvellement (client existant)",
      source: "Formulaire /renouvellement",
      consentement: `accordé le ${new Date().toISOString().slice(0, 10)} via Formulaire /renouvellement`,
      nom: data.nom,
      telephone: data.telephone,
      courriel: data.courriel,
      adresse: data.adresse.trim(),
      ville: data.ville || villeDeAdresse(data.adresse),
      message: data.message,
      existingClient: data.existingClient ? "oui" : "non",
      [HONEYPOT_FIELD]: data[HONEYPOT_FIELD],
    });
    if (ok) {
      // Lead AVEC son eventID. Sans lui, aucune deduplication : le
      // navigateur et le serveur comptent deux conversions.
      // On ATTEND que le pixel soit pret ET que sa requete parte : une
      // redirection immediate la coupait, et aucun Lead n'etait compte.
      // Google Ads « Request quote » en même temps que le Lead Meta, et on
      // attend les deux avant de quitter la page (lib/google-ads.js).
      const conversion = trackQuoteConversion({ email: data.courriel, phone: data.telephone, transactionId: eventId, honeypot: data[HONEYPOT_FIELD] });
      await trackLead(eventId);
      await conversion;
      await laisserPartir();
      window.location.assign(`${merciUrl("", eventId)}${eventId ? "&" : "?"}src=renouvellement`);
      return;
    }
    setStatus("error");
  };

  return (
    <form onSubmit={submit} noValidate data-barre-masque className="formulaire formulaire--sombre"
      style={{ padding: "clamp(24px, 4vw, 40px)" }}>
      <h2 className="formulaire__titre">Reconduire mon installation</h2>
      <p className="formulaire__sous-titre">On vous rappelle avec votre prix de reconduction.</p>

      <div className="grid-2" style={{ gap: 16, alignItems: "start" }}>
        <div>
          <label htmlFor="rf-nom">Nom *</label>
          <input id="rf-nom" type="text" autoComplete="name" value={data.nom} onChange={set("nom")} placeholder="Votre nom" required aria-required="true" />
        </div>
        <div>
          <label htmlFor="rf-tel">Téléphone *</label>
          <input id="rf-tel" type="tel" autoComplete="tel" value={data.telephone} onChange={set("telephone")} placeholder="(514) 000-0000" required aria-required="true" />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="rf-mail">Courriel *</label>
        <input id="rf-mail" type="email" autoComplete="email" value={data.courriel} onChange={set("courriel")} placeholder="vous@exemple.com" required aria-required="true" />
      </div>

      {/* Les deux champs propres au renouvellement — utiles, gardés. */}
      <div style={{ marginTop: 16 }}>
        <label htmlFor="rf-adr">Adresse de l&apos;an passé *</label>
        <AdresseAutocomplete
          id="rf-adr"
          valeur={data.adresse}
          onChange={(v) => setData((p) => ({ ...p, adresse: v, ville: "" }))}
          onChoisir={(d) => setData((p) => ({ ...p, ville: d.ville || p.ville }))}
          placeholder="123 rue Principale, Blainville"
          requis
          invalide={erreurChamps && !/\d/.test(data.adresse)}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="rf-msg">Changements souhaités <span className="facultatif">(facultatif)</span></label>
        <textarea id="rf-msg" value={data.message} onChange={set("message")} placeholder="Sections à ajouter ou retirer, couleurs, effets…" />
      </div>

      <label className="formulaire__case-client">
        <input type="checkbox" checked={data.existingClient} onChange={setBool("existingClient")} />
        Je suis déjà client — c&apos;est une reconduction
      </label>

      {/* Honeypot anti-bot */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor={`rf-${HONEYPOT_FIELD}`}>Ne pas remplir</label>
        <input id={`rf-${HONEYPOT_FIELD}`} type="text" tabIndex={-1} autoComplete="off" value={data[HONEYPOT_FIELD]} onChange={set(HONEYPOT_FIELD)} />
      </div>

      <CaseConsentement id="rf-consent" checked={data.consent}
        onChange={(v) => setData((p) => ({ ...p, consent: v }))}
        erreur={erreurConsent ? "Votre consentement est requis pour vous répondre." : ""} />

      <div style={{ marginTop: 20 }}>
        {erreurChamps && (
          <p role="alert" className="formulaire__erreur">
            Il nous faut votre nom, votre téléphone, votre courriel et l&apos;adresse de l&apos;an passé.
          </p>
        )}
        <CTAButton type="submit" variant="creme" style={{ width: "100%" }}>
          {status === "sending" ? "Envoi en cours…" : "Réserver ma date"}
        </CTAButton>
        {status === "error" && (
          <p role="alert" className="formulaire__erreur">
            Une erreur est survenue. Réessayez ou appelez-nous directement.
          </p>
        )}
        <p className="formulaire__petit">* Champs obligatoires. Aucune obligation.</p>
      </div>
    </form>
  );
}
