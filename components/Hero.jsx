"use client";
import { useState } from "react";
import { CTAButton } from "@/components/ui";
import Select from "@/components/Select";
import { sendLead, serviceOptions, navy, ivory, charcoal, company } from "@/components/data";

const empty = { nom: "", telephone: "", courriel: "", ville: "", service: "" };

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
      setStatus("sent");
      setData(empty);
      if (typeof window !== "undefined" && window.fbq) window.fbq("track", "Lead");
    } else {
      setStatus("error");
    }
  };

  return (
    <section style={{
      position: "relative", padding: 0, minHeight: "92vh",
      display: "flex", alignItems: "center", background: navy,
    }}>
      {/* TODO PHOTO : hero-accueil.jpg — voir PHOTOS-NEEDED.md */}
      <img
        src="/images/hero-accueil.jpg"
        alt="Maison résidentielle illuminée de lumières de Noël la nuit"
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
            Leader au Québec — installation clé en main
          </div>
          <h1 style={{ color: ivory }}>
            Des Fêtes éclatantes,<br />sans monter dans l'échelle
          </h1>
          {/* DRAFT COPY — reconstruite dans la voix de marque */}
          <p style={{ color: "rgba(243,233,210,0.88)", fontSize: 20, margin: "22px 0 30px", maxWidth: 520 }}>
            Conception, installation, entretien et retrait de vos lumières de Noël et de votre
            éclairage architectural. On s'occupe de tout — résidentiel, commercial et municipal.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 28 }}>
            <CTAButton href="/soumission" variant="gold">Soumission gratuite</CTAButton>
            <CTAButton href={company.phoneHref || "#soumission"} variant="outlineLight">{company.phoneHref ? `Appeler ${company.phoneDisplay}` : "Demander une soumission"}</CTAButton>
          </div>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "10px 22px",
            color: "rgba(243,233,210,0.85)", fontSize: 14, fontWeight: 600,
          }}>
            {["Installation + retrait inclus", "Matériel professionnel fourni", "Soumission gratuite, sans obligation"].map((t) => (
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
          {status === "sent" ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 38 }}>✓</div>
              <h3 style={{ color: charcoal, margin: "8px 0" }}>Merci !</h3>
              <p style={{ color: "#555", margin: "0 auto" }}>On vous rappelle très bientôt.</p>
            </div>
          ) : (
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
              <div style={{ marginTop: 18 }}>
                <CTAButton type="submit" style={{ width: "100%" }}>
                  {status === "sending" ? "Envoi…" : "Réserver maintenant"}
                </CTAButton>
              </div>
              {status === "error" && (
                <p style={{ color: "#b00020", fontSize: 13, marginTop: 10 }}>
                  Erreur d'envoi. Réessayez ou écrivez-nous à {company.email}.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
