"use client";

import { useState } from "react";
import { DrapeauCiIcon } from "@/components/icons";

export type InfosClient = { nom: string; telephone: string; lieu: string };

const CHAMP =
  "h-[46px] w-full rounded-[10px] border border-[#D5D9E0] bg-white px-3.5 text-[13px] text-brand-ink outline-none focus:border-[color:var(--brand-blue-end)]";
const LIBELLE = "block text-[14px] font-extrabold text-black";

/**
 * "Information de livraison" — même feuille que page_commande, mais le
 * partenaire ne demande que les 3 informations de son client : nom, numéro
 * et lieu de livraison (texte libre). Rien n'est envoyé ici : la saisie
 * remonte à l'écran, qui ouvre le récapitulatif.
 */
export function FormulaireInformationLivraison({
  initiales,
  onEnregistrer,
  onFermer,
}: {
  initiales: InfosClient | null;
  onEnregistrer: (infos: InfosClient) => void;
  onFermer: () => void;
}) {
  const [nom, setNom] = useState(initiales?.nom ?? "");
  const [telephone, setTelephone] = useState(initiales?.telephone ?? "");
  const [lieu, setLieu] = useState(initiales?.lieu ?? "");
  const [erreur, setErreur] = useState<string | null>(null);

  function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) return setErreur("Indiquez le nom du client.");
    if (telephone.replace(/\D/g, "").length < 8) return setErreur("Indiquez un numéro de téléphone valide.");
    if (!lieu.trim()) return setErreur("Indiquez le lieu de livraison.");
    onEnregistrer({ nom: nom.trim(), telephone: telephone.trim(), lieu: lieu.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center" onClick={onFermer}>
      <form
        onSubmit={enregistrer}
        onChange={() => setErreur(null)}
        onClick={(e) => e.stopPropagation()}
        noValidate
        role="dialog"
        aria-label="Information de livraison"
        className="flex max-h-[94dvh] min-h-[min(560px,90dvh)] w-full max-w-md flex-col overflow-y-auto rounded-t-[36px] bg-white md:rounded-[36px]"
      >
        <h2 className="border-b border-[#E5E7EB] px-6 pb-4 pt-6 text-center text-[20px] font-extrabold text-[#777]">information de livraison</h2>

        <div className="flex flex-1 flex-col px-6 pb-6 pt-6">
          <label className={LIBELLE} htmlFor="livraison-nom">
            Nom du client
          </label>
          <input
            id="livraison-nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            autoComplete="off"
            placeholder="Nom et prénom du client"
            className={`${CHAMP} mt-2.5 placeholder:text-[11px]`}
          />

          <label className={`${LIBELLE} mt-6`} htmlFor="livraison-telephone">
            Numero De Telephone
          </label>
          <div className="mt-2.5 flex h-[46px] items-center gap-2.5 rounded-[10px] border border-[#D5D9E0] px-3 focus-within:border-[color:var(--brand-blue-end)]">
            <DrapeauCiIcon className="h-[22px] w-[30px] shrink-0 rounded-[3px]" aria-hidden="true" />
            <span className="text-sm font-extrabold text-black">+225</span>
            <span className="h-6 w-px bg-[#D5D9E0]" />
            <input
              id="livraison-telephone"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value.replace(/[^\d\s]/g, ""))}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="Numéro WhatsApp du client"
              className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-brand-ink outline-none placeholder:text-[11px]"
            />
          </div>

          <label className={`${LIBELLE} mt-6`} htmlFor="livraison-lieu">
            Lieu De Livraison
          </label>
          <input
            id="livraison-lieu"
            value={lieu}
            onChange={(e) => setLieu(e.target.value)}
            maxLength={255}
            placeholder="Quartier, repère… (ex. Habitat, Yamoussoukro)"
            className={`${CHAMP} mt-2.5 placeholder:text-[11px]`}
          />

          {erreur ? <p className="mt-4 text-[13px] font-semibold text-red-500">{erreur}</p> : null}

          <button
            type="submit"
            className="bg-gradient-brand-orange mt-auto flex h-[46px] w-full items-center justify-center gap-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wide text-white"
          >
            Enregistrer
            <span aria-hidden="true" className="text-base leading-none">→</span>
          </button>
        </div>
      </form>
    </div>
  );
}
