// Suggestions d'adresses — Places Autocomplete, côté SERVEUR.
//
// ⚠️ POURQUOI UN RELAIS PLUTÔT QUE LE WIDGET GOOGLE.
//
// Le widget `google.maps.places.Autocomplete` tourne dans le navigateur et
// exige donc une clé publique. La calculatrice de toiture en a déjà une
// (`NEXT_PUBLIC_GOOGLE_MAPS_KEY`) parce qu'elle dessine une vraie carte :
// là, il n'y a pas le choix. Ici, on n'a besoin que d'une liste de chaînes
// de caractères — alors la clé reste au serveur, et c'est une clé distincte
// (`GOOGLE_MAPS_KEY`, sans NEXT_PUBLIC_) qui peut être restreinte à cette
// seule API. Une clé qui ne sort pas du serveur ne peut pas être recopiée
// depuis le bundle pour faire grimper la facture de quelqu'un d'autre.
//
// ⚠️ AUCUNE IMAGERIE GOOGLE N'EST DEMANDÉE ICI, ET C'EST VOLONTAIRE.
//
// Le simulateur prend la photo de façade chez le VISITEUR, jamais chez
// Street View. Les conditions de Google Maps Platform §3.2.3(a) interdisent
// de réhéberger son imagerie hors de ses services, et §3.2.3(c) d'en
// dériver du contenu — or une façade passée dans un générateur d'images est
// exactement du contenu dérivé. L'autocomplétion d'adresse, elle, est un
// usage prévu : du texte, rendu tel quel, sans stockage.
//
// Québec seulement : un visiteur de Toronto qui tape « 100 Main » ne doit
// pas voir sa rue proposée par une entreprise qui dessert la Rive-Nord.

const PLACES = 'https://places.googleapis.com/v1/places:autocomplete';

// Biais géographique : le Grand Montréal. `locationBias` ne FILTRE pas, il
// ordonne — le filtre dur, c'est `includedRegionCodes` plus le tri sur
// « QC » ci-dessous.
const CENTRE = { latitude: 45.6722, longitude: -73.8736 };
const RAYON_M = 90000; // ~90 km : Rive-Nord, Montréal, Rive-Sud

const json = (d, s = 200) => Response.json(d, {
  status: s,
  headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
});

export async function GET(request) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim();

  // Moins de 4 caractères, ça ne vaut pas un appel facturé.
  if (q.length < 4) return json({ ok: true, suggestions: [] });

  const cle = process.env.GOOGLE_MAPS_KEY || process.env.GOOGLE_PLACES_KEY;
  if (!cle) {
    // ⚠️ ÉCHEC DOUX, ET C'EST ESSENTIEL.
    //
    // Sans clé, le champ d'adresse doit rester un champ de texte ordinaire
    // dans lequel on peut écrire et continuer. Rendre une erreur bloquerait
    // la première étape du simulateur sur une variable d'environnement
    // absente — et `LUMIERE_INTAKE_KEY` a déjà appris au dépôt ce que ça
    // coûte (sur une préversion, la calculatrice semblait brisée).
    return json({ ok: true, suggestions: [], raison: 'sans_cle' });
  }

  try {
    const r = await fetch(PLACES, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Goog-Api-Key': cle,
        // On ne demande QUE ce qu'on affiche : Google facture par champ.
        'X-Goog-FieldMask': 'suggestions.placePrediction.text,suggestions.placePrediction.placeId',
      },
      body: JSON.stringify({
        input: q,
        includedRegionCodes: ['ca'],
        // Des adresses, pas des commerces ni des villes : le simulateur
        // veut une façade précise.
        includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
        languageCode: 'fr-CA',
        locationBias: { circle: { center: CENTRE, radius: RAYON_M } },
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (!r.ok) {
      // On n'expose pas le détail de l'erreur Google au navigateur : il
      // peut contenir le nom du projet et l'état de la facturation.
      console.error('[adresse] Places a répondu', r.status, (await r.text()).slice(0, 300));
      return json({ ok: true, suggestions: [], raison: 'amont' });
    }

    const d = await r.json();
    const suggestions = (d.suggestions || [])
      .map((s) => s.placePrediction)
      .filter(Boolean)
      .map((p) => ({ texte: p.text?.text || '', placeId: p.placeId || '' }))
      // ⚠️ LE FILTRE QUÉBEC, fait ici et pas par Google : l'API borne au
      // pays, pas à la province. On garde ce qui porte « QC » (le format
      // canadien de Google : « 123 rue X, Blainville, QC J7C 1A1 »).
      .filter((s) => /,\s*QC\b/.test(s.texte) || /\bQu[ée]bec\b/i.test(s.texte))
      .slice(0, 5);

    return json({ ok: true, suggestions });
  } catch (e) {
    console.error('[adresse] Places injoignable :', e?.message);
    return json({ ok: true, suggestions: [], raison: 'reseau' });
  }
}
