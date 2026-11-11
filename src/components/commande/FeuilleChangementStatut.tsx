"use client";

import { useState } from "react";
import { ChevronLeftIcon } from "@/components/icons";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { DEGRADE_STATUT, LIBELLES_STATUT } from "@/lib/statuts";

const BOUTONS_PRINCIPAUX: { statut: string; label: string }[] = [
  { statut: "validee", label: "Commande validée" },
  { statut: "en_livraison", label: "Livraison en cours" },
  { statut: "en_attente", label: "Commande en attente" },
  { statut: "reportee", label: "Commande reportée" },
  { statut: "livree", label: "Commande Terminée" },
  { statut: "annulee", label: "Commande Annulée" },
];

const BOUTONS_PROBLEME = ["client_injoignable", "numero_incorrect"];

function messageErreur(e: unknown): string {
  if (e instanceof ApiRequestError) {
    const premier = e.fields ? Object.values(e.fields)[0]?.[0] : undefined;
    return premier ?? e.message;
  }
  return "Une erreur est survenue, réessayez.";
}

/**
 * Feuille de changement de statut — même feuille que l'Espace Coordinateur,
 * sans "Envoyer à un livreur" (le partenaire livre lui-même). Le backend
 * sort le stock à la validation (refus si stock insuffisant) et le remet à
 * l'annulation, qui demande un motif (POST /partenaire/commandes/{id}/statut).
 */
export function FeuilleChangementStatut({
  commandeId,
  token,
  onFermer,
  onApplique,
}: {
  commandeId: number;
  token: string;
  onFermer: () => void;
  onApplique: () => void;
}) {
  const [vue, setVue] = useState<"statuts" | "annulation">("statuts");
  const [motif, setMotif] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function changerStatut(statut: string, motifAnnulation?: string) {
    if (enCours) return;
    setErreur(null);
    setEnCours(true);
    try {
      await apiFetch(`/partenaire/commandes/${commandeId}/statut`, {
        method: "POST",
        token,
        body: { statut_commande: statut, ...(motifAnnulation ? { motif: motifAnnulation } : {}) },
      });
      onApplique();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onFermer}>
      <div className="w-full max-w-md rounded-t-3xl bg-white pb-6 pt-3" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />

        {vue === "annulation" ? (
          <div className="px-4">
            <button type="button" onClick={() => setVue("statuts")} className="mb-3 flex items-center gap-1 text-sm font-semibold text-brand-ink">
              <ChevronLeftIcon className="h-4 w-4" /> Retour
            </button>
            <label htmlFor="motif-annulation" className="text-sm font-bold text-brand-ink">
              Motif de l&apos;annulation
            </label>
            <textarea
              id="motif-annulation"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Ex. le client a changé d'avis"
              className="mt-2 w-full rounded-2xl border border-brand-line bg-[#F5F7FA] px-4 py-3 text-sm text-brand-ink outline-none focus:border-[color:var(--brand-blue-end)]"
            />
            <button
              type="button"
              disabled={enCours || motif.trim().length === 0}
              onClick={() => changerStatut("annulee", motif.trim())}
              style={{ background: DEGRADE_STATUT.annulee }}
              className="mt-3 w-full rounded-full py-3 text-xl font-medium leading-none text-white disabled:opacity-50"
            >
              Confirmer l&apos;annulation
            </button>
          </div>
        ) : (
          <div className="space-y-3 px-4">
            {BOUTONS_PRINCIPAUX.map(({ statut, label }) => (
              <button
                key={statut}
                type="button"
                disabled={enCours}
                onClick={() => (statut === "annulee" ? setVue("annulation") : changerStatut(statut))}
                style={{ background: DEGRADE_STATUT[statut] }}
                className="w-full rounded-full py-3 text-xl font-medium leading-none text-white disabled:opacity-50"
              >
                {label}
              </button>
            ))}

            <div className="border-t border-brand-line pt-3" />

            {BOUTONS_PROBLEME.map((statut) => (
              <button
                key={statut}
                type="button"
                disabled={enCours}
                onClick={() => changerStatut(statut)}
                style={{ background: DEGRADE_STATUT[statut] }}
                className="w-full rounded-full py-3 text-xl font-medium leading-none text-white disabled:opacity-50"
              >
                {LIBELLES_STATUT[statut]}
              </button>
            ))}
          </div>
        )}

        {erreur ? <p className="mt-3 px-4 text-center text-xs text-rose-500">{erreur}</p> : null}
      </div>
    </div>
  );
}
