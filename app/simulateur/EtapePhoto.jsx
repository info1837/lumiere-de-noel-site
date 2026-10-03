"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { preparerPhoto, estUnMobile } from "@/lib/photo-maison";

// ── L'écran 2 du simulateur : « une photo de votre façade » ────────────────
//
// Il n'a pas la même forme selon où on est, parce que le problème n'est pas le
// même :
//
//   SUR UN TÉLÉPHONE, l'appareil photo est dans la main. Deux boutons : le
//   prendre maintenant, ou aller la chercher dans la pellicule.
//
//   SUR UN ORDINATEUR, la photo de la façade n'est presque jamais sur le
//   disque — elle est sur le téléphone. C'est LA raison d'abandon de cet
//   écran. On garde le téléversement, et on ajoute à côté un code QR : on
//   scanne, on prend la photo dehors, et cet écran-ci avance tout seul.
//
// ⚠️ Deux entrées <input> séparées, et non une seule dont on retirerait
// l'attribut `capture`. La version précédente faisait
// `ref.removeAttribute("capture")` : l'attribut ne revenait jamais, donc après
// un passage par « téléverser », le bouton « prendre une photo » n'ouvrait
// plus l'appareil. Un attribut muté est un état caché.

const SONDAGE_MS = 2000;

export default function EtapePhoto({ leadId, telephone, onPhoto, setErreur }) {
  // `null` = on ne sait pas encore. La détection a besoin de `window`, donc
  // elle vit dans un effet ; afficher l'une des deux formes avant de savoir
  // provoquerait un saut visible et casserait l'hydratation.
  const [mobile, setMobile] = useState(null);
  const [relais, setRelais] = useState(null);
  // inactif | demande | attente | expire | indisponible
  const [etatRelais, setEtatRelais] = useState("inactif");
  const [noteRelais, setNoteRelais] = useState("");
  const [glisse, setGlisse] = useState(false);
  const [occupe, setOccupe] = useState(false);
  // Minutes de validité restantes. Affichées plutôt qu'un point qui pulse :
  // la règle « aucune animation permanente » tient, et un décompte dit quelque
  // chose d'utile — combien de temps il reste pour sortir photographier.
  const [minutes, setMinutes] = useState(null);

  const appareilRef = useRef(null);
  const pelliculeRef = useRef(null);
  const disqueRef = useRef(null);
  // Garde-fou : la photo ne se ramasse qu'UNE fois, même si deux sondages se
  // croisent ou si React remonte l'effet en développement.
  const ramasseRef = useRef(false);

  useEffect(() => { setMobile(estUnMobile()); }, []);

  // ── Un fichier choisi, d'où qu'il vienne ─────────────────────────────────
  const prendreFichier = useCallback(async (fichier) => {
    if (!fichier) return;
    setErreur(""); setOccupe(true);
    const prete = await preparerPhoto(fichier);
    setOccupe(false);
    if (!prete.ok) { setErreur(prete.message); return; }
    onPhoto(prete.dataUrl);
  }, [onPhoto, setErreur]);

  const surChoix = useCallback((e) => {
    const f = e.target.files?.[0];
    // On vide la valeur : sans ça, rechoisir LE MÊME fichier après une erreur
    // ne déclenche aucun `change` et le bouton semble mort.
    e.target.value = "";
    prendreFichier(f);
  }, [prendreFichier]);

  // ── Demander un code ─────────────────────────────────────────────────────
  const demanderCode = useCallback(async () => {
    ramasseRef.current = false;
    setEtatRelais("demande"); setNoteRelais("");
    try {
      const r = await fetch("/api/simulateur/relais", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, telephone }),
      });
      const j = await r.json();
      if (!j?.ok || !j?.code) {
        setEtatRelais("indisponible");
        setNoteRelais(j?.message || "Le transfert depuis le cellulaire est indisponible.");
        return;
      }
      setRelais(j); setEtatRelais("attente");
    } catch {
      setEtatRelais("indisponible");
      setNoteRelais("Le transfert depuis le cellulaire est indisponible.");
    }
  }, [leadId, telephone]);

  // Sur ordinateur, le code est demandé dès l'arrivée sur l'écran : un QR
  // qu'il faut d'abord réclamer en cliquant est un QR que personne ne voit.
  useEffect(() => {
    if (mobile === false && etatRelais === "inactif") demanderCode();
  }, [mobile, etatRelais, demanderCode]);

  // ── Ramasser la photo quand elle arrive ──────────────────────────────────
  const ramasser = useCallback(async (code) => {
    if (ramasseRef.current) return;
    ramasseRef.current = true;
    try {
      const r = await fetch(`/api/simulateur/relais/photo?code=${encodeURIComponent(code)}`, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const blob = await r.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const lecteur = new FileReader();
        lecteur.onload = () => resolve(lecteur.result);
        lecteur.onerror = reject;
        lecteur.readAsDataURL(blob);
      });
      // Déjà redimensionnée et remise droite par le téléphone : on ne la
      // repasse pas au canvas, ce serait une seconde perte de qualité.
      onPhoto(dataUrl);
    } catch {
      ramasseRef.current = false;
      setErreur("La photo est arrivée mais nous n'avons pas pu la charger. Réessayez, ou téléversez-la depuis cet ordinateur.");
    }
  }, [onPhoto, setErreur]);

  // ── Le sondage ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (etatRelais !== "attente" || !relais?.code) return;
    let vivant = true;

    const voir = async () => {
      // L'expiration est aussi vérifiée côté client : inutile d'interroger le
      // serveur pour apprendre une heure qu'on connaît déjà.
      if (relais.expire_a) {
        const reste = Date.parse(relais.expire_a) - Date.now();
        if (reste <= 0) { if (vivant) setEtatRelais("expire"); return; }
        if (vivant) setMinutes(Math.ceil(reste / 60000));
      }
      try {
        const r = await fetch(`/api/simulateur/relais?code=${encodeURIComponent(relais.code)}`, { cache: "no-store" });
        const j = await r.json();
        if (!vivant) return;
        if (j?.etat === "prete" || j?.etat === "utilise") { await ramasser(relais.code); return; }
        if (j?.etat === "expire" || j?.etat === "inconnu") setEtatRelais("expire");
      } catch {
        // Un sondage raté ne change rien : le suivant arrive dans deux
        // secondes. Afficher une erreur à chaque hoquet rendrait l'écran
        // nerveux pour rien.
      }
    };

    const horloge = setInterval(voir, SONDAGE_MS);
    voir();
    return () => { vivant = false; clearInterval(horloge); };
  }, [etatRelais, relais, ramasser]);

  // ── Les conseils, communs aux deux formes ────────────────────────────────
  const conseils = (
    <ul className="sim-conseils">
      <li>De face, toute la maison dans le cadre</li>
      <li>De jour — on s&apos;occupe de la nuit</li>
      <li>Reculez de quelques pas si besoin</li>
    </ul>
  );

  const entrees = (
    <>
      <input ref={appareilRef} type="file" accept="image/*" capture="environment"
        onChange={surChoix} className="sim-miel" id="sim-photo-appareil" tabIndex={-1} />
      <input ref={pelliculeRef} type="file" accept="image/*"
        onChange={surChoix} className="sim-miel" id="sim-photo-pellicule" tabIndex={-1} />
      <input ref={disqueRef} type="file" accept="image/*"
        onChange={surChoix} className="sim-miel" id="sim-photo-disque" tabIndex={-1} />
    </>
  );

  return (
    <div>
      <h2 className="sim-titre">Une photo de votre façade</h2>
      {conseils}
      {/* L'erreur est affichée par Simulateur.jsx, en haut de l'écran : une
          seconde copie ici la dédoublerait sur ce seul écran. */}
      {entrees}

      {/* Tant que la détection n'a pas tourné, on n'affiche aucun bouton :
          deux secondes d'un bouton inadapté valent moins qu'un instant vide. */}
      {mobile === null && <p className="sim-attente">Un instant…</p>}

      {mobile === true && (
        <>
          <button type="button" className="sim-cta" disabled={occupe}
            onClick={() => appareilRef.current?.click()}>
            {occupe ? "Lecture…" : "📷 Prendre une photo"}
          </button>
          <button type="button" className="sim-cta sim-cta--doux" disabled={occupe}
            onClick={() => pelliculeRef.current?.click()}>
            🖼️ Choisir dans mes photos
          </button>
        </>
      )}

      {mobile === false && (
        <div className="sim-deux-voies">
          <div
            className={`sim-depot${glisse ? " glisse" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setGlisse(true); }}
            onDragLeave={() => setGlisse(false)}
            onDrop={(e) => {
              e.preventDefault(); setGlisse(false);
              prendreFichier(e.dataTransfer?.files?.[0]);
            }}
          >
            <p className="sim-depot-titre">Glissez la photo ici</p>
            <p className="sim-depot-ou">ou</p>
            <button type="button" className="sim-cta" disabled={occupe}
              onClick={() => disqueRef.current?.click()}>
              {occupe ? "Lecture…" : "Choisir un fichier"}
            </button>
          </div>

          <div className="sim-qr">
            <p className="sim-qr-titre">Pas de photo sur l&apos;ordinateur&nbsp;?<br />Prenez-la avec votre cellulaire</p>

            {etatRelais === "demande" && <p className="sim-qr-note">Préparation du code…</p>}

            {etatRelais === "attente" && relais && (
              <>
                {relais.qr
                  ? <div className="sim-qr-image" aria-label="Code QR à scanner avec votre téléphone"
                      dangerouslySetInnerHTML={{ __html: relais.qr }} />
                  : <p className="sim-qr-note">Le code n&apos;a pas pu être dessiné — utilisez le lien ci-dessous.</p>}
                <p className="sim-qr-attente" role="status" aria-live="polite">
                  <span className="sim-qr-point" aria-hidden="true" />
                  En attente de la photo…
                  {minutes !== null && <span className="sim-qr-reste"> le code expire dans {minutes} min</span>}
                </p>
                {/* Pour qui préfère taper plutôt que scanner. */}
                <p className="sim-qr-lien">
                  ou tapez&nbsp;:{" "}
                  <strong><span>{relais.lienHote}</span><span>{relais.lienChemin}</span></strong>
                </p>
              </>
            )}

            {etatRelais === "expire" && (
              <>
                <p className="sim-qr-note">Ce code a expiré.</p>
                <button type="button" className="sim-lien" onClick={demanderCode}>
                  Générer un nouveau code
                </button>
              </>
            )}

            {etatRelais === "indisponible" && (
              <>
                <p className="sim-qr-note">{noteRelais}</p>
                <button type="button" className="sim-lien" onClick={demanderCode}>Réessayer</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
