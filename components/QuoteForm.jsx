"use client";
import { useState } from "react";
import { CTAButton } from "@/components/ui";
import Select from "@/components/Select";
import AdresseAutocomplete from "@/components/AdresseAutocomplete";
import { serviceOptions, sendLead, HONEYPOT_FIELD } from "@/components/data";
import { CaseConsentement, NoteSoumission } from "@/components/ConsentementAttribution";
import { villeDeAdresse } from "@/lib/adresse";
import { newLeadEventId, metaPixelBlock, trackLead, laisserPartir, merciUrl } from "@/lib/meta-lead-event";
import { trackQuoteConversion } from "@/lib/google-ads";

const empty = { nom: "", telephone: "", adresse: "", ville: "", courriel: "", service: "", message: "", consent: false, [HONEYPOT_FIELD]: "" };

// ⚠️ L'ADRESSE, PAS LA VILLE (2026-10-14).
//
// Le formulaire demandait « Ville ». Sophie B devait donc redemander
// l'adresse par texto — une question de plus, à quelqu'un qui venait de
// remplir un formulaire. Le champ est maintenant « Adresse de la propriété »,
// avec l'autocomplétion Places (Québec) : rue, ville et code postal partent
// au CRM dans `address` et `city` — les MÊMES champs que le formulaire Meta —
// et Sophie CONFIRME l'adresse au lieu de la demander.
//
// ⚠️ LE FORMULAIRE COURT, LE MÊME PARTOUT (partie 3, octobre 2026).
//
// Il avait 8 à 11 champs selon la page : budget en pastilles, « comment
// avez-vous entendu parler de nous ? », adresse ET ville… Maintenant :
//   obligatoires  Nom, Téléphone, Adresse de la propriété
//   facultatifs   Courriel, Service, Détails
//   + la case Loi 25, décochée, obligatoire.
// La provenance ne se demande plus : elle voyage déjà dans le paiement
// (lib/utm.js — UTM, page d'arrivée, site référent).
//
// LE CHEMIN DU LEAD NE CHANGE PAS : même route (/api/lead), mêmes noms de
// champs, même event_id partagé par le pixel et le CRM, même redirection.
// Prouvé par `npm run dry-run:lead`, formulaire par formulaire.
//
// `variante="sombre"` : sur le marine des pages intérieures. L'accueil
// garde la variante claire, dans sa section crème.
const adresseValide = (a) => /\d/.test(a || "") && (a || "").trim().length >= 6;

export default function QuoteForm({ compact = false, source = "Formulaire de soumission (complet)", extraPayload = null, redirectSrc = "quote", serviceInitial = null, prerempli = null, variante = "claire" }) {
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
      // L'adresse tapée au simulateur arrive dans le champ, telle quelle.
      adresse: prerempli.adresse || "",
      message: prerempli.message || "",
    } : null),
  });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [erreurConsent, setErreurConsent] = useState(false);
  const [erreurChamps, setErreurChamps] = useState(false);

  const set = (k) => (e) => setData((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    // SEO P0 §3.7 — le courriel n'est plus obligatoire : il coupait les
    // visiteurs qui n'ont que leur téléphone, et le rappel se fait par
    // téléphone de toute façon.
    // Une adresse, c'est au moins un numéro civique : « Blainville » seul
    // ne permet ni de mesurer la toiture, ni à Sophie de confirmer.
    if (!data.nom || !data.telephone || !adresseValide(data.adresse)) {
      setErreurChamps(true);
      return;
    }
    setErreurChamps(false);
    if (!data.consent) { setErreurConsent(true); return; }
    setErreurConsent(false);
    setStatus("sending");
    // UN event_id par soumission — pixel et CRM portent le meme, Meta
    // deduplique le jumeau serveur (API Conversions).
    const eventId = newLeadEventId();
    const ok = await sendLead({
      meta_pixel: metaPixelBlock(eventId),
      subject: "Nouveau lead — Demande de soumission",
      source,
      consentement: `accordé le ${new Date().toISOString().slice(0, 10)} via ${source}`,
      nom: data.nom,
      telephone: data.telephone,
      courriel: data.courriel,
      adresse: data.adresse.trim(),
      // La ville du détail Places quand on l'a ; sinon, tirée du texte
      // (« …, Blainville, QC » → Blainville). Vide plutôt que devinée : le
      // CRM la retrouve alors par géocodage (lib/enrich-city.js).
      ville: data.ville || villeDeAdresse(data.adresse),
      service: data.service,
      message: data.message,
      [HONEYPOT_FIELD]: data[HONEYPOT_FIELD],
      ...(extraPayload || {}),
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
      window.location.assign(`${merciUrl("", eventId)}${eventId ? "&" : "?"}src=${encodeURIComponent(redirectSrc)}`);
      return;
    }
    setStatus("error");
  };

  const sombre = variante === "sombre";
  return (
    <form onSubmit={submit} noValidate data-barre-masque
      className={`formulaire${sombre ? " formulaire--sombre" : ""}`}
      style={{ padding: compact ? 24 : "clamp(24px, 4vw, 40px)" }}>
      <div className="grid-2" style={{ gap: 16, alignItems: "start" }}>
        <div>
          <label htmlFor="qf-nom">Nom *</label>
          <input id="qf-nom" type="text" autoComplete="name" value={data.nom} onChange={set("nom")} placeholder="Votre nom" required aria-required="true" />
        </div>
        <div>
          <label htmlFor="qf-tel">Téléphone *</label>
          <input id="qf-tel" type="tel" autoComplete="tel" value={data.telephone} onChange={set("telephone")} placeholder="(514) 000-0000" required aria-required="true" />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="qf-adresse">Adresse de la propriété *</label>
        <AdresseAutocomplete
          id="qf-adresse"
          valeur={data.adresse}
          // Taper à la main efface la ville du détail : elle appartenait à
          // l'adresse choisie, plus à celle-ci.
          onChange={(v) => setData((p) => ({ ...p, adresse: v, ville: "" }))}
          onChoisir={(d) => setData((p) => ({ ...p, ville: d.ville || p.ville }))}
          placeholder="123 rue Principale, Blainville"
          requis
          invalide={erreurChamps && !adresseValide(data.adresse)}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="qf-mail">Courriel <span className="facultatif">(facultatif)</span></label>
        <input id="qf-mail" type="email" autoComplete="email" value={data.courriel} onChange={set("courriel")} placeholder="vous@exemple.com" />
      </div>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="qf-service">Service <span className="facultatif">(facultatif)</span></label>
        <Select
          id="qf-service"
          value={data.service}
          onChange={(v) => setData((p) => ({ ...p, service: v }))}
          options={serviceOptions}
          placeholder="Sélectionnez…"
        />
        {/* Le permanent n'a ni retrait ni entreposage : celui qui le choisit
            doit pouvoir lire SON produit, pas celui de la saison. */}
        {/permanent/i.test(data.service) && (
          <p className="formulaire__petit" style={{ marginTop: 8 }}>
            Installé une seule fois, allumé toute l&apos;année, garanti 10 ans.{" "}
            <a href="/services/eclairage-architectural-permanent" style={{ textDecoration: "underline" }}>L&apos;éclairage permanent en détail</a>
          </p>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="qf-msg">Détails <span className="facultatif">(facultatif)</span></label>
        <textarea id="qf-msg" value={data.message} onChange={set("message")} placeholder="Type de propriété, hauteur, ce que vous aimeriez illuminer…" />
      </div>

      {/* Honeypot anti-bot — invisible, hors du flux de tabulation */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor={`qf-${HONEYPOT_FIELD}`}>Ne pas remplir</label>
        <input id={`qf-${HONEYPOT_FIELD}`} type="text" tabIndex={-1} autoComplete="off" value={data[HONEYPOT_FIELD]} onChange={set(HONEYPOT_FIELD)} />
      </div>

      <div style={{ marginTop: 20 }}>
        {/* La case Loi 25 : décochée, obligatoire. Jamais préremplie. */}
        <CaseConsentement id="qf-consent" checked={data.consent}
          onChange={(v) => setData((p) => ({ ...p, consent: v }))}
          erreur={erreurConsent ? "Votre consentement est requis pour vous répondre." : ""} />
        {erreurChamps && (
          <p role="alert" className="formulaire__erreur">
            Il nous faut votre nom, votre téléphone et l&apos;adresse de la propriété (numéro et rue).
          </p>
        )}
        <div style={{ marginTop: 16 }}>
          <CTAButton type="submit" variant={sombre ? "creme" : "primary"} style={{ width: "100%" }}>
            {status === "sending" ? "Envoi en cours…" : "Réserver ma date"}
          </CTAButton>
          <NoteSoumission />
        </div>
        {status === "error" && (
          <p role="alert" className="formulaire__erreur">
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
        <p className="formulaire__petit">
          * Champs obligatoires. La consultation est gratuite et sans obligation.
        </p>
      </div>
    </form>
  );
}
