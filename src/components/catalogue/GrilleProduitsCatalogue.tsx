"use client";

import { useRouter } from "next/navigation";
import { ImageIcon } from "@/components/icons";
import { LIBELLE_ETAT_PRODUIT, formaterPrix, prixClient, resumerSpecs } from "@/lib/catalogue";
import type { ProduitCatalogue } from "@/lib/types";

const COULEUR_BOUTON = "rgba(255, 151, 0, 1)";

function CarteProduit({ produit, onOuvrir }: { produit: ProduitCatalogue; onOuvrir: () => void }) {
  const specs = resumerSpecs(produit);
  const benefice = prixClient(produit) - produit.prix_cession;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
      <button type="button" onClick={onOuvrir} className="relative h-28 w-full text-left">
        {produit.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- domaine backend dynamique (dev/prod)
          <img src={produit.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#F2F5FA] text-brand-muted">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
        {produit.etat_produit ? (
          <span className="absolute left-2 top-2 rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
            {LIBELLE_ETAT_PRODUIT[produit.etat_produit] ?? produit.etat_produit}
          </span>
        ) : null}
        {/* Propre au partenaire : son stock à lui. */}
        <span
          className={`absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold text-white ${produit.stock > 0 ? "bg-[#17A34A]" : "bg-slate-400"}`}
        >
          {produit.stock > 0 ? `${produit.stock} en stock` : "Pas en stock"}
        </span>
      </button>

      <div className="flex flex-col gap-1.5 p-2.5">
        <button type="button" onClick={onOuvrir} className="text-left">
          <p className="line-clamp-2 text-xs font-extrabold leading-tight text-brand-ink">{produit.nom_produit}</p>
        </button>

        {specs.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {specs.map((spec) => (
              <span key={spec} className="rounded bg-[#F2F5FA] px-1.5 py-0.5 text-[9px] font-semibold text-brand-muted">
                {spec}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-baseline justify-between gap-1">
          <p className="text-[9px] text-brand-muted">Votre prix</p>
          <p className="text-sm font-extrabold text-brand-ink">{formaterPrix(produit.prix_cession)} CFA</p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-[#E7F8EE] px-2 py-1">
          <span className="text-[9px] font-bold text-[#15803D]">Bénéfice</span>
          <span className="text-xs font-extrabold text-[#15803D]">+{formaterPrix(benefice)} CFA</span>
        </div>

        <button
          type="button"
          onClick={onOuvrir}
          className="mt-0.5 w-full text-[11px] font-extrabold text-white"
          style={{ height: 30, borderRadius: 5, background: COULEUR_BOUTON }}
        >
          Commander
        </button>
      </div>
    </div>
  );
}

/**
 * Grille du catalogue partenaire — même carte que la marketplace/boutique,
 * mais avec SES chiffres : prix de cession ("Votre prix"), bénéfice au prix
 * de vente choisi et son stock. Taper la carte ouvre la fiche produit.
 */
// `encadre` : posée dans le rectangle blanc de la page (pas de marges propres), comme la Market Space.
export function GrilleProduitsCatalogue({ produits, encadre = false }: { produits: ProduitCatalogue[]; encadre?: boolean }) {
  const router = useRouter();

  return (
    <div className={`grid grid-cols-2 gap-3 ${encadre ? "" : "px-4 pb-24 pt-4"}`}>
      {produits.map((produit) => (
        <CarteProduit key={produit.id} produit={produit} onOuvrir={() => router.push(`/article/${produit.id}`)} />
      ))}
    </div>
  );
}
