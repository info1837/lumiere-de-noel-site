"use client";
import { useState } from "react";
import { CTAButton } from "@/components/ui";
import Select from "@/components/Select";
import { sendLead, serviceOptions, navy, ivory, charcoal, company, HONEYPOT_FIELD } from "@/components/data";
import { PHOTOS } from "@/components/photos";

const empty = { nom: "", telephone: "", courriel: "", ville: "", service: "", [HONEYPOT_FIELD]: "" };

// Hero d'accueil : image plein écran + voile + carte de réservation rapide (5 champs).
export default function Hero() {
  const [data, setData] = useState(empty);
  const [status, setStatus] = useState("idle");

  const set = (k) => (e) => setData((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!data.nom || !data.telephone) {
      alert("Veuillez indiquer au moins votre nom et votre téléphone.");
      return;
    }
    setStatus("sending");
    const ok = await sendLead({
      subject: "Nouveau lead — Réservation rapide (hero)",
      source: "Formulaire hero (réservation rapide)",
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
    <section style={{
      position: "relative", padding: 0, minHeight: "92vh",
      display: "flex", alignItems: "center", background: navy,
    }}>
      <img
        src={PHOTOS["arbre-enrubanne"].src}
        alt={PHOTOS["arbre-enrubanne"].alt}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg, rgba(5,10,20,0.88) 0%, rgba(5,10,20,0.62) 55%, rgba(5,10,20,0.30) 100%)" }} />

      <div className="container hero-grid" style={{
        position: "relative", padding: "120px 24px 80px", width: "100%",
      }}>
        <div>
          <div style={{
            fontSize: 13, fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "#E9DCC0", marginBottom: 18,
          }}>
            Installation clé en main — pose, entretien et retrait inclus
          </div>
          <h1 style={{ color: ivory }}>
            Des Fêtes éclatantes,<br />sans monter dans l'échelle
          </h1>
          {/* DRAFT COPY — reconstruite dans la voix de marque */}
          <p style={{ color: "rgba(243,233,210,0.88)", fontSize: 20, margin: "22px 0 30px", maxWidth: 520 }}>
            Conception, installation, entretien et retrait de vos lumières de Noël et de votre
            éclairage architectural. On s'occupe de tout — résidentiel, commercial et municipal.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
            <CTAButton href="/soumission" variant="gold">Soumission gratuite</CTAButton>
            <CTAButton href={company.phoneHref} variant="outlineLight">Appeler {company.phoneDisplay}</CTAButton>
          </div>
          {/* Ligne datée — donne le QUAND dans les 3 premières secondes */}
          <p style={{
            color: "rgba(243,233,210,0.78)", fontSize: 14, lineHeight: 1.55,
            margin: "0 0 26px", maxWidth: 560, fontWeight: 500,
          }}>
            Installations octobre–novembre 2026 · retrait et entreposage en janvier
            · <strong style={{ color: "#E9DCC0", fontWeight: 700 }}>les dates de novembre partent en premier</strong>.
          </p>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "10px 22px",
            color: "rgba(243,233,210,0.85)", fontSize: 14, fontWeight: 600,
          }}>
            {[
              "Installation + retrait inclus",
              "Matériel professionnel fourni",
              "On garde vos lumières chez nous — rien à ranger",
              "Soumission gratuite, sans obligation",
            ].map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <span className="bulb bulb--tw" aria-hidden="true" />{t}
              </span>
            ))}
          </div>
        </div>

        {/* Carte de réservation rapide */}
        <div style={{
          background: "#fff", borderRadius: 18, padding: "clamp(22px, 3vw, 32px)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        }}>
          {(
            <form onSubmit={submit} noValidate>
              <h3 style={{ color: charcoal, marginBottom: 4 }}>Réservez votre date</h3>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 18 }}>
                Réponse rapide — soumission gratuite et sans obligation.
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label htmlFor="h-nom">Nom *</label>
                  <input id="h-nom" type="text" autoComplete="name" value={data.nom} onChange={set("nom")} placeholder="Votre nom" required />
                </div>
                <div>
                  <label htmlFor="h-tel">Téléphone *</label>
                  <input id="h-tel" type="tel" autoComplete="tel" value={data.telephone} onChange={set("telephone")} placeholder="(514) 000-0000" required />
                </div>
                <div>
                  <label htmlFor="h-mail">Courriel</label>
                  <input id="h-mail" type="email" autoComplete="email" value={data.courriel} onChange={set("courriel")} placeholder="vous@exemple.com" />
                </div>
                <div>
                  <label htmlFor="h-ville">Ville</label>
                  <input id="h-ville" type="text" value={data.ville} onChange={set("ville")} placeholder="Votre ville" />
                </div>
                <div>
                  <label htmlFor="h-service">Service</label>
                  <Select
                    id="h-service"
                    value={data.service}
                    onChange={(v) => setData((p) => ({ ...p, service: v }))}
                    options={serviceOptions}
                    placeholder="Sélectionnez…"
                  />
                </div>
              </div>
              {/* Honeypot anti-bot — invisible et hors du flux de tabulation */}
              <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
                <label htmlFor={`h-${HONEYPOT_FIELD}`}>Ne pas remplir</label>
                <input id={`h-${HONEYPOT_FIELD}`} type="text" tabIndex={-1} autoComplete="off" value={data[HONEYPOT_FIELD]} onChange={set(HONEYPOT_FIELD)} />
              </div>
              <div style={{ marginTop: 18 }}>
                <CTAButton type="submit" style={{ width: "100%" }}>
                  {status === "sending" ? "Envoi…" : "Réserver ma date"}
                </CTAButton>
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
