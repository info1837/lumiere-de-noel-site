// Relais : le navigateur → ici → le CRM.
//
// Le site n'appelle JAMAIS la route de génération directement depuis le
// navigateur : la clé d'intake resterait lisible dans le JavaScript public,
// et n'importe qui pourrait brûler le plafond quotidien de Yahir.
//
// Même motif que app/api/lead/route.js, avec une différence : le corps porte
// une photo. On la borne ICI aussi, pour que le CRM ne reçoive jamais un
// corps de 40 Mo qu'il devrait décoder avant de le refuser.

// Surchargeable pour tester une préversion du CRM avant de la fusionner.
// En production la variable n'existe pas et la valeur par défaut s'applique.
const CRM_BASE = (process.env.CRM_BASE_URL || 'https://palencia-crm.vercel.app').replace(/\/$/, '');
const CRM_URL = `${CRM_BASE}/api/public/lumiere/simulateur`;

// 11 Mo de base64 ≈ 8 Mo d'image, la borne du CRM. On refuse au-dessus sans
// même appeler : un aller-retour inutile est un aller-retour qui échoue plus
// lentement.
const CORPS_MAX = 11 * 1024 * 1024;

const json = (d, s = 200) => Response.json(d, { status: s });

export async function POST(request) {
  const cle = process.env.LUMIERE_INTAKE_KEY;
  if (!cle) {
    // Échec BRUYANT côté serveur, message doux côté visiteur : la fiche
    // existe déjà, donc Yahir peut rappeler même si la simulation rate.
    console.error('[simulateur] LUMIERE_INTAKE_KEY absente — génération impossible');
    return json({ ok: false, raison: 'non_configure',
      message: 'Notre simulateur est momentanément indisponible. Yahir vous envoie votre simulation par texto sous peu.' });
  }

  let corps;
  try { corps = await request.json(); } catch { return json({ ok: false, raison: 'corps_illisible' }, 400); }

  const photo = typeof corps?.photo === 'string' ? corps.photo : '';
  if (photo.length > CORPS_MAX) {
    return json({ ok: false, raison: 'photo_trop_grosse',
      message: 'Cette photo est trop lourde. Reprenez-la ou choisissez-en une plus légère.' });
  }

  try {
    const r = await fetch(CRM_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-intake-key': cle },
      // Liste blanche : on ne relaie QUE ce que la route attend. Relayer le
      // corps tel quel laisserait passer un champ qu'on ajouterait plus tard
      // au formulaire sans y penser.
      body: JSON.stringify({
        leadId: String(corps?.leadId ?? '').slice(0, 64),
        telephone: String(corps?.telephone ?? '').slice(0, 40),
        style: String(corps?.style ?? '').slice(0, 20),
        arbres: corps?.arbres === true,
        etages: String(corps?.etages ?? '').slice(0, 4),
        photo,
      }),
    });
    const j = await r.json().catch(() => ({}));
    // On rend TOUJOURS 200 au navigateur : la page sait lire `ok` et
    // `message`, et un 502 lui ferait afficher une erreur technique.
    return json(j);
  } catch (e) {
    console.error('[simulateur] CRM injoignable :', e?.message);
    return json({ ok: false, raison: 'reseau',
      message: 'Quelque chose a bloqué de notre côté. Yahir vous envoie votre simulation par texto sous peu.' });
  }
}
