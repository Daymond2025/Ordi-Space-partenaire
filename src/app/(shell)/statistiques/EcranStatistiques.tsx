"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ChevronLeftIcon, MonitorIcon } from "@/components/icons";
import { SelecteurPeriode } from "@/components/space/SelecteurPeriode";
import { CarteStatistique } from "@/components/space/CarteStatistique";
import type { PeriodeEspace, ProduitPlusVendu, StatistiquesPartenaire } from "@/lib/types";
import { useRetour } from "@/lib/navigation";

function formaterPoint(valeur: number, suffixe: string): string {
  return `${Math.round(valeur).toLocaleString("en-US").replace(/,/g, ".")} ${suffixe}`;
}

function formaterVirgule(valeur: number): string {
  return `${Math.round(valeur).toLocaleString("en-US")} F`;
}

function libellePeriodePrecedente(periode: PeriodeEspace): string {
  switch (periode) {
    case "aujourd_hui":
      return "vs hier";
    case "semaine":
      return "vs semaine dernière";
    case "semaine_derniere":
      return "vs il y a 2 semaines";
    case "mois":
      return "vs mois passé";
    default:
      return "";
  }
}

function LigneProduitVendu({ produit }: { produit: ProduitPlusVendu }) {
  return (
    <div className="flex items-center gap-3 border-b border-brand-line py-3 last:border-b-0">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#F6F8FE]">
        {produit.photo ? (
          <Image src={produit.photo} alt={produit.nom_produit ?? ""} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-muted">
            <MonitorIcon className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-brand-ink">{produit.nom_produit}</p>
        <p className="text-xs text-brand-muted">
          {produit.quantite_vendue} vendu{produit.quantite_vendue > 1 ? "s" : ""}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold text-brand-ink">{formaterVirgule(produit.montant)}</span>
    </div>
  );
}

/**
 * "Statistiques" (Profil → Statistique) — même écran que le Fournisseur,
 * d'après la maquette : chiffre d'affaires + évolution vs période
 * précédente, 6 tuiles (produits vendus, commandes reçues / validées /
 * annulées / en attente, produits les plus vendus) et le classement des
 * produits les plus vendus (GET /partenaire/statistiques).
 */
export function EcranStatistiques() {
  const { token } = useAuth();
  // Retour fiable même si la page a été ouverte directement (notification, lien, appli rouverte) — voir lib/navigation.ts.
  const retour = useRetour("/profil");
  const [periode, setPeriode] = useState<PeriodeEspace>("semaine");
  const [stats, setStats] = useState<StatistiquesPartenaire | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!token) return;
    let annule = false;
    apiFetch<StatistiquesPartenaire>(`/partenaire/statistiques?periode=${periode}`, { token })
      .then((data) => {
        if (!annule) setStats(data);
      })
      .catch(() => {
        if (!annule) setStats(null);
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });
    return () => {
      annule = true;
    };
  }, [token, periode]);

  const croissance = stats?.croissance_pourcentage ?? null;
  const positive = croissance !== null && croissance >= 0;

  return (
    <div className="flex min-h-full flex-col bg-[#f2f5fa]">
      <div className="bg-white pb-4">
        <div className="bg-gradient-espace shrink-0 rounded-b-[30px] px-4 pb-14 pt-4 text-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={retour}
              aria-label="Retour"
              className="flex h-[31px] w-8 shrink-0 items-center justify-center rounded-[7px]"
              style={{ background: "rgba(255, 255, 255, 0.23)" }}
            >
              <ChevronLeftIcon className="h-[19px] w-[19px]" />
            </button>
            <p className="min-w-0 flex-1 text-lg font-extrabold leading-none">Statistiques</p>
            <SelecteurPeriode value={periode} onChange={setPeriode} />
          </div>
        </div>

        <div className="-mt-10 px-[26px]">
          <div
            className="flex flex-col items-center justify-center rounded-[24px] bg-white p-6 text-center"
            style={{ height: "140px", boxShadow: "0px 12px 12px 12px rgba(29, 99, 224, 0.08)" }}
          >
            <p className="text-sm text-brand-muted">Chiffre d&apos;Affaires</p>
            <p className="mt-1 text-[28px] font-extrabold leading-tight text-[color:var(--brand-blue-end)]">{formaterPoint(stats?.chiffre_affaires ?? 0, "F")}</p>
            {croissance !== null ? (
              <span
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                  positive ? "bg-blue-50 text-[color:var(--brand-blue-end)]" : "bg-rose-50 text-rose-500"
                }`}
              >
                {positive ? "↗" : "↘"} {positive ? "+" : ""}
                {croissance}% {libellePeriodePrecedente(periode)}
              </span>
            ) : (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#F5F7FA] px-3 py-1 text-xs font-bold text-brand-muted">
                Pas de comparaison disponible
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 justify-items-stretch gap-3 px-4">
          <CarteStatistique type="compte" couleur="blue" valeur={stats?.produits_vendus ?? 0} label="Produits vendus" labelColore />
          <CarteStatistique type="compte" couleur="orange" valeur={stats?.commandes_recues ?? 0} label="Commandes reçues" labelColore />
          <CarteStatistique type="compte" couleur="green" valeur={stats?.commandes_validees ?? 0} label="Commandes validé" labelColore />
          <CarteStatistique type="compte" couleur="rose" valeur={stats?.commandes_annulees ?? 0} label="Commandes Annulées" labelColore />
          <CarteStatistique type="compte" couleur="violet" valeur={stats?.commandes_en_attente ?? 0} label="Commandes en attentes" labelColore />
          <CarteStatistique type="compte" couleur="orange" valeur={stats?.produits_distincts_vendus ?? 0} label="Produits les plus vendus" labelColore />
        </div>

        <div className="mx-4 mt-5 border-t border-brand-line px-1 pt-3 text-sm text-brand-ink">Produit les plus vendus</div>
      </div>

      {/* Ligne de séparation sur toute la largeur de l'écran. */}
      <div className="h-px w-full shrink-0 bg-brand-line" />

      <div className="mx-4 my-5 rounded-2xl bg-white px-4" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.12)" }}>
        {chargement ? (
          <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>
        ) : (stats?.produits_plus_vendus.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-sm text-brand-muted">Aucune vente sur cette période.</p>
        ) : (
          stats?.produits_plus_vendus.map((produit) => <LigneProduitVendu key={produit.produit_id} produit={produit} />)
        )}
      </div>
    </div>
  );
}
