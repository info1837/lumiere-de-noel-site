"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { company, sendLeadEtRendreId, HONEYPOT_FIELD } from "@/components/data";
import { CaseConsentement } from "@/components/ConsentementAttribution";
import { newLeadEventId, metaPixelBlock, trackLead } from "@/lib/meta-lead-event";
import { evenement } from "@/lib/evenements";
import AdresseAutocomplete from "@/components/AdresseAutocomplete";
import RevelationLumiere from "@/components/RevelationLumiere";
import { paireAvantApres } from "@/components/photos";
import EtapePhoto from "./EtapePhoto";
import { villeDeAdresse } from "@/lib/adresse";

// ⚠️ LA PHOTO VIENT DU CLIENT, JAMAIS DE STREET VIEW.
// Google Maps Platform §3.2.3(c) interdit de créer du contenu à partir de
// son imagerie, et §3.2.3(a) d'en réhéberger hors de ses services. Un
// concurrent le fait ; ça ne nous autorise pas. La seule entrée d'image
// ici est <input type="file">.
//
// Cette règle a été REVÉRIFIÉE quand on a demandé d'ouvrir le parcours sur
// une façade tirée de Street View. Elle tient. Ce qui a été ajouté, c'est
// l'autocomplétion d'ADRESSE (du texte, usage prévu de l'API Places, clé
// gardée au serveur dans app/api/adresse) — pas l'imagerie.

// ─────────────────────────────────────────────────────────────────────────
// LE NOUVEL ORDRE : ON MONTRE, PUIS ON DEMANDE
// ─────────────────────────────────────────────────────────────────────────
// L'ancien parcours ouvrait sur un formulaire froid — prénom, téléphone,
// adresse — devant une page vide. Il avait sa logique, écrite à l'époque :
// la fiche existait dès le premier écran, donc quelqu'un qui abandonnait à
// l'écran 2 restait un lead rappelable.
//
// On l'inverse volontairement : 1 adresse · 2 photo · 3 style · 4 résultat
// flouté + coordonnées · 5 révélation. Le visiteur ne donne son numéro
// qu'après avoir vu sa maison illuminée.
//
// ⚠️ CE QUE ÇA COÛTE, ET QUI LE PAIE.
// Quelqu'un qui part à l'écran 2 ou 3 n'est plus un lead : il n'a rien
// laissé. C'est un choix assumé, pas un oubli — décidé avec Yahir.
//
// ⚠️ ET LA DÉPENDANCE QUI RESTE AU CRM.
// La génération vit chez palencia-crm, et la route d'image vérifie que la
// clé demandée « appartient bien à la fiche de ce jeton » : le résultat est
// rangé sur une FICHE. Tant que le CRM exige un `leadId` pour générer, le
// vrai « wow d'abord » n'est pas possible de bout en bout. D'où
// `besoinFiche` plus bas : si la génération sans fiche échoue, l'écran
// demande les coordonnées à ce moment-là et relance. Le visiteur n'est
// jamais coincé, et aucun lead n'est perdu — mais il voit alors le
// formulaire avant l'image, comme avant. La modification côté CRM est
// signalée dans la PR.

// ⚠️ QUATRE CHOIX, et chacun se traduit dans le contrat EXISTANT du CRM
// (`style` + `arbres`). « Toiture + arbres » n'est pas un cinquième style :
// c'est le blanc chaud avec les arbres allumés. Inventer une valeur de
// `style` que le CRM ne connaît pas aurait donné une génération au hasard.
const STYLES = [
  { cle: "chaud",  titre: "Blanc chaud",      detail: "2700 K · le classique", style: "chaud", arbres: false, teintes: ["#FFE2B0", "#F0BA54"] },
  { cle: "multi",  titre: "Multicolore",      detail: "rouge, vert, bleu",     style: "multi", arbres: false, teintes: ["#E2574C", "#4CAF50", "#4C7FE2"] },
  { cle: "froid",  titre: "Blanc froid",      detail: "6500 K · net",          style: "froid", arbres: false, teintes: ["#EAF3FF", "#A2B4CC"] },
  { cle: "arbres", titre: "Toiture + arbres", detail: "la façade et la cour",  style: "chaud", arbres: true,  teintes: ["#FFE2B0", "#9BD6A0"] },
];

const AMPOULES = 6;

// La paire d'exemple du premier écran. Sainte-Julienne : c'est la photo
// prise à l'heure bleue, celle où la différence entre « sans » et
// « avec » se lit le mieux sur un petit écran.
const exemple = paireAvantApres("avant-ste-julienne");
export default function Simulateur() {
  // 1 adresse · 2 photo · 3 style · 3.5 génération · 4 teaser+coordonnées · 5 révélation
  const [etape, setEtape] = useState(1);
  const [adresse, setAdresse] = useState("");
  const [photo, setPhoto] = useState(null);
  const [choix, setChoix] = useState("chaud");
  const [coord, setCoord] = useState({ nom: "", telephone: "", courriel: "", consent: false, [HONEYPOT_FIELD]: "" });
  const [erreur, setErreur] = useState("");
  const [resultat, setResultat] = useState(null);
  const [leadId, setLeadId] = useState(null);
  const [besoinFiche, setBesoinFiche] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [allumees, setAllumees] = useState(0);
  const [curseur, setCurseur] = useState(50);

  const styleActif = STYLES.find((s) => s.cle === choix) || STYLES[0];

  // `sim_start` une seule fois, au premier rendu réel.
  const demarre = useRef(false);
  useEffect(() => {
    if (demarre.current) return;
    demarre.current = true;
    evenement("sim_start");
  }, []);

  // ── Les ampoules du chargement ─────────────────────────────────────
  // Une guirlande de six qui s'allument une par une. Ce n'est pas une
  // barre de progression déguisée : elle ne prétend pas savoir où on en
  // est. Elle occupe le temps en montrant la chose qu'on vend.
  useEffect(() => {
    if (etape !== 3.5) { setAllumees(0); return; }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setAllumees(AMPOULES);
      return;
    }
    const horloge = setInterval(() => setAllumees((n) => (n + 1) % (AMPOULES + 1)), 420);
    return () => clearInterval(horloge);
  }, [etape]);

  // ── Écran 1 → 2 ────────────────────────────────────────────────────
  const validerAdresse = (e) => {
    e.preventDefault();
    if (adresse.trim().length < 6) {
      setErreur("Écrivez votre adresse pour commencer.");
      return;
    }
    setErreur("");
    evenement("sim_address");
    setEtape(2);
  };

  const recevoirPhoto = useCallback((dataUrl) => {
    setErreur(""); setPhoto(dataUrl); setEtape(3);
  }, []);

  // ── La génération ──────────────────────────────────────────────────
  // `idFiche` est passé explicitement : après la création d'une fiche dans
  // le repli, l'état React n'est pas encore relu quand on relance.
  const generer = useCallback(async (idFiche = null) => {
    setErreur(""); setEtape(3.5);
    try {
      const r = await fetch("/api/simulateur", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: idFiche || leadId || "",
          telephone: coord.telephone || "",
          adresse,
          style: styleActif.style,
          arbres: styleActif.arbres,
          // ⚠️ La question « combien d'étages ? » a été retirée du parcours
          // (quatre choix maximum à l'écran du style). Le CRM reçoit donc
          // une chaîne vide, et l'ancrage de prix affiché est celui du site
          // — « à partir de 1 000 $ » — au lieu d'un montant déduit d'une
          // réponse qu'on ne demande plus.
          etages: "",
          photo,
        }),
      });
      const j = await r.json();

      if (!j.ok) {
        // Les refus qu'on sait lire : on les dit, et on ne bascule pas.
        const connus = ["plafond", "photo_trop_grosse", "non_configure", "reseau", "corps_illisible"];
        const sansFiche = !(idFiche || leadId);
        if (sansFiche && !connus.includes(j.raison)) {
          // ⚠️ LE REPLI. Le CRM veut une fiche pour ranger l'image. On
          // demande les coordonnées maintenant, puis on relance — plutôt
          // que de laisser le visiteur devant un échec qu'il ne peut pas
          // corriger.
          setBesoinFiche(true);
          setErreur("");
          setEtape(4);
          return;
        }
        setErreur(j.message || "Yahir vous envoie votre simulation par texto sous peu.");
        setEtape(3);
        return;
      }

      setResultat(j);
      evenement("sim_generated", { style: styleActif.cle });
      // Avec une fiche déjà créée (le repli), l'image est débloquée tout de
      // suite : le visiteur a déjà donné ses coordonnées, les redemander
      // serait les demander deux fois.
      setEtape(idFiche || leadId ? 5 : 4);
    } catch {
      setErreur("Yahir vous envoie votre simulation par texto sous peu.");
      setEtape(3);
    }
  }, [adresse, coord.telephone, leadId, photo, styleActif]);

  const choisirStyle = (cle) => {
    setChoix(cle);
    evenement("sim_style", { style: cle });
  };

  // ── Écran 4 : les coordonnées, et le lead part ─────────────────────
  const envoyerCoordonnees = async (e) => {
    e.preventDefault();
    if (!coord.nom.trim() || !coord.telephone.trim()) {
      setErreur("Votre prénom et votre téléphone, s'il vous plaît."); return;
    }
    if (!coord.consent) { setErreur("Il nous faut votre accord pour vous répondre."); return; }
    setErreur(""); setEnvoi(true);

    // UN event_id par soumission : le navigateur l'envoie au pixel et le
    // même id part au CRM, qui renvoie le jumeau serveur (API
    // Conversions). Meta déduplique.
    const eventId = newLeadEventId();
    const { ok, id } = await sendLeadEtRendreId({
      subject: "Nouveau lead — Simulateur",
      meta_pixel: metaPixelBlock(eventId),
      source: "Simulateur",
      consentement: `accordé le ${new Date().toISOString().slice(0, 10)} via le simulateur`,
      nom: coord.nom,
      telephone: coord.telephone,
      courriel: coord.courriel,
      adresse,
      // La ville part à part : c'est une colonne du CRM, et Sophie B la lit.
      ville: villeDeAdresse(adresse),
      service: "Lumière de Noël (résidentiel)",
      message: `Style choisi au simulateur : ${styleActif.titre}`,
      [HONEYPOT_FIELD]: coord[HONEYPOT_FIELD],
    });
    await trackLead(eventId);
    evenement("sim_lead", { style: styleActif.cle });
    setEnvoi(false);

    if (!ok) {
      setErreur("On n'a pas pu enregistrer vos coordonnées. Appelez-nous et on s'en occupe.");
      return;
    }
    if (id) setLeadId(id);

    // Deux chemins. Dans le repli, l'image n'existe pas encore : on la
    // génère maintenant qu'il y a une fiche où la ranger.
    if (besoinFiche) { await generer(id); return; }
    setEtape(5);
  };

  const urlImage = (cle) =>
    `/api/simulateur/image?cle=${encodeURIComponent(cle)}&jeton=${encodeURIComponent(resultat.jeton)}`;

  // Le lien de réservation arrive prérempli : le visiteur vient d'écrire
  // tout ça, le lui faire retaper serait le punir d'avoir avancé.
  const lienReservation = () => {
    const p = new URLSearchParams();
    if (coord.nom) p.set("nom", coord.nom);
    if (coord.telephone) p.set("tel", coord.telephone);
    if (adresse) p.set("adresse", adresse);
    p.set("style", styleActif.titre);
    return `/soumission?${p.toString()}`;
  };

  // Les quatre points. L'étape 3.5 compte comme l'étape 3, et la 5 comme
  // la 4 : un point de plus pour un écran intermédiaire ferait reculer la
  // barre quand la génération échoue.
  const pointActif = etape >= 5 ? 4 : etape >= 4 ? 4 : etape >= 3 ? 3 : Math.floor(etape);

  return (
    <div className="sim">
      {/* ⚠️ QUATRE POINTS, SANS NOMS D'ÉTAPE.
          Les libellés « Vous · Photo · Style · Résultat » annonçaient le
          formulaire dès le premier écran — et « Vous » en tête disait au
          visiteur qu'on allait d'abord parler de lui. Un point qui s'allume
          suffit à dire où on en est. */}
      <ol className="sim-points" aria-label={`Étape ${pointActif} sur 4`}>
        {[1, 2, 3, 4].map((n) => (
          <li key={n} className={n === pointActif ? "ici" : n < pointActif ? "fait" : ""}>
            <span className="sim-sr">Étape {n}</span>
          </li>
        ))}
      </ol>

      {erreur && <p className="sim-erreur" role="alert">{erreur}</p>}

      {/* ── 1 · L'adresse, et rien d'autre ─────────────────────────── */}
      {etape === 1 && (
        <form onSubmit={validerAdresse} noValidate data-barre-masque>
          <h1 className="sim-titre">Voyez votre maison illuminée</h1>
          <p className="sim-sous">
            Votre adresse, une photo de la façade, et vous voyez le résultat.
            On ne vous demande rien d&apos;autre avant.
          </p>

          {/* ⚠️ L'EXEMPLE AVANT DE DEMANDER QUOI QUE CE SOIT.
              L'écran s'ouvrait sur un champ d'adresse et rien à regarder :
              on demandait un geste avant d'avoir montré ce qu'il rapporte.
              Ce comparateur est un VRAI chantier — le côté droit est la
              photo, le gauche une simulation sans les lumières — et il dit
              lequel est lequel. C'est la promesse de la page, faite avant
              la question. */}
          {exemple && (
            <div className="sim-exemple">
              <RevelationLumiere
                photo={exemple.apres}
                photoAvant={exemple.avant}
                etiquetteAvant="Avant (simulation)"
                etiquetteApres="Après — installation réelle, Sainte-Julienne"
                altAvant="La même résidence, sans aucune lumière de Noël — simulation"
                altApres="La même résidence avec l'installation réelle de lumières de Noël, à Sainte-Julienne"
                legende="Un vrai chantier — glissez pour voir la différence"
                hauteur="clamp(240px, 64vw, 380px)"
              />
            </div>
          )}

          <label htmlFor="sim-adresse">Votre adresse</label>
          <AdresseAutocomplete
            id="sim-adresse"
            valeur={adresse}
            onChange={setAdresse}
          />
          <button type="submit" className="sim-cta">Commencer</button>
          <p className="sim-note sim-note--centre">
            Aucun numéro de téléphone pour l&apos;instant.
          </p>
        </form>
      )}

      {/* ── 2 · La photo ───────────────────────────────────────────── */}
      {etape === 2 && (
        <>
          <EtapePhoto leadId={leadId} telephone={coord.telephone}
            onPhoto={recevoirPhoto} setErreur={setErreur} />
          <button type="button" className="sim-lien" onClick={() => setEtape(1)}>
            ← Changer l&apos;adresse
          </button>
        </>
      )}

      {/* ── 3 · Le style ───────────────────────────────────────────── */}
      {etape === 3 && (
        <div>
          <h2 className="sim-titre">Votre style</h2>
          <p className="sim-sous">Rien ne se dévoile encore — choisissez, on allume ensuite.</p>
          <div className="sim-styles">
            {STYLES.map((s) => (
              <button key={s.cle} type="button" onClick={() => choisirStyle(s.cle)}
                className={`sim-style${choix === s.cle ? " actif" : ""}`} aria-pressed={choix === s.cle}>
                {/* L'échantillon montre la couleur au lieu de la nommer. */}
                <span className="sim-swatch" aria-hidden="true">
                  {s.teintes.map((t) => (
                    <span key={t} style={{ background: t }} />
                  ))}
                </span>
                <strong>{s.titre}</strong>
                <span className="sim-style-detail">{s.detail}</span>
              </button>
            ))}
          </div>
          <button type="button" className="sim-cta" onClick={() => generer()}>
            Voir ma maison illuminée
          </button>
          <button type="button" className="sim-lien" onClick={() => setEtape(2)}>
            ← Reprendre la photo
          </button>
        </div>
      )}

      {/* ── 3.5 · La guirlande ─────────────────────────────────────── */}
      {etape === 3.5 && (
        <div className="sim-attente" role="status" aria-live="polite">
          <div className="sim-guirlande" aria-hidden="true">
            {Array.from({ length: AMPOULES }, (_, i) => (
              <span key={i} className={i < allumees ? "allumee" : ""} />
            ))}
          </div>
          <p>On allume votre maison…</p>
        </div>
      )}

      {/* ── 4 · Le résultat flouté, et les coordonnées ─────────────── */}
      {etape === 4 && (
        <div>
          <h2 className="sim-titre">
            {besoinFiche ? "Presque\u00a0: vos coordonnées" : "Votre maison est prête"}
          </h2>

          {/* Le teaser : l'image existe, elle est là, elle est floue. Dans
              le repli (pas encore d'image), on ne montre pas de faux
              aperçu — on dit simplement ce qui vient. */}
          {!besoinFiche && resultat && (
            <div className="sim-teaser">
              <img src={urlImage(resultat.resultatCle)} alt="" aria-hidden="true" />
              <div className="sim-teaser-voile">
                <span className="sim-cadenas" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="10.5" width="16" height="10.5" rx="2.2" stroke="currentColor" strokeWidth="1.9" />
                    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                  </svg>
                </span>
                <p>Débloquez votre image</p>
              </div>
            </div>
          )}

          <p className="sim-sous">
            {besoinFiche
              ? "On prépare votre simulation et on vous l'envoie par texto dès qu'elle est prête."
              : "Votre prénom et votre numéro, et on la débloque — on vous l'envoie aussi par texto."}
          </p>

          <form onSubmit={envoyerCoordonnees} noValidate data-barre-masque>
            <label htmlFor="sim-nom">Prénom *</label>
            <input id="sim-nom" value={coord.nom} autoComplete="given-name"
              onChange={(e) => setCoord({ ...coord, nom: e.target.value })} placeholder="Votre prénom" />
            <label htmlFor="sim-tel">Téléphone *</label>
            <input id="sim-tel" type="tel" inputMode="tel" autoComplete="tel" value={coord.telephone}
              onChange={(e) => setCoord({ ...coord, telephone: e.target.value })} placeholder="(514) 000-0000" />
            <label htmlFor="sim-courriel">Courriel <span className="sim-option">(facultatif)</span></label>
            <input id="sim-courriel" type="email" inputMode="email" autoComplete="email" value={coord.courriel}
              onChange={(e) => setCoord({ ...coord, courriel: e.target.value })} placeholder="vous@exemple.com" />
            <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sim-miel"
              value={coord[HONEYPOT_FIELD]} onChange={(e) => setCoord({ ...coord, [HONEYPOT_FIELD]: e.target.value })} />
            {/* La case Loi 25 reste OBLIGATOIRE et décochée par défaut. */}
            <CaseConsentement id="sim-consent" checked={coord.consent}
              onChange={(v) => setCoord({ ...coord, consent: v })} />
            <button type="submit" className="sim-cta" disabled={envoi}>
              {envoi ? "Un instant…" : besoinFiche ? "Recevoir ma simulation" : "Débloquer mon image"}
            </button>
          </form>
        </div>
      )}

      {/* ── 5 · La révélation ──────────────────────────────────────── */}
      {etape === 5 && resultat && (
        <div>
          <h2 className="sim-titre">Votre maison, illuminée</h2>
          <div className="sim-compare sim-compare--revele">
            <img src={urlImage(resultat.photoCle)} alt="Votre maison, telle que vous l'avez photographiée" />
            <div className="sim-apres" style={{ width: `${curseur}%` }}>
              <img src={urlImage(resultat.resultatCle)} alt="Votre maison, illuminée le soir" />
            </div>
            <input type="range" min="0" max="100" value={curseur} aria-label="Comparer avant et après"
              onChange={(e) => setCurseur(Number(e.target.value))} />
          </div>
          <p className="sim-prix">Projets à partir de <strong>{company.priceFrom}</strong></p>
          <p className="sim-note">Yahir confirme votre prix exact après une courte consultation.</p>
          <Link href={lienReservation()} className="sim-cta"
            onClick={() => evenement("sim_reserve_click", { style: styleActif.cle })}>
            Réserver ma date
          </Link>
          {/* ⚠️ « Recevoir par texto » N'EST PAS UN BOUTON ICI.
              L'envoi par texto est ce que l'écran précédent a promis en
              échange du numéro, et c'est le CRM qui le déclenche à la
              création de la fiche. Un bouton l'aurait soit redemandé pour
              rien, soit créé une deuxième fiche pour la même personne. Le
              téléchargement, lui, fait quelque chose que le texto ne fait
              pas : garder l'image tout de suite. */}
          <a className="sim-lien" href={urlImage(resultat.resultatCle)}
            download="ma-maison-illuminee.jpg">
            Télécharger l&apos;image
          </a>
          <p className="sim-tel">ou appelez-nous : <a href={company.phoneHref}>{company.phoneDisplay}</a></p>
        </div>
      )}
    </div>
  );
}
