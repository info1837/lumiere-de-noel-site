"use client";
import { useEffect, useId, useRef, useState } from "react";

// Le champ d'adresse du simulateur.
//
// ⚠️ IL DOIT MARCHER SANS SUGGESTIONS.
//
// Les propositions viennent de /api/adresse, qui garde la clé Google au
// serveur et rend une liste vide — jamais une erreur — quand la clé manque,
// quand Google tousse, ou quand l'adresse n'est pas au Québec. Ce champ est
// donc d'abord un champ de texte : on peut y écrire son adresse et
// continuer. Les suggestions sont un confort, pas un passage obligé.
//
// C'est la leçon de `LUMIERE_INTAKE_KEY` en préversion : une variable
// d'environnement absente avait rendu la calculatrice « brisée » aux yeux
// de Yahir, alors que seule une commodité manquait.
//
// Motif ARIA : combobox + listbox. Les flèches parcourent, Entrée choisit,
// Échap referme, et `aria-activedescendant` dit au lecteur d'écran laquelle
// est visée sans déplacer le focus hors du champ.
export default function AdresseAutocomplete({
  valeur,
  onChange,
  onChoisir = null,
  id = "sim-adresse",
  placeholder = "123 rue Principale, Blainville",
  autoFocus = false,
  requis = false,
  invalide = false,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [ouvert, setOuvert] = useState(false);
  const [visee, setVisee] = useState(-1);
  // `choisi` empêche le va-et-vient : sélectionner une suggestion change la
  // valeur du champ, ce qui relancerait une recherche, qui réouvrirait la
  // liste sur l'adresse qu'on vient justement de choisir.
  const choisi = useRef(false);
  const listeId = useId();

  useEffect(() => {
    if (choisi.current) { choisi.current = false; return; }
    const q = (valeur || "").trim();
    if (q.length < 4) { setSuggestions([]); setOuvert(false); return; }

    // 250 ms : on ne paie pas un appel par frappe.
    const stop = new AbortController();
    const minuteur = setTimeout(() => {
      fetch(`/api/adresse?q=${encodeURIComponent(q)}`, { signal: stop.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const s = d?.suggestions || [];
          setSuggestions(s);
          setOuvert(s.length > 0);
          setVisee(-1);
        })
        .catch(() => { /* le champ reste un champ de texte */ });
    }, 250);

    return () => { clearTimeout(minuteur); stop.abort(); };
  }, [valeur]);

  // ⚠️ LA SUGGESTION, PUIS L'ADRESSE COMPLÈTE.
  //
  // Une suggestion Places ne porte pas le code postal (« 34 Rue de
  // Vaudreuil, Blainville, QC, Canada »). On l'affiche tout de suite, puis
  // on la remplace par le détail (« …, Blainville, QC J7C 4A2 ») : c'est
  // cette version qui part au CRM. Si le détail échoue, la suggestion reste
  // — elle contient déjà la rue et la ville.
  const prendre = async (s) => {
    choisi.current = true;
    onChange(s.texte);
    setOuvert(false);
    setSuggestions([]);
    setVisee(-1);
    let detail = null;
    if (s.placeId) {
      try {
        const r = await fetch(`/api/adresse?placeId=${encodeURIComponent(s.placeId)}`);
        const d = r.ok ? await r.json() : null;
        if (d?.ok && d.adresse) detail = d;
      } catch { /* la suggestion suffit */ }
    }
    if (detail && detail.adresse !== s.texte) { choisi.current = true; onChange(detail.adresse); }
    onChoisir?.({ ...s, ...(detail || {}) });
  };

  const auClavier = (e) => {
    if (!ouvert || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setVisee((v) => (v + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setVisee((v) => (v <= 0 ? suggestions.length - 1 : v - 1));
    } else if (e.key === "Enter") {
      // Entrée ne valide le formulaire que si aucune suggestion n'est visée.
      if (visee >= 0) { e.preventDefault(); prendre(suggestions[visee]); }
    } else if (e.key === "Escape") {
      setOuvert(false);
      setVisee(-1);
    }
  };

  return (
    <div className="adresse">
      <input
        id={id}
        type="text"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={auClavier}
        /* Un flou ferme la liste, mais après le clic : sans le délai, le
           mousedown sur une suggestion la faisait disparaître avant que le
           clic ne l'atteigne. */
        onBlur={() => setTimeout(() => setOuvert(false), 140)}
        placeholder={placeholder}
        autoComplete="street-address"
        inputMode="text"
        autoFocus={autoFocus}
        required={requis || undefined}
        aria-required={requis || undefined}
        aria-invalid={invalide || undefined}
        role="combobox"
        aria-expanded={ouvert}
        aria-controls={listeId}
        aria-autocomplete="list"
        aria-activedescendant={visee >= 0 ? `${listeId}-${visee}` : undefined}
      />
      {ouvert && suggestions.length > 0 && (
        <ul className="adresse-liste" id={listeId} role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={s.placeId || s.texte}
              id={`${listeId}-${i}`}
              role="option"
              aria-selected={i === visee}
              className={i === visee ? "visee" : undefined}
              onMouseEnter={() => setVisee(i)}
              onMouseDown={(e) => { e.preventDefault(); prendre(s); }}
            >
              {s.texte}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
