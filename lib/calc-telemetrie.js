// Émetteur côté navigateur pour /api/calc-telemetry.
//
// Ne lève jamais et n'attend jamais : un rapporteur d'erreur qui casse la
// page, ou qui la fait patienter, serait pire que l'erreur qu'il rapporte.
// La ville est extraite de l'adresse saisie — on n'envoie jamais le numéro
// civique, le nom ni le téléphone.
let dernierEnvoi = 0;

export function villeSeulement(adresse) {
  if (typeof adresse !== "string" || !adresse.trim()) return "";
  const bouts = adresse.split(",").map((x) => x.trim()).filter(Boolean);
  return (bouts.length > 1 ? bouts[bouts.length - 1] : bouts[0] || "").slice(0, 60);
}

export function signalerPanne(etape, message, { adresse = "" } = {}) {
  if (typeof window === "undefined") return;
  // Garde-fou côté client, en plus de celui du serveur.
  const now = Date.now();
  if (now - dernierEnvoi < 60_000) return;
  dernierEnvoi = now;
  try {
    const charge = JSON.stringify({
      step: etape,
      message: String(message || "").slice(0, 400),
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      city: villeSeulement(adresse),
      timestamp: new Date().toISOString(),
    });
    // sendBeacon survit à une navigation ou à une fermeture d'onglet.
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/calc-telemetry", new Blob([charge], { type: "application/json" }));
      return;
    }
    fetch("/api/calc-telemetry", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: charge, keepalive: true,
    }).catch(() => {});
  } catch { /* jamais bruyant */ }
}
