import Hero from "@/components/Hero";
import QuoteForm from "@/components/QuoteForm";
import { CTAButton, SectionTag, SectionTitle, FaqAccordion } from "@/components/ui";
import {
  serviceCards, whyUs, faqHome, serviceArea, company,
  navy, offWhite, ivory, gold, charcoal, goldText,
} from "@/components/data";

export default function Home() {
  return (
    <>
      {/* SEO : rich results FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqHome.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      <Hero />

      {/* 2 — Proposition de valeur « Leader au Québec » */}
      <section style={{ background: offWhite }}>
        <div className="container grid-2">
          <div>
            <SectionTag>Leader au Québec</SectionTag>
            <SectionTitle>Votre propriété, illuminée — sans le tracas</SectionTitle>
            {/* DRAFT COPY — reconstruite dans la voix de marque */}
            <p style={{ color: "#444", fontSize: 18, marginBottom: 18 }}>
              Des centaines de résidences, commerces et municipalités nous confient leur éclairage
              des Fêtes chaque année. On fournit le matériel professionnel, on l'installe en
              sécurité, on l'entretient pendant la saison et on le retire après les Fêtes.
            </p>
            <p style={{ color: "#444", fontSize: 18, marginBottom: 26 }}>
              Vous, vous profitez du spectacle. Nous, on s'occupe de tout le reste.
            </p>
            <CTAButton href="/soumission">Demander une soumission</CTAButton>
          </div>
          <div style={{ borderRadius: 18, overflow: "hidden", aspectRatio: "4 / 3", background: "#11202f" }}>
            {/* TODO PHOTO : valeur-commercial.jpg */}
            <img src="/images/valeur-commercial.jpg" alt="Bâtiment commercial illuminé pour les Fêtes la nuit"
              loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      </section>

      {/* 3 — Cartes de service */}
      <section className="snowy" style={{ background: navy }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <SectionTag dark>Nos services</SectionTag>
            <SectionTitle light style={{ margin: "0 auto" }}>Pour chaque type de propriété</SectionTitle>
          </div>
          <div className="grid-3">
            {serviceCards.map((s) => (
              <article key={s.key} className="glow-card" style={{ background: "#10202f", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(233,220,192,0.12)" }}>
                <div style={{ aspectRatio: "4 / 3", background: "#0b1b2b" }}>
                  {/* TODO PHOTO : voir PHOTOS-NEEDED.md */}
                  <img src={s.image} alt={s.imageAlt} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: 24 }}>
                  <h3 style={{ color: ivory, marginBottom: 14 }}>{s.title}</h3>
                  <ul style={{ listStyle: "none", marginBottom: 20 }}>
                    {s.bullets.map((b, i) => (
                      <li key={i} style={{ color: "rgba(243,233,210,0.78)", fontSize: 15, marginBottom: 8, display: "flex", gap: 8 }}>
                        <span className="bulb bulb--tw" aria-hidden="true" style={{ marginTop: 5 }} />{b}
                      </li>
                    ))}
                  </ul>
                  <CTAButton href="/soumission" variant="outlineLight" style={{ padding: "13px 24px", fontSize: 13 }}>
                    Soumission
                  </CTAButton>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — Pourquoi nous choisir + FAQ */}
      <section style={{ background: offWhite }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <SectionTag>Pourquoi nous choisir ?</SectionTag>
            <SectionTitle style={{ margin: "0 auto" }}>Un service complet, sans surprise</SectionTitle>
          </div>
          <div className="grid-4" style={{ marginBottom: 64 }}>
            {whyUs.map((w, i) => (
              <div key={i} className="glow-card-light" style={{ background: "#fff", borderRadius: 14, padding: 26, border: "1px solid #ece5d6" }}>
                <div aria-hidden="true" style={{
                  width: 44, height: 44, borderRadius: "50%", marginBottom: 16,
                  background: gold, display: "flex", alignItems: "center", justifyContent: "center",
                  color: charcoal, fontFamily: "'Bebas Neue', sans-serif", fontSize: 20,
                }}>
                  {i + 1}
                </div>
                <h3 style={{ fontSize: 20, marginBottom: 8, color: charcoal }}>{w.title}</h3>
                <p style={{ color: "#555", fontSize: 15 }}>{w.desc}</p>
              </div>
            ))}
          </div>
          <h3 style={{ textAlign: "center", marginBottom: 24, color: charcoal }}>Questions fréquentes</h3>
          <FaqAccordion items={faqHome} />
        </div>
      </section>

      {/* AMÉLIORATION — Zone de service (SEO local) */}
      <section className="snowy" style={{ background: navy, paddingTop: 56, paddingBottom: 56 }}>
        <div className="container" style={{ textAlign: "center" }}>
          <SectionTag dark>Zone de service</SectionTag>
          <SectionTitle light style={{ margin: "0 auto 22px" }}>Du Grand Montréal à l'Estrie</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 14px", maxWidth: 760, margin: "0 auto" }}>
            {serviceArea.map((c) => (
              <span key={c} style={{
                padding: "8px 16px", borderRadius: 300, fontSize: 14,
                border: "1px solid rgba(233,220,192,0.25)", color: "rgba(243,233,210,0.85)",
              }}>
                {c}
              </span>
            ))}
          </div>
          <p style={{ color: "rgba(243,233,210,0.6)", fontSize: 14, margin: "20px auto 0" }}>
            Votre ville n'est pas listée ? Demandez quand même — on dessert un large territoire.
          </p>
        </div>
      </section>

      {/* AMÉLIORATION — Bandeau urgence saisonnière */}
      <section style={{ background: gold, paddingTop: 40, paddingBottom: 40 }}>
        <div className="container" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <div>
            <h3 style={{ color: charcoal, marginBottom: 4 }}>Les agendas se remplissent vite</h3>
            <p style={{ color: "#3a3320", fontSize: 16, margin: 0 }}>
              Réservez tôt pour garantir votre date avant les premières neiges.
            </p>
          </div>
          <CTAButton href="/soumission">Réserver ma date</CTAButton>
        </div>
      </section>

      {/* Tarifs — prix d'entrée réel fourni par le client */}
      <section className="snowy" style={{ background: navy }}>
        <div className="container" style={{ textAlign: "center" }}>
          <SectionTag dark>Tarifs</SectionTag>
          <SectionTitle light style={{ margin: "0 auto 10px" }}>Combien ça coûte ?</SectionTitle>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", color: gold,
            fontSize: "clamp(2.6rem, 7vw, 4.5rem)", lineHeight: 1, margin: "10px 0 6px",
          }}>
            À partir de {company.priceFrom}
          </div>
          <p style={{ color: "rgba(243,233,210,0.75)", fontSize: 16, margin: "0 auto 30px", maxWidth: 540 }}>
            Le prix final dépend de la grandeur de la propriété et du design. Commercial et
            municipal : sur soumission.
          </p>
          <div className="grid-4" style={{ maxWidth: 920, margin: "0 auto 32px" }}>
            {["Conception personnalisée", "Installation par notre équipe",
              "Entretien pendant la saison", "Retrait + entreposage inclus"].map((t) => (
              <div key={t} className="glow-card" style={{
                border: "1px solid rgba(233,220,192,0.22)", borderRadius: 12,
                padding: "18px 14px", color: "rgba(243,233,210,0.9)", fontSize: 14, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <span className="bulb bulb--tw" aria-hidden="true" />{t}
              </div>
            ))}
          </div>
          <CTAButton href="/soumission" variant="gold">Obtenir mon estimation gratuite</CTAButton>
        </div>
      </section>

      {/* 6 — Formulaire « Demande de soumission » */}
      <section id="soumission" style={{ background: offWhite }}>
        <div className="container grid-2" style={{ alignItems: "start" }}>
          <div>
            <SectionTag>Demande de soumission</SectionTag>
            <SectionTitle>Obtenez votre estimation gratuite</SectionTitle>
            <p style={{ color: "#444", fontSize: 18, marginBottom: 20 }}>
              Remplissez le formulaire et nous vous rappelons rapidement avec une estimation claire,
              sans obligation.
            </p>
            <p style={{ color: "#444", fontSize: 16 }}>
              Vous préférez parler à quelqu'un ?{" "}
              <a href="tel:+14388656873" style={{ color: goldText, fontWeight: 700 }}>(438) 865-6873</a>
            </p>
          </div>
          <QuoteForm />
        </div>
      </section>
    </>
  );
}
