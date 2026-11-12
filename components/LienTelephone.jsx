import { company } from "@/components/data";

// Le lien téléphone du site (2026-11-11, demande de Yahir).
//
// Affiché en lettres (company.phoneVanity : N-O-E-L = 6-6-3-5 au clavier), mais
// le lien compose TOUJOURS les chiffres (company.phoneHref) et un lecteur
// d'écran lit un vrai numéro (aria-label avec les chiffres). Les chiffres
// restent seuls là où ils comptent : JSON-LD, balises meta, phrases sans
// lien. Le pied de page et les textes légaux montrent les deux.
// Garde : scripts/check-telephone.mjs.
export default function LienTelephone({ children, libelle = company.phoneAria, className, style, tabIndex }) {
  return (
    <a href={company.phoneHref} aria-label={libelle} className={className} style={style} tabIndex={tabIndex}>
      {children ?? company.phoneVanity}
    </a>
  );
}
