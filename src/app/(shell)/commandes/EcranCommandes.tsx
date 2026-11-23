"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { CarteProduitActif } from "@/components/space/CarteProduitActif";
import { CarteCommandePartenaire } from "@/components/operations/CarteCommandePartenaire";
import { ChevronLeftIcon } from "@/components/icons";
import { BUCKETS_COMMANDE, type BucketCommande } from "@/lib/statuts";
import type { CommandeCarte, ProduitActif, ReponseCommandesPartenaire } from "@/lib/types";

/**
 * "Centre des commandes" — même écran que l'app Fournisseur
 * (commandes/EcranCommandes.tsx) : "Chat & commandes" (un fil par produit
 * commandé) et "Commandes uniquement" (5 buckets de statut), sur les
 * commandes du partenaire (GET /partenaire/produits-actifs, /partenaire/commandes).
 */
export function EcranCommandes() {
  const { token } = useAuth();
  const router = useRouter();

  const [produits, setProduits] = useState<ProduitActif[] | null>(null);
  const [onglet, setOnglet] = useState<"chat" | "commandes">("chat");
  const [bucketActif, setBucketActif] = useState<BucketCommande>("nouvelle");
  const [commandes, setCommandes] = useState<CommandeCarte[]>([]);
  const [compteurs, setCompteurs] = useState<ReponseCommandesPartenaire["compteurs"] | null>(null);
  const [chargementCommandes, setChargementCommandes] = useState(true);

  useEffect(() => {
    if (!token) return;
    let annule = false;
    apiFetch<ProduitActif[]>("/partenaire/produits-actifs", { token })
      .then((p) => {
        if (!annule) setProduits(p);
      })
      .catch(() => {
        if (!annule) setProduits([]);
      });
    return () => {
      annule = true;
    };
  }, [token]);

  // Compteurs des buckets dès l'arrivée sur l'écran (en-tête), puis la liste du bucket choisi.
  useEffect(() => {
    if (!token) return;
    let annule = false;
    const statuts = BUCKETS_COMMANDE.find((b) => b.id === bucketActif)?.statuts.join(",") ?? "";

    apiFetch<ReponseCommandesPartenaire>(`/partenaire/commandes?statut=${statuts}`, { token })
      .then((reponse) => {
        if (annule) return;
        setCommandes(reponse.commandes.data);
        setCompteurs(reponse.compteurs);
      })
      .catch(() => {
        if (!annule) setCommandes([]);
      })
      .finally(() => {
        if (!annule) setChargementCommandes(false);
      });

    return () => {
      annule = true;
    };
  }, [token, bucketActif]);

  const totalCommandes = compteurs ? Object.values(compteurs).reduce((a, b) => a + b, 0) : null;

  return (
    <div>
      {/* Fond blanc dès le haut de l'écran : le header (coins arrondis) est
          posé dessus, sans bande grise entre le header et le fond blanc. */}
      <div className="shrink-0 bg-white pb-3">
      <div className="bg-gradient-espace relative rounded-b-[22px] px-4 pb-5 pt-6 text-white">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => router.back()} aria-label="Retour" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-base font-extrabold uppercase tracking-wide">Centre des commandes</p>
            <p className="mt-0.5 truncate text-xs text-white/80">
              {produits && totalCommandes !== null ? `${produits.length} Produits · ${totalCommandes} Commandes` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-3 flex items-center gap-1 rounded-full bg-white p-1" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
        <button
          type="button"
          onClick={() => setOnglet("chat")}
          className={`flex-1 rounded-full py-2 text-center text-sm font-bold transition-colors ${onglet === "chat" ? "bg-gradient-espace text-white" : "text-brand-muted"}`}
        >
          Chat & commandes
        </button>
        <button
          type="button"
          onClick={() => setOnglet("commandes")}
          className={`flex-1 rounded-full py-2 text-center text-sm font-bold transition-colors ${onglet === "commandes" ? "bg-gradient-espace text-white" : "text-brand-muted"}`}
        >
          Commandes uniquement
        </button>
      </div>
      </div>

      {/* Ligne de séparation sur toute la largeur de l'écran. */}
      <div className="h-px w-full shrink-0 bg-brand-line" />

      {onglet === "chat" ? (
        <div className="flex flex-col gap-2.5 px-4 pb-6 pt-4">
          {produits === null ? (
            <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>
          ) : produits.length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-muted">Aucune activité pour l&apos;instant.</p>
          ) : (
            produits.map((produit) => <CarteProduitActif key={produit.produit_id} produit={produit} />)
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto px-4 pb-1 pt-3">
            {BUCKETS_COMMANDE.map((bucket) => (
              <button
                key={bucket.id}
                type="button"
                onClick={() => setBucketActif(bucket.id)}
                className={`h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${
                  bucketActif === bucket.id ? "bg-gradient-espace text-white" : "bg-[#F5F7FA] text-brand-ink"
                }`}
              >
                {compteurs?.[bucket.id] ?? 0} {bucket.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 px-4 pb-6 pt-3">
            {chargementCommandes ? (
              <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>
            ) : commandes.length === 0 ? (
              <p className="py-6 text-center text-sm text-brand-muted">Aucune commande dans cette catégorie.</p>
            ) : (
              commandes.map((carte) => <CarteCommandePartenaire key={carte.commande_id} carte={carte} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}
