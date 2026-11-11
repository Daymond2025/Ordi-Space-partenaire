import type { ProduitCatalogue } from "@/lib/types";

export const LIBELLE_ETAT_PRODUIT: Record<string, string> = {
  neuf: "Neuf",
  quasi_neuf: "Quasi neuf",
  occasion: "Occasion",
  reconditionne: "Reconditionné",
};

/** "300.000" — séparateur de milliers en point (montants entiers en FCFA). */
export function formaterPrix(valeur: number | string): string {
  return `${Math.round(Number(valeur))}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** "Core i5 • 8 Go • 256 Go SSD" */
export function resumerSpecs(produit: Pick<ProduitCatalogue, "processeur" | "memoire_ram" | "stockage">): string[] {
  return [produit.processeur, produit.memoire_ram, produit.stockage].filter((v): v is string => Boolean(v));
}

/** Les 3 onglets de l'accueil du catalogue — même regroupement que la boutique. */
export function familleProduit(categorie: string | null): "ordinateurs" | "accessoires" | "logiciels" | "autre" {
  if (!categorie) return "autre";
  if (["Ordinateurs portables", "Ordinateur bureau"].includes(categorie)) return "ordinateurs";
  if (["Accessoires", "Souris", "Sacs pc", "Chargeur"].includes(categorie)) return "accessoires";
  if (categorie === "Logiciels") return "logiciels";
  return "autre";
}

/** Prix proposé au client par défaut : son prix de revente, sinon le prix Ordi'Space. */
export function prixClient(produit: ProduitCatalogue): number {
  return produit.prix_revente ?? Math.max(produit.prix_ordispace, produit.prix_cession);
}
