"use client";
import { useState } from "react";
import { CTAButton } from "@/components/ui";
import Select from "@/components/Select";
import { sendLead, serviceOptions, navy, ivory, charcoal, company, HONEYPOT_FIELD } from "@/components/data";
import { ChampAttribution, CaseConsentement, NoteSoumission, VILLES_DESSERVIES } from "@/components/ConsentementAttribution";
import { PHOTOS } from "@/components/photos";

const empty = { nom: "", telephone: "", ville: "", service: "", attribution: "", consent: false, [HONEYPOT_FIELD]: "" };

// Hero d'accueil : image plein écran + voile + carte de réservation rapide (5 champs).
export default function Hero() {
  const [data, setData] = useState(empty);
  const [status, setStatus] = useState("idle");
  const [erreurConsent, setErreurConsent] = useState(false);

  const set = (k) => (e) => setData((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!data.nom || !data.telephone || !data.ville || !data.service) {
      alert("Veuillez remplir les champs obligatoires : nom, téléphone, ville et service.");
      return;
    }
    if (!data.consent) { setErreurConsent(true); return; }
    setErreurConsent(false);
    setStatus("sending");
    const ok = await sendLead({
      subject: "Nouveau lead — Réservation rapide (hero)",
      // L'attribution voyage dans la source : le CRM la lit sans schéma neuf.
      source: `Formulaire hero (réservation rapide)${data.attribution ? ` · ${data.attribution}` : ""}`,
      // Trace du consentement (Loi 25 / LCAP), horodatée.
      consentement: `accordé le ${new Date().toISOString().slice(0, 10)} via le formulaire du hero`,
      ...data,
    });
    if (ok) {
      if (typeof window !== "undefined" && window.fbq) window.fbq("track", "Lead");
      // Redirection vers /merci — page dédiée mesurable en conversion et
      // qui donne au client une promesse claire ("Réponse en moins de 24 h").
      window.location.assign("/merci?src=hero");
      return;
    }
    setStatus("error");
  };

  return (
    // Refonte hero (motif ZS Exteriors) — le texte tient sur du navy
    // franc à gauche, la carte de réservation reste au-dessus de la ligne
    // de flottaison, et rien n'est centré verticalement : le contenu part
    // sous l'entête et descend. Le centrage était ce qui faisait glisser
    // l'eyebrow sous l'entête dès que la fenêtre raccourcissait.
    <section className="hero-section" style={{ position: "relative", background: navy }}>
      <img
        src={PHOTOS["arbre-enrubanne"].src}
        alt={PHOTOS["arbre-enrubanne"].alt}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(11,27,43,0.88) 0%, rgba(11,27,43,0.72) 42%, rgba(11,27,43,0.25) 100%)" }} />

      <div className="hero-container hero-grid" style={{ position: "relative", width: "100%" }}>
        <div>
          <div className="hero-eyebrow" style={{
            fontSize: 12, fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "#E9DCC0", marginBottom: 20,
          }}>
            Installation clé en main — pose, entretien et retrait inclus
          </div>
          <h1 className="hero-h1" style={{ color: ivory }}>
            Des Fêtes éclatantes,<br />sans monter dans l'échelle
          </h1>
          {/* DRAFT COPY — reconstruite dans la voix de marque */}
          <p style={{ color: "rgba(243,233,210,0.85)", fontSize: 18, lineHeight: 1.5, margin: "20px 0 28px", maxWidth: "52ch" }}>
            Conception, installation, entretien et retrait de vos lumières de Noël et de votre
            éclairage architectural. On s'occupe de tout — résidentiel et commercial.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
            <CTAButton href="/soumission" variant="gold">Soumission gratuite</CTAButton>
            <CTAButton href={company.phoneHref} variant="outlineLight">Appeler {company.phoneDisplay}</CTAButton>
          </div>
          {/* Ligne datée — donne le QUAND dans les 3 premières secondes */}
          <p style={{
            color: "rgba(243,233,210,0.78)", fontSize: 14, lineHeight: 1.55,
            margin: "0 0 18px", maxWidth: 560, fontWeight: 500,
          }}>
            Installations octobre–novembre 2026 · retrait et entreposage en janvier
            · <strong style={{ color: "#E9DCC0", fontWeight: 700 }}>les dates de novembre partent en premier</strong>.
          </p>
          {/* Le territoire, en une ligne : trois mots qui répondent au
              « est-ce que vous venez chez moi ? » avant le formulaire. */}
          <div style={{
            fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "#E9DCC0", fontWeight: 600,
          }}>
            Rive-Nord · Montréal · Rive-Sud
          </div>
          {/* Les quatre puces qui vivaient ici disaient exactement ce que dit
              maintenant la barre des objections, juste en dessous : « tout
              inclus », l'entreposage, la soumission gratuite. Les garder, c'est
              faire lire deux fois la même chose au visiteur et repousser le
              formulaire vers le bas. La barre le dit mieux : chaque réponse y
              est cliquable et mène à la page qui la détaille.
              Le matériel professionnel fourni, seul point qui n'était PAS
              repris, est rappelé dans la carte « Tout inclus » côté services. */}
        </div>

        {/* Carte de réservation rapide */}
        <div className="hero-card" style={{
          background: "rgba(255,255,255,0.96)", borderRadius: 16, padding: 24,
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)", alignSelf: "start",
        }}>
          {(
            <form onSubmit={submit} noValidate>
              <h3 style={{ color: charcoal, marginBottom: 2, fontSize: 24 }}>Réservez votre date</h3>
              <p style={{ fontSize: 13, color: "#666", marginBottom: 14 }}>
                Réponse rapide — soumission gratuite et sans obligation.
              </p>
              <div className="hero-form-grid">
                <div className="hero-field">
                  <label htmlFor="h-nom">Nom *</label>
                  <input id="h-nom" type="text" autoComplete="name" value={data.nom} onChange={set("nom")} placeholder="Votre nom" required />
                </div>
                <div className="hero-field">
                  <label htmlFor="h-tel">Téléphone *</label>
                  <input id="h-tel" type="tel" autoComplete="tel" value={data.telephone} onChange={set("telephone")} placeholder="(514) 000-0000" required />
                </div>
                {/* SEO P0 §5.3 — le courriel quitte le hero (il vit sur
                    /soumission) et la ville devient un choix : une ville
                    tapée à la main arrive au CRM en dix orthographes. */}
                <div className="hero-field">
                  <label htmlFor="h-ville">Ville *</label>
                  <Select id="h-ville" value={data.ville}
                    onChange={(v) => setData((p) => ({ ...p, ville: v }))}
                    options={VILLES_DESSERVIES} placeholder="Choisir…" />
                </div>
                <div className="hero-field">
                  <label htmlFor="h-service">Service</label>
                  <Select
                    id="h-service"
                    value={data.service}
                    onChange={(v) => setData((p) => ({ ...p, service: v }))}
                    options={serviceOptions}
                    placeholder="Sélectionnez…"
                  />
                </div>
                <div className="hero-field-full">
                  <ChampAttribution id="h-attribution" value={data.attribution}
                    onChange={(v) => setData((p) => ({ ...p, attribution: v }))} />
                </div>
              </div>
              <CaseConsentement id="h-consent" checked={data.consent}
                onChange={(v) => setData((p) => ({ ...p, consent: v }))}
                erreur={erreurConsent ? "Votre consentement est requis pour vous répondre." : ""} />
              {/* Honeypot anti-bot — invisible et hors du flux de tabulation */}
              <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
                <label htmlFor={`h-${HONEYPOT_FIELD}`}>Ne pas remplir</label>
                <input id={`h-${HONEYPOT_FIELD}`} type="text" tabIndex={-1} autoComplete="off" value={data[HONEYPOT_FIELD]} onChange={set(HONEYPOT_FIELD)} />
              </div>
              <div style={{ marginTop: 14 }}>
                <CTAButton type="submit" style={{ width: "100%", height: 48 }}>
                  {status === "sending" ? "Envoi…" : "Réserver ma date"}
                </CTAButton>
                <NoteSoumission />
              </div>
              {status === "error" && (
                <p style={{ color: "#b00020", fontSize: 13, marginTop: 10 }}>
                  Erreur d'envoi. Appelez-nous au {company.phoneDisplay}.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
