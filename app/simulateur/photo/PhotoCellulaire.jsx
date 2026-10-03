"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { company } from "@/components/data";
import { preparerPhoto } from "@/lib/photo-maison";

// La page qu'on atteint en scannant le QR affiché sur l'ordinateur.
//
// ELLE NE FAIT QU'UNE CHOSE. Pas de formulaire, pas de menu, pas de prix,
// aucun autre lien : quelqu'un est debout dehors devant sa maison, au froid,
// avec son téléphone. Deux boutons, et c'est fini.
//
// ⚠️ ELLE NE SAIT RIEN DE LUI. Le code de l'URL ne contient ni son nom, ni son
// téléphone, ni l'identifiant de sa fiche — et cette page ne les demande pas.
// Elle n'affiche donc jamais « Bonjour Laurie » : ce serait révéler, à qui
// lirait l'écran par-dessus son épaule, à qui appartient cette maison.

const ETATS_MORTS = ["expire", "inconnu"];

export default function PhotoCellulaire({ code }) {
  const [etat, setEtat] = useState("chargement");  // chargement|attente|envoi|envoyee|morte
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const appareilRef = useRef(null);
  const pelliculeRef = useRef(null);

  // ── Le code est-il encore bon ? ────────────────────────────────────
  // On demande AVANT d'afficher les boutons : montrer « Prenez une photo » à
  // quelqu'un dont le code a expiré, c'est le faire ressortir pour rien.
  useEffect(() => {
    let vivant = true;
    (async () => {
      if (!code) { if (vivant) { setEtat("morte"); setMessage("Lien expiré, rescannez le code sur votre ordinateur."); } return; }
      try {
        const r = await fetch(`/api/simulateur/relais?code=${encodeURIComponent(code)}`, { cache: "no-store" });
        const j = await r.json();
        if (!vivant) return;
        if (j?.etat === "attente") { setEtat("attente"); return; }
        if (j?.etat === "prete" || j?.etat === "utilise") {
          // Sa photo est DÉJÀ partie : il a rafraîchi, ou rescanné par
          // réflexe. On le rassure au lieu de l'envoyer recommencer.
          setEtat("envoyee"); setMessage(j.message || ""); return;
        }
        setEtat("morte");
        setMessage(j?.message || "Lien expiré, rescannez le code sur votre ordinateur.");
      } catch {
        if (!vivant) return;
        setEtat("morte");
        setMessage("Nous n'arrivons pas à vérifier ce lien. Rescannez le code sur votre ordinateur.");
      }
    })();
    return () => { vivant = false; };
  }, [code]);

  const envoyer = useCallback(async (e) => {
    const fichier = e.target.files?.[0];
    // On vide la valeur tout de suite : sans ça, rechoisir LE MÊME fichier
    // après une erreur ne déclenche aucun `change`, et le bouton semble mort.
    e.target.value = "";
    if (!fichier) return;
    setErreur(""); setEtat("envoi");

    const prete = await preparerPhoto(fichier);
    if (!prete.ok) { setErreur(prete.message); setEtat("attente"); return; }

    try {
      const r = await fetch("/api/simulateur/relais/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, photo: prete.dataUrl }),
      });
      const j = await r.json();
      if (!j?.ok) {
        // Un code mort pendant qu'il cadrait sa photo : on le dit, sans
        // laisser un bouton qui ne marche plus.
        if (ETATS_MORTS.includes(j?.raison)) { setEtat("morte"); setMessage(j.message || ""); return; }
        if (j?.raison === "prete" || j?.raison === "utilise") { setEtat("envoyee"); setMessage(j.message || ""); return; }
        setErreur(j?.message || "L'envoi a échoué. Réessayez."); setEtat("attente"); return;
      }
      setEtat("envoyee"); setMessage(j.message || "Photo envoyée ! Retournez à votre ordinateur.");
    } catch {
      setErreur("L'envoi a échoué. Vérifiez votre connexion et réessayez.");
      setEtat("attente");
    }
  }, [code]);

  if (etat === "chargement") {
    return <p className="sim-attente" role="status" aria-live="polite">Un instant…</p>;
  }

  if (etat === "morte") {
    return (
      <div className="sim">
        <p className="sim-tele-pictogramme" aria-hidden="true">⏳</p>
        <h1 className="sim-titre">Lien expiré</h1>
        <p className="sim-sous">{message}</p>
        <p className="sim-tel">une question ? <a href={company.phoneHref}>{company.phoneDisplay}</a></p>
      </div>
    );
  }

  if (etat === "envoyee") {
    return (
      <div className="sim">
        <p className="sim-tele-pictogramme" aria-hidden="true">✅</p>
        <h1 className="sim-titre">Photo envoyée&nbsp;!</h1>
        <p className="sim-sous">{message || "Retournez à votre ordinateur."}</p>
        <p className="sim-sous" style={{ marginBottom: 0 }}>
          Votre maison illuminée s&apos;affiche là-bas dans un instant. Vous pouvez ranger votre téléphone.
        </p>
      </div>
    );
  }

  const occupe = etat === "envoi";
  return (
    <div className="sim">
      <p className="sim-tele-marque">{company.shortName}</p>
      <h1 className="sim-titre">Une photo de votre façade</h1>
      <ul className="sim-conseils">
        <li>De face, toute la maison dans le cadre</li>
        <li>De jour — on s&apos;occupe de la nuit</li>
        <li>Reculez de quelques pas si besoin</li>
      </ul>

      {erreur && <p className="sim-erreur" role="alert">{erreur}</p>}

      {/* Deux entrées SÉPARÉES, et non une seule dont on retirerait `capture`.
          Muter l'attribut d'une entrée partagée laisse le deuxième bouton
          ouvrir ce que le premier a ouvert — c'était le défaut de la version
          précédente. */}
      <input ref={appareilRef} type="file" accept="image/*" capture="environment"
        onChange={envoyer} className="sim-miel" id="sim-tele-appareil" tabIndex={-1} />
      <input ref={pelliculeRef} type="file" accept="image/*"
        onChange={envoyer} className="sim-miel" id="sim-tele-pellicule" tabIndex={-1} />

      <button type="button" className="sim-cta" disabled={occupe}
        onClick={() => appareilRef.current?.click()}>
        {occupe ? "Envoi…" : "📷 Prendre une photo"}
      </button>
      <button type="button" className="sim-cta sim-cta--doux" disabled={occupe}
        onClick={() => pelliculeRef.current?.click()}>
        🖼️ Choisir dans mes photos
      </button>

      {occupe && <p className="sim-attente" role="status" aria-live="polite">Envoi de la photo…</p>}
    </div>
  );
}
