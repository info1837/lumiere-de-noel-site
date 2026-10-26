"use client";
import { useRef, useState } from "react";
import AdresseAutocomplete from "@/components/AdresseAutocomplete";
import { HONEYPOT_FIELD, company } from "@/components/data";
import { lireUtm } from "@/lib/utm";
import { newLeadEventId, metaPixelBlock, trackLead } from "@/lib/meta-lead-event";
import {
  CHOIX_ILLUMINER, VILLES_CONCOURS, TIRAGE_COURT, RABAIS_AVANT, VALEUR_PRIX,
  villeConcours, adresseComplete, formaterTelephone,
} from "@/lib/concours";

// Le formulaire du concours. Une seule page, aucune étape cachée.
//
// ⚠️ AUTOREMPLISSAGE : chaque champ porte son `autocomplete` (given-name,
// family-name, tel, email, street-address, address-level2, postal-code).
// Sur un iPhone, toucher « Prénom » propose de remplir TOUT le formulaire
// d'un coup — c'est la moitié de l'effort du participant.
//
// ⚠️ LA VILLE DÉCIDE DE L'ADMISSIBILITÉ. Elle se remplit depuis l'adresse
// choisie (/api/adresse) et reste modifiable. Hors des 4 villes : un message
// aimable et le lien vers la soumission normale — jamais une erreur sèche.
//
// Le serveur (CRM) refait TOUTES ces validations : celles d'ici ne servent
// qu'à répondre tout de suite.

const vide = {
  prenom: "", nom: "", telephone: "", courriel: "", adresse: "", ville: "", codePostal: "",
  illuminer: [], soumission: "", reglements: false, consentement: false, [HONEYPOT_FIELD]: "",
};

function lireFbclid() {
  try { return new URLSearchParams(window.location.search).get("fbclid") || ""; } catch { return ""; }
}

export default function FormulaireConcours() {
  const [d, setD] = useState(vide);
  const [erreurs, setErreurs] = useState({});
  const [etat, setEtat] = useState("saisie");   // saisie | envoi | inscrit | deja | ferme | erreur
  const [soumissionFinale, setSoumissionFinale] = useState("");
  const haut = useRef(null);

  const set = (k) => (e) => setD((p) => ({ ...p, [k]: e.target.value }));
  const horsVilles = d.ville.trim() && !villeConcours(d.ville);

  const valider = () => {
    const e = {};
    if (!d.prenom.trim()) e.prenom = "Votre prénom";
    if (!d.nom.trim()) e.nom = "Votre nom";
    if (d.telephone.replace(/\D/g, "").length < 10) e.telephone = "Un numéro à 10 chiffres";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.courriel.trim())) e.courriel = "Une adresse courriel valide";
    if (!adresseComplete(d.adresse)) e.adresse = "Le numéro civique et la rue (ex. 12 rue des Pins)";
    if (!villeConcours(d.ville)) e.ville = d.ville.trim() ? "hors" : "Votre ville";
    if (!d.soumission) e.soumission = "Choisissez Oui ou Non";
    if (!d.reglements) e.reglements = "Cochez pour confirmer que vous avez lu les règlements";
    return e;
  };

  const envoyer = async (ev) => {
    ev.preventDefault();
    if (etat === "envoi") return;
    const e = valider();
    setErreurs(e);
    if (Object.keys(e).length) {
      const premier = document.querySelector("[aria-invalid='true']");
      premier?.focus?.();
      return;
    }
    setEtat("envoi");
    const eventId = newLeadEventId();
    let r = null;
    try {
      const res = await fetch("/api/concours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: d.prenom, nom: d.nom, telephone: d.telephone, courriel: d.courriel,
          adresse: d.adresse, ville: villeConcours(d.ville) || d.ville, codePostal: d.codePostal,
          illuminer: d.illuminer, soumission: d.soumission,
          reglements: d.reglements, consentement: d.consentement,
          utm: { ...lireUtm(), fbclid: lireFbclid() },
          meta_pixel: metaPixelBlock(eventId),
          [HONEYPOT_FIELD]: d[HONEYPOT_FIELD],
        }),
      });
      r = await res.json().catch(() => null);
    } catch { r = null; }

    if (r?.ok && r.statut === "deja_inscrit") { setEtat("deja"); }
    else if (r?.ok) {
      setSoumissionFinale(d.soumission);
      setEtat("inscrit");
      // Le pixel avec le MÊME event_id que le jumeau serveur du CRM : dédupliqué.
      trackLead(eventId, { content_name: "concours" });
    } else if (r?.erreur === "hors_villes") { setErreurs({ ville: "hors" }); setEtat("saisie"); return; }
    else if (r?.erreur === "concours_termine") { setEtat("ferme"); }
    else { setEtat("erreur"); return; }
    requestAnimationFrame(() => haut.current?.scrollIntoView({ behavior: "auto", block: "start" }));
  };

  if (etat === "inscrit" || etat === "deja" || etat === "ferme") {
    return (
      <div ref={haut} className="concours-merci" role="status" aria-live="polite">
        {etat === "inscrit" && <h2 className="concours-merci__titre">Vous êtes inscrit au tirage du {TIRAGE_COURT}!</h2>}
        {etat === "deja" && <h2 className="concours-merci__titre">Vous êtes déjà inscrit, bonne chance!</h2>}
        {etat === "ferme" && <h2 className="concours-merci__titre">Les inscriptions sont terminées</h2>}
        {etat !== "ferme" && (
          <>
            <p className="concours-merci__ligne"><b>Votre 15 % de rabais</b> est valide pour une réservation faite avant le {RABAIS_AVANT}.</p>
            <p className="concours-merci__ligne">
              Réservez maintenant : si vous gagnez, on vous rembourse jusqu&apos;à {VALEUR_PRIX}. Vous ne perdez rien à réserver tôt.
            </p>
          </>
        )}
        {etat === "ferme" && <p className="concours-merci__ligne">Le tirage a lieu le {TIRAGE_COURT}, en direct sur Instagram.</p>}
        <div className="concours-merci__actions">
          {etat === "inscrit" && soumissionFinale === "oui" && (
            <a href="/calculatrice?src=concours" className="concours-bouton">Voir mes options et réserver</a>
          )}
          <a href={company.social.instagram.href} target="_blank" rel="noopener noreferrer" className="concours-bouton concours-bouton--contour">
            Suivre le tirage en direct sur Instagram
          </a>
        </div>
      </div>
    );
  }

  const champ = (id, libelle, props, err) => (
    <div className="concours-champ">
      <label htmlFor={id}>{libelle}</label>
      <input id={id} {...props} aria-invalid={err ? "true" : undefined} aria-describedby={err ? `${id}-err` : undefined} />
      {err && <p id={`${id}-err`} className="concours-erreur">{err}</p>}
    </div>
  );

  return (
    <form ref={haut} onSubmit={envoyer} noValidate className="concours-form" aria-label="Participer au concours">
      <div className="concours-grille-2">
        {champ("cc-prenom", "Prénom", { type: "text", autoComplete: "given-name", value: d.prenom, onChange: set("prenom"), required: true }, erreurs.prenom)}
        {champ("cc-nom", "Nom", { type: "text", autoComplete: "family-name", value: d.nom, onChange: set("nom"), required: true }, erreurs.nom)}
      </div>
      {champ("cc-tel", "Téléphone", {
        type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "(450) 555-0123", required: true,
        value: d.telephone, onChange: (e) => setD((p) => ({ ...p, telephone: formaterTelephone(e.target.value) })),
      }, erreurs.telephone)}
      {champ("cc-courriel", "Courriel", {
        type: "email", inputMode: "email", autoComplete: "email", placeholder: "vous@exemple.com", required: true,
        value: d.courriel, onChange: set("courriel"),
      }, erreurs.courriel)}

      <div className="concours-champ">
        <label htmlFor="cc-adresse">Adresse complète</label>
        <AdresseAutocomplete
          id="cc-adresse"
          valeur={d.adresse}
          onChange={(v) => setD((p) => ({ ...p, adresse: v }))}
          onChoisir={(x) => setD((p) => ({ ...p, ville: x.ville || p.ville, codePostal: x.codePostal || p.codePostal }))}
          placeholder="12 rue des Pins, Blainville"
          requis
          invalide={!!erreurs.adresse}
        />
        {erreurs.adresse && <p className="concours-erreur">{erreurs.adresse}</p>}
      </div>

      <div className="concours-grille-2 concours-grille-2--ville">
        <div className="concours-champ">
          <label htmlFor="cc-ville">Ville</label>
          <input id="cc-ville" type="text" autoComplete="address-level2" list="cc-villes" value={d.ville}
            onChange={(e) => { setD((p) => ({ ...p, ville: e.target.value })); setErreurs((x) => ({ ...x, ville: undefined })); }}
            aria-invalid={erreurs.ville ? "true" : undefined} required />
          <datalist id="cc-villes">{VILLES_CONCOURS.map((v) => <option key={v} value={v} />)}</datalist>
          {erreurs.ville && erreurs.ville !== "hors" && <p className="concours-erreur">{erreurs.ville}</p>}
        </div>
        <div className="concours-champ">
          <label htmlFor="cc-postal">Code postal <span className="concours-facultatif">(facultatif)</span></label>
          <input id="cc-postal" type="text" autoComplete="postal-code" autoCapitalize="characters" value={d.codePostal} onChange={set("codePostal")} />
        </div>
      </div>
      {(erreurs.ville === "hors" || horsVilles) && (
        <p className="concours-avis" role="alert">
          Le concours est réservé à Blainville, Sainte-Thérèse, Rosemère et Boisbriand. Vous pouvez quand même{" "}
          <a href="/soumission">demander une soumission</a>.
        </p>
      )}

      <fieldset className="concours-champ concours-groupe">
        <legend>Qu&apos;aimeriez-vous illuminer?</legend>
        <div className="concours-puces">
          {CHOIX_ILLUMINER.map((c) => {
            const on = d.illuminer.includes(c);
            return (
              <button key={c} type="button" className="concours-puce" aria-pressed={on}
                onClick={() => setD((p) => ({ ...p, illuminer: on ? p.illuminer.filter((x) => x !== c) : [...p.illuminer, c] }))}>
                {c}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="concours-champ concours-groupe">
        <legend>Voulez-vous recevoir votre soumission avec 15 % même si vous ne gagnez pas?</legend>
        <div className="concours-ouinon" role="radiogroup">
          {[["oui", "Oui"], ["non", "Non"]].map(([v, l]) => (
            <label key={v} className="concours-choix" data-coche={d.soumission === v ? "1" : "0"}>
              <input type="radio" name="soumission" value={v} checked={d.soumission === v}
                onChange={() => { setD((p) => ({ ...p, soumission: v })); setErreurs((x) => ({ ...x, soumission: undefined })); }}
                aria-invalid={erreurs.soumission ? "true" : undefined} />
              {l}
            </label>
          ))}
        </div>
        {erreurs.soumission && <p className="concours-erreur">{erreurs.soumission}</p>}
      </fieldset>

      {/* Pot de miel : invisible, hors tabulation. Un robot le remplit. */}
      <div aria-hidden="true" className="concours-miel">
        <label htmlFor="cc-site">Ne pas remplir</label>
        <input id="cc-site" type="text" tabIndex={-1} autoComplete="off" value={d[HONEYPOT_FIELD]} onChange={set(HONEYPOT_FIELD)} />
      </div>

      <div className="concours-cases">
        <label className="concours-case">
          <input type="checkbox" checked={d.reglements} required
            onChange={(e) => { setD((p) => ({ ...p, reglements: e.target.checked })); setErreurs((x) => ({ ...x, reglements: undefined })); }}
            aria-invalid={erreurs.reglements ? "true" : undefined} />
          <span>J&apos;ai lu les <a href="#reglements">règlements</a>.</span>
        </label>
        {erreurs.reglements && <p className="concours-erreur">{erreurs.reglements}</p>}
        <label className="concours-case">
          <input type="checkbox" checked={d.consentement} onChange={(e) => setD((p) => ({ ...p, consentement: e.target.checked }))} />
          <span>
            J&apos;accepte de recevoir des communications de Solution Lumière de Noël.
            <small>Nécessaire pour recevoir votre 15 % et votre soumission par texto ou courriel. Sans cette case, vous participez quand même au tirage. Désabonnement en tout temps.</small>
          </span>
        </label>
      </div>

      <button type="submit" className="concours-bouton concours-bouton--plein" disabled={etat === "envoi"}>
        {etat === "envoi" ? "Inscription…" : "Je participe au tirage"}
      </button>
      {etat === "erreur" && (
        <p className="concours-erreur" role="alert">
          L&apos;inscription n&apos;a pas passé. Réessayez dans un instant, ou appelez-nous au{" "}
          <a href={company.phoneHref}>{company.phoneDisplay}</a>.
        </p>
      )}
      <p className="concours-note">Aucun achat requis. Une participation par adresse. 18 ans et plus.</p>
    </form>
  );
}
