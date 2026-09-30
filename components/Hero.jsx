"use client";
import { useState } from "react";
import { CTAButton } from "@/components/ui";
import { dateEnFrancais } from "@/lib/disponibilites";
import Select from "@/components/Select";
import { sendLead, serviceOptions, navy, ivory, charcoal, company, HONEYPOT_FIELD } from "@/components/data";
import { newLeadEventId, metaPixelBlock, trackLead, laisserPartir, merciUrl } from "@/lib/meta-lead-event";
import { ChampAttribution, CaseConsentement, NoteSoumission, VILLES_DESSERVIES } from "@/components/ConsentementAttribution";
import { PHOTOS } from "@/components/photos";

const empty = { nom: "", telephone: "", ville: "", service: "", attribution: "", consent: false, [HONEYPOT_FIELD]: "" };

// Hero d'accueil : image plein écran + voile + carte de réservation rapide (5 champs).
// `rarete` vient de la PAGE, qui est un composant serveur. Ce hero est
// « use client » a cause de son formulaire : il ne peut pas lire le CRM
// lui-meme. La page lit, le hero affiche — et quand il n'y a rien a
// afficher, la ligne n'existe pas.
export default function Hero({ rarete = null }) {
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
    // UN event_id par soumission : le navigateur l'envoie au pixel et le
    // même id part au CRM, qui renvoie le jumeau serveur (API
    // Conversions). Meta déduplique. Si un bloqueur coupe le pixel, la
    // conversion serveur reste.
    const eventId = newLeadEventId();
    const ok = await sendLead({
      subject: "Nouveau lead — Réservation rapide (hero)",
      meta_pixel: metaPixelBlock(eventId),
      // L'attribution voyage dans la source : le CRM la lit sans schéma neuf.
      source: `Formulaire hero (réservation rapide)${data.attribution ? ` · ${data.attribution}` : ""}`,
      // Trace du consentement (Loi 25 / LCAP), horodatée.
      consentement: `accordé le ${new Date().toISOString().slice(0, 10)} via le formulaire du hero`,
      ...data,
    });
    if (ok) {
      // Lead AVEC son event_id, et /merci rejoue le MÊME id : sans ça la
      // page de remerciement comptait une deuxième conversion pour la
      // même soumission.
      // On ATTEND que le pixel soit pret ET que sa requete parte : une
      // redirection immediate la coupait, et aucun Lead n'etait compte.
      await trackLead(eventId);
      await laisserPartir();
      window.location.assign(`${merciUrl("", eventId)}${eventId ? "&" : "?"}src=hero`);
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
      {/* Fondu vers le bas : la photo se dissout dans le navy exact de la
          section des cartes (#0B1B2B). Sans lui, la bordure de l'image
          coupait net derrière les cartes qui la chevauchent. */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(11,27,43,0) 40%, rgba(11,27,43,0.85) 82%, #0B1B2B 100%)" }} />

      <div className="hero-container hero-grid" style={{ position: "relative", width: "100%" }}>
        <div>
          <div className="hero-eyebrow" style={{
            fontSize: 12, fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "#E9DCC0", marginBottom: 20,
          }}>
            Installation clé en main — pose, entretien et retrait inclus
          </div>
          {/* « Sans monter dans l'échelle » vendait le confort — l'argument
              d'un service qu'on achète pour s'éviter une corvée. Le
              positionnement change : ce n'est plus une corvée déléguée,
              c'est un résultat confié à des professionnels. */}
          <h1 className="hero-h1" style={{ color: ivory }}>
            Votre maison,<br />illuminée par des professionnels.
          </h1>
          <p style={{ color: "rgba(243,233,210,0.85)", fontSize: 18, lineHeight: 1.5, margin: "20px 0 28px", maxWidth: "52ch" }}>
            Conception, installation, entretien et retrait. Un nombre limité de
            propriétés chaque saison.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 18 }} data-barre-ancre>
            <CTAButton href="/soumission" variant="gold">Réserver ma date</CTAButton>
          </div>

          {/* ⚠️ Le téléphone devient un LIEN, pas un deuxième gros bouton.
              Deux boutons de même poids ne donnent pas le choix : ils le
              retirent. Celui qui veut appeler le voit ; celui qui hésitait
              n'a plus qu'une porte devant lui. */}
          <p className="hero-tel">
            ou appelez-nous : <a href={company.phoneHref}>{company.phoneDisplay}</a>
          </p>
          {/* ⚠️ La ligne de rareté a été RETIRÉE d'ici.
              Elle répétait, mot pour mot, ce que le bandeau du haut dit
              déjà — « Octobre : 35 places restantes, −15 % » lu deux fois
              sur le même écran. Le deuxième affaiblit le premier : un
              chiffre qu'on répète ressemble à un argument, pas à un fait.
              Le bandeau garde les données du CRM. Seule la fermeture des
              réservations reste ici, en petit, sous le bouton. */}
          {/* ⚠️ La fermeture des réservations, sur TÉLÉPHONE seulement.
              Sous 480 px, le bandeau passe sur une seule ligne et la
              lâche pour tenir. Elle ne disparaît pas pour autant : elle
              descend ici, sous le bouton, à l'endroit exact où quelqu'un
              hésite à cliquer. Au-dessus de 480 px elle reste dans le
              bandeau — l'afficher aux deux endroits la ferait lire deux
              fois. */}
          {rarete?.fermetureLe && dateEnFrancais(rarete.fermetureLe) && (
            <p className="hero-fermeture">
              Réservations fermées le {dateEnFrancais(rarete.fermetureLe)}.
            </p>
          )}
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
              inclus », l'entreposage, les places limitées. Les garder, c'est
              faire lire deux fois la même chose au visiteur et repousser le
              formulaire vers le bas. La barre le dit mieux : chaque réponse y
              est cliquable et mène à la page qui la détaille.
              Le matériel professionnel fourni, seul point qui n'était PAS
              repris, est rappelé dans la carte « Tout inclus » côté services. */}
        </div>

        {/* Carte de réservation rapide */}
        <div className="hero-card" style={{
          background: "rgba(255,255,255,0.96)", borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)", alignSelf: "start",
        }}>
          {(
            /* Le formulaire fait taire la barre du bas : proposer
               « Réserver ma date » à quelqu'un qui le remplit déjà, c'est lui
               demander de recommencer. */
            <form onSubmit={submit} noValidate data-barre-masque>
              <h3 style={{ color: charcoal, marginBottom: 2, fontSize: 24 }}>Réservez votre date</h3>
              {/* Le sous-titre dit ce qui se passe APRÈS l'envoi, et dans quel
                  ordre : on confirme la place, puis le prix, et les deux
                  viennent d'une consultation. « Un nombre limité de
                  propriétés » était vrai mais répétait le sous-titre du hero,
                  trois centimètres à gauche. */}
              <p style={{ fontSize: 13, color: "#666", marginBottom: 14 }}>
                Nous confirmons votre place et votre prix après une courte consultation.
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
