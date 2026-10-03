"use client";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { company, sendLeadEtRendreId, HONEYPOT_FIELD } from "@/components/data";
import { CaseConsentement } from "@/components/ConsentementAttribution";
import { newLeadEventId, metaPixelBlock, trackLead } from "@/lib/meta-lead-event";

// ⚠️ LA PHOTO VIENT DU CLIENT, JAMAIS DE STREET VIEW.
// Google Maps Platform §3.2.3(c) interdit de créer du contenu à partir de
// son imagerie, et §3.2.3(a) d'en réhéberger hors de ses services. Un
// concurrent le fait ; ça ne nous autorise pas. La seule entrée d'image
// ici est <input type="file">.

const STYLES = [
  { cle: "chaud", titre: "Blanc chaud", detail: "2700 K · le classique" },
  { cle: "froid", titre: "Blanc froid", detail: "6500 K · net et moderne" },
  { cle: "multi", titre: "Multicolore", detail: "rouge, vert, bleu, ambre" },
];

// 1280 px de large suffisent au modèle (mesuré) et ramènent une photo de
// téléphone de 4 Mo à ~500 Ko. Sans ça, le base64 dépasse la limite de
// corps de Vercel et l'envoi échoue APRÈS que le visiteur ait attendu.
const LARGEUR_MAX = 1280;

async function redimensionner(fichier) {
  const bitmap = await createImageBitmap(fichier);
  const ratio = Math.min(1, LARGEUR_MAX / bitmap.width);
  const l = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const toile = document.createElement("canvas");
  toile.width = l; toile.height = h;
  toile.getContext("2d").drawImage(bitmap, 0, 0, l, h);
  bitmap.close?.();
  return toile.toDataURL("image/jpeg", 0.85);
}

export default function Simulateur() {
  const [etape, setEtape] = useState(1);
  const [coord, setCoord] = useState({ nom: "", telephone: "", adresse: "", consent: false, [HONEYPOT_FIELD]: "" });
  const [erreur, setErreur] = useState("");
  const [leadId, setLeadId] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [choix, setChoix] = useState({ style: "chaud", arbres: false, etages: "1" });
  const [avance, setAvance] = useState(0);
  const [resultat, setResultat] = useState(null);
  const [curseur, setCurseur] = useState(50);
  const fichierRef = useRef(null);

  // ── Écran 1 : les coordonnées, et le lead existe ───────────────────
  // Créé AVANT la photo, à dessein : quelqu'un qui abandonne à l'écran 2
  // est quand même un lead que Yahir peut rappeler.
  const envoyerCoordonnees = async (e) => {
    e.preventDefault();
    if (!coord.nom.trim() || !coord.telephone.trim()) { setErreur("Votre prénom et votre téléphone, s'il vous plaît."); return; }
    if (!coord.consent) { setErreur("Il nous faut votre accord pour vous répondre."); return; }
    setErreur(""); setEtape(1.5);
    const eventId = newLeadEventId();
    const { ok, id } = await sendLeadEtRendreId({
      subject: "Nouveau lead — Simulateur",
      meta_pixel: metaPixelBlock(eventId),
      source: "Simulateur",
      consentement: `accordé le ${new Date().toISOString().slice(0, 10)} via le simulateur`,
      nom: coord.nom, telephone: coord.telephone, adresse: coord.adresse,
      service: "Lumière de Noël (résidentiel)",
      [HONEYPOT_FIELD]: coord[HONEYPOT_FIELD],
    });
    await trackLead(eventId);
    if (!ok || !id) {
      // La fiche est peut-être passée quand même ; on ne bloque pas le
      // visiteur sur un détail d'infrastructure.
      setErreur("On a bien reçu vos coordonnées. La simulation, elle, n'est pas disponible pour le moment — Yahir vous écrit sous peu.");
      setEtape(1); return;
    }
    setLeadId(id); setEtape(2);
  };

  const choisirPhoto = useCallback(async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setErreur("");
    try { setPhoto(await redimensionner(f)); setEtape(3); }
    catch { setErreur("Nous n'arrivons pas à lire cette image. Essayez une photo JPEG ou PNG."); }
  }, []);

  // ── Écran 3 → 4 : la génération ────────────────────────────────────
  const generer = async () => {
    setEtape(3.5); setAvance(5);
    // Une progression HONNÊTE : elle avance vite au début, ralentit, et
    // ne franchit jamais 92 % tant que l'image n'est pas là. Une barre qui
    // atteint 100 % avant le résultat ment deux fois.
    const horloge = setInterval(() => setAvance((v) => (v < 92 ? v + Math.max(1, Math.round((92 - v) / 14)) : v)), 450);
    try {
      const r = await fetch("/api/simulateur", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, telephone: coord.telephone, ...choix, photo }),
      });
      const j = await r.json();
      clearInterval(horloge);
      if (!j.ok) { setErreur(j.message || "Yahir vous envoie votre simulation par texto sous peu."); setEtape(3); return; }
      setAvance(100); setResultat(j); setEtape(4);
    } catch {
      clearInterval(horloge);
      setErreur("Yahir vous envoie votre simulation par texto sous peu."); setEtape(3);
    }
  };

  const urlImage = (cle) => `/api/simulateur/image?cle=${encodeURIComponent(cle)}&jeton=${encodeURIComponent(resultat.jeton)}`;
  const ancrage = choix.etages === "1" ? "1 000 $" : "1 500 $";

  return (
    <div className="sim">
      <ol className="sim-fil" aria-label="Étapes">
        {["Vous", "Photo", "Style", "Résultat"].map((n, i) => (
          <li key={n} className={Math.floor(etape) > i ? "fait" : Math.floor(etape) === i + 1 ? "ici" : ""}>{n}</li>
        ))}
      </ol>

      {erreur && <p className="sim-erreur" role="alert">{erreur}</p>}

      {etape === 1 && (
        <form onSubmit={envoyerCoordonnees} noValidate data-barre-masque>
          <h1 className="sim-titre">Voyez votre maison illuminée</h1>
          <p className="sim-sous">Envoyez-nous une photo de votre façade — on vous montre le résultat en moins d&apos;une minute.</p>
          <label htmlFor="sim-nom">Prénom *</label>
          <input id="sim-nom" value={coord.nom} autoComplete="given-name"
            onChange={(e) => setCoord({ ...coord, nom: e.target.value })} placeholder="Votre prénom" />
          <label htmlFor="sim-tel">Téléphone *</label>
          <input id="sim-tel" type="tel" inputMode="tel" autoComplete="tel" value={coord.telephone}
            onChange={(e) => setCoord({ ...coord, telephone: e.target.value })} placeholder="(514) 000-0000" />
          <label htmlFor="sim-adr">Adresse</label>
          <input id="sim-adr" value={coord.adresse} autoComplete="street-address"
            onChange={(e) => setCoord({ ...coord, adresse: e.target.value })} placeholder="Rue et ville" />
          <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sim-miel"
            value={coord[HONEYPOT_FIELD]} onChange={(e) => setCoord({ ...coord, [HONEYPOT_FIELD]: e.target.value })} />
          <CaseConsentement id="sim-consent" checked={coord.consent} onChange={(v) => setCoord({ ...coord, consent: v })} />
          <button type="submit" className="sim-cta">Continuer</button>
        </form>
      )}

      {etape === 1.5 && <p className="sim-attente">Un instant…</p>}

      {etape === 2 && (
        <div>
          <h2 className="sim-titre">Une photo de votre façade</h2>
          <ul className="sim-conseils">
            <li>De face, toute la maison dans le cadre</li>
            <li>De jour — on s&apos;occupe de la nuit</li>
            <li>Reculez de quelques pas si besoin</li>
          </ul>
          <input ref={fichierRef} type="file" accept="image/*" capture="environment"
            onChange={choisirPhoto} className="sim-miel" id="sim-photo" />
          <button type="button" className="sim-cta" onClick={() => fichierRef.current?.click()}>Prendre une photo</button>
          <button type="button" className="sim-lien" onClick={() => { fichierRef.current.removeAttribute("capture"); fichierRef.current.click(); }}>
            ou téléverser une photo
          </button>
        </div>
      )}

      {etape === 3 && (
        <div>
          <h2 className="sim-titre">Votre style</h2>
          <div className="sim-styles">
            {STYLES.map((s) => (
              <button key={s.cle} type="button" onClick={() => setChoix({ ...choix, style: s.cle })}
                className={`sim-style${choix.style === s.cle ? " actif" : ""}`} aria-pressed={choix.style === s.cle}>
                <strong>{s.titre}</strong><span>{s.detail}</span>
              </button>
            ))}
          </div>
          <label className="sim-bascule">
            <input type="checkbox" checked={choix.arbres} onChange={(e) => setChoix({ ...choix, arbres: e.target.checked })} />
            Illuminer aussi les arbres
          </label>
          <label htmlFor="sim-etages">Nombre d&apos;étages</label>
          <select id="sim-etages" value={choix.etages} onChange={(e) => setChoix({ ...choix, etages: e.target.value })}>
            <option value="1">1 étage</option><option value="2">2 étages</option><option value="3">3 et plus</option>
          </select>
          <button type="button" className="sim-cta" onClick={generer}>Voir ma maison illuminée</button>
        </div>
      )}

      {etape === 3.5 && (
        <div className="sim-attente" role="status" aria-live="polite">
          <div className="sim-barre"><span style={{ width: `${avance}%` }} /></div>
          <p>{avance < 35 ? "On regarde votre toiture…" : avance < 70 ? "On allume les lignes de toit…" : "On fait tomber la nuit…"}</p>
        </div>
      )}

      {etape === 4 && resultat && (
        <div>
          <h2 className="sim-titre">Votre maison, illuminée</h2>
          <div className="sim-compare">
            <img src={urlImage(resultat.photoCle)} alt="Votre maison, de jour" />
            <div className="sim-apres" style={{ width: `${curseur}%` }}>
              <img src={urlImage(resultat.resultatCle)} alt="Votre maison, illuminée le soir" />
            </div>
            <input type="range" min="0" max="100" value={curseur} aria-label="Comparer avant et après"
              onChange={(e) => setCurseur(Number(e.target.value))} />
          </div>
          <p className="sim-prix">Projets à partir de <strong>{ancrage}</strong></p>
          <p className="sim-note">Yahir confirme votre prix exact après une courte consultation.</p>
          <Link href="/soumission" className="sim-cta">Réserver ma date</Link>
          <p className="sim-tel">ou appelez-nous : <a href={company.phoneHref}>{company.phoneDisplay}</a></p>
        </div>
      )}
    </div>
  );
}
