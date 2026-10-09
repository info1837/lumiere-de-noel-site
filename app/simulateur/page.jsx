import Simulateur from "./Simulateur";

export const metadata = {
  title: "Voyez votre maison illuminée",
  description:
    "Envoyez une photo de votre façade et voyez votre maison illuminée en moins d'une minute. Rive-Nord, Montréal, Rive-Sud.",
  alternates: { canonical: "https://lumieredenoelinc.com/simulateur" },
  // Les simulations sont privées. La PAGE s'indexe (c'est une porte
  // d'entrée de campagne) ; les images, elles, sont servies par une route
  // qui pose X-Robots-Tag: noindex.
  openGraph: {
    title: "Voyez votre maison illuminée",
    description: "Une photo, et vous voyez le résultat avant de décider.",
    url: "https://lumieredenoelinc.com/simulateur",
  },
};

export default function PageSimulateur() {
  return (
    <main id="contenu">
      <section className="section-y-moyen" style={{ background: "#0A1524" }}>
        <div className="container" style={{ maxWidth: 560 }}>
          <Simulateur />
        </div>
      </section>
    </main>
  );
}
