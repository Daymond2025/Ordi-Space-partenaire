"use client";

import { useState } from "react";
import { CadenasIcon, FlecheGaucheIcon } from "@/components/icons";
import { formaterPrix } from "@/lib/catalogue";

/**
 * "Confirmation" — d'après la maquette : montant à payer + logo Wave, note
 * orange, "Paiement 100% sécurisé" et un seul bouton "PAYER". Wave n'est
 * qu'une formalité : aucun paiement ne passe par Wave, le partenaire paie
 * Ordi'Space hors application. "Payer" confirme ce paiement
 * (POST /partenaire/approvisionnements/{id}/confirmer), que l'Admin valide.
 */
export function ConfirmationPaiement({
  montant,
  enCours,
  erreur,
  onRetour,
  onPayer,
}: {
  montant: number;
  enCours: boolean;
  erreur: string | null;
  onRetour: () => void;
  onPayer: () => void;
}) {
  const [demande, setDemande] = useState(false);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-[#F5F5FF]">
      <header className="relative h-[160px] rounded-b-[44px] px-6 pt-6 text-white" style={{ background: "linear-gradient(135deg, #0077FF 0%, #00BFFF 100%)" }}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onRetour} aria-label="Retour" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/25">
            <FlecheGaucheIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-[22px] font-extrabold leading-tight">Confirmation</h1>
            <p className="text-[10px] text-white/85">Paiement sécurisé via wave</p>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-6 -mt-[66px] flex min-h-[340px] flex-col items-center rounded-[36px] bg-white px-6 pt-8 shadow-[0_10px_30px_rgba(20,20,60,0.12)]">
        <p className="text-[12px] text-brand-ink">Montant à payer</p>
        <p className="mt-0.5 text-[34px] font-extrabold leading-none text-black">{formaterPrix(montant)} F</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- logo local */}
        <img src="/images/wave.jpg" alt="Wave" className="mt-5 h-[86px] w-[86px] rounded-xl border-[3px] border-[#1D63E0] object-cover" />
      </section>

      <p className="mx-6 mt-6 rounded-xl border border-[#FFE0B8] bg-white px-4 py-4 text-[12px] leading-relaxed text-[#FF8A00]">
        Vous allez payer {formaterPrix(montant)} CFA sur wave à Ordi&apos;Space pour les articles manquants de votre commande. Dès validation de
        votre paiement, Ordi&apos;Space expédie le stock.
      </p>

      {erreur ? <p className="mx-6 mt-3 rounded-xl bg-rose-50 px-4 py-3 text-[12px] font-semibold text-rose-600">{erreur}</p> : null}

      <div className="mt-auto flex flex-col items-center px-10 pb-[120px] pt-10 text-center">
        <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8B93A5]">
          <CadenasIcon className="h-5 w-5" />
          Paiement 100% sécurisé
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-[#A0A7B7]">
          Toutes les transactions sont chiffrées et sécurisées par Ordi&apos;Space conformément aux normes internationales.
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-xl border-t border-brand-line bg-white px-6 pb-5 pt-4">
        <button
          type="button"
          disabled={enCours || demande}
          onClick={() => {
            setDemande(true);
            onPayer();
            setTimeout(() => setDemande(false), 1500);
          }}
          className="h-12 w-full rounded-xl text-[15px] font-extrabold uppercase tracking-wide text-white disabled:opacity-60"
          style={{ background: "linear-gradient(90deg, #FF7A00 0%, #FFC700 100%)" }}
        >
          {enCours ? "…" : "Payer"}
        </button>
      </div>
    </main>
  );
}
