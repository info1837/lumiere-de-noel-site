"use client";
import { useEffect, useRef, useState } from "react";
import { mouvementReduit } from "@/lib/mouvement";

// Les réalisations défilent lentement, et s'arrêtent dès qu'on les
// regarde de près.
//
// ⚠️ C'EST UNE BOUCLE, ET LE DOSSIER LES INTERDIT.
//
// `scripts/check-rien-ne-boucle.mjs` existe parce qu'une guirlande
// clignotait sans fin sur toutes les pages : « une lumière qui clignote
// sans arrêt attire l'œil en continu — donc elle le retient sur elle, et
// pas sur le texte ». L'argument est juste, et il vaut aussi pour une
// bande de photos qui glisse.
//
// Celle-ci est une exception demandée, et elle est tenue court :
//
//   · elle ne tourne QUE quand la section est à l'écran — hors de vue,
//     le script retire la classe et l'animation s'arrête net. Une bande
//     qui défile pour personne, c'est du calcul pour personne ;
//   · elle s'arrête au survol et pendant qu'on la tire ;
//   · elle n'existe pas du tout en mouvement réduit — la bande devient
//     une simple rangée qu'on fait défiler soi-même.
//
// ⚠️ DEUX TRANSFORMATIONS, DEUX ÉLÉMENTS. L'animation vit sur la piste,
// le décalage du doigt sur le calque au-dessus. Les mettre sur le même
// élément ferait que l'un écrase l'autre à chaque frame — le geste
// « saute » alors en arrière dès qu'on relâche.
//
// ⚠️ LES CLONES SONT `aria-hidden`. La boucle n'est transparente que si
// la liste est dupliquée : il faut qu'il y ait toujours de la matière
// qui entre par la droite. Mais un lecteur d'écran n'a aucune raison
// d'entendre « Blainville, Saint-Jérôme, Montréal, Mercier » deux fois,
// et scripts/check-photos.mjs §7 ne doit pas compter ces copies comme
// une deuxième apparition de la photo.
export default function VitrineDefilante({ items = [], secondesParItem = 7 }) {
  const [anime, setAnime] = useState(false);
  const cadre = useRef(null);
  const glisse = useRef(null);
  const etat = useRef({ saisi: false, departX: 0, depart: 0, decalage: 0 });

  // L'animation ne tourne que pendant que la section est visible.
  useEffect(() => {
    if (mouvementReduit()) return;
    const el = cadre.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => setAnime(!!e[0]?.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ── Le glissement au doigt (et à la souris) ───────────────────────
  //
  // Pointer events : un seul code pour le doigt, la souris et le
  // stylet. On ne capture PAS le pointeur tant qu'il n'a pas bougé
  // horizontalement de quelques pixels, sinon on vole le défilement
  // vertical de la page — sur un téléphone, c'est la page entière qui
  // se bloque sous le doigt.
  const onPointerDown = (e) => {
    const el = cadre.current;
    if (!el) return;
    etat.current.saisi = true;
    etat.current.departX = e.clientX;
    etat.current.depart = etat.current.decalage;
    el.classList.add("saisi");
  };

  const onPointerMove = (e) => {
    const s = etat.current;
    if (!s.saisi) return;
    const d = e.clientX - s.departX;
    if (Math.abs(d) < 6) return;      // pas encore un geste horizontal
    s.decalage = s.depart + d;
    if (glisse.current) glisse.current.style.transform = `translateX(${s.decalage}px)`;
  };

  const relacher = () => {
    const s = etat.current;
    if (!s.saisi) return;
    s.saisi = false;
    cadre.current?.classList.remove("saisi");
  };

  if (!items.length) return null;

  // La piste porte la liste DEUX fois : l'original, puis des clones
  // muets pour que la boucle n'ait pas de trou.
  const carte = (p, i, clone) => (
    <figure className="defile-item" key={`${clone ? "c" : "o"}-${i}-${p.image}`}>
      <img src={p.image} alt={clone ? "" : p.alt} aria-hidden={clone || undefined} loading="lazy" />
      <figcaption aria-hidden={clone || undefined}>{p.caption}</figcaption>
    </figure>
  );

  return (
    <div
      ref={cadre}
      className={`defile${anime ? " defile--anime" : ""}`}
      style={{ "--defile-duree": `${items.length * secondesParItem * 2}s` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={relacher}
      onPointerCancel={relacher}
      onPointerLeave={relacher}
    >
      <div className="defile-glisse" ref={glisse}>
        <div className="defile-piste">
          {items.map((p, i) => carte(p, i, false))}
          {items.map((p, i) => carte(p, i, true))}
        </div>
      </div>
    </div>
  );
}
