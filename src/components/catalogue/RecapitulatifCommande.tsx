"use client";

import { useState } from "react";
import { LIBELLE_ETAT_PRODUIT, formaterPrix, resumerSpecs } from "@/lib/catalogue";
import type { ProduitCatalogueDetail } from "@/lib/types";
import type { InfosClient } from "@/components/catalogue/FormulaireInformationLivraison";
import { BarrePaiement } from "@/components/catalogue/BarrePaiement";
import { FriseElements } from "@/components/catalogue/FriseElements";
import { CocheIcon, DrapeauCiIcon, FlecheGaucheIcon, ImageIcon, MoinsIcon, PlusIcon } from "@/components/icons";

const QUANTITE_MAX = 20;
const CARTE = "mx-3.5 rounded-2xl bg-white px-4 pb-4 pt-4 shadow-[0_1px_4px_rgba(20,20,60,0.07)]";

function TitreCarte({ children }: { children: string }) {
  return <h2 className="border-b border-[#E5E7EB] pb-2.5 text-center text-[16px] text-brand-ink">{children}</h2>;
}

function Champ({ libelle, children }: { libelle: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="whitespace-nowrap text-[9.5px] text-brand-muted">{libelle}</p>
      <div className="mt-1 flex min-h-[26px] items-center gap-1.5 rounded bg-[#EEF0FF] px-1.5 py-1 text-[10px] font-semibold text-brand-ink">{children}</div>
    </div>
  );
}

/**
 * "Récapitulatif" — même écran que page_commande (livraison, commande,
 * à recevoir, modalités), avec les chiffres du partenaire : prix de vente
 * au client, prix de cession, bénéfice. Selon son stock : "Valider la
 * commande" (en stock) ou "Payer" le prix de cession des articles manquants.
 */
export function RecapitulatifCommande({
  produit,
  prixVente,
  infos,
  onRetour,
  onValider,
  enCours,
  erreur,
}: {
  produit: ProduitCatalogueDetail;
  prixVente: number;
  infos: InfosClient;
  onRetour: () => void;
  onValider: (quantite: number) => void;
  enCours: boolean;
  erreur: string | null;
}) {
  const [quantite, setQuantite] = useState(1);

  const totalClient = prixVente * quantite;
  const benefice = (prixVente - produit.prix_cession) * quantite;
  const manquant = Math.max(0, quantite - produit.stock);
  const aPayer = manquant * produit.prix_cession;
  const resume = resumerSpecs(produit).join(" • ");

  return (
    <main className="mx-auto min-h-dvh w-full max-w-xl bg-[#F5F5FF] pb-44">
      <header className="flex h-16 items-center justify-between bg-white px-4 shadow-[0_1px_3px_rgba(20,20,60,0.08)]">
        <button type="button" onClick={onRetour} aria-label="Retour à la fiche produit" className="flex h-9 w-9 items-center justify-center text-brand-ink">
          <FlecheGaucheIcon className="h-6 w-6" />
        </button>
        <h1 className="text-[20px] font-extrabold text-brand-ink">Récapitulatif</h1>
        <span className="h-9 w-9" aria-hidden="true" />
      </header>

      <div className="mt-3.5 space-y-3.5">
        <section className={CARTE}>
          <TitreCarte>Information de livraison</TitreCarte>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1.3fr)] gap-1.5">
            <Champ libelle="Nom sur la facture">
              <span className="truncate">{infos.nom}</span>
            </Champ>
            <Champ libelle="Destination">
              <DrapeauCiIcon className="h-3 w-[16px] shrink-0 rounded-[2px]" aria-hidden="true" />
              <span className="truncate">{infos.lieu}</span>
            </Champ>
            <Champ libelle="Contact">
              <span className="truncate">+225 {infos.telephone}</span>
            </Champ>
          </div>
        </section>

        <section className={CARTE}>
          <TitreCarte>Les Commandes</TitreCarte>
          <div className="mt-3 rounded-xl bg-[#F5F5FF] p-2">
            <div className="relative flex items-center gap-3 overflow-hidden rounded-xl bg-white p-2">
              <div className="relative h-[76px] w-[68px] shrink-0 overflow-hidden rounded-lg bg-[#F2F5FA]">
                {produit.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- photo servie par le backend, domaine dynamique
                  <img src={produit.images[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-brand-muted">
                    <ImageIcon className="h-6 w-6" />
                  </span>
                )}
                <span className="absolute left-1 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#FF7A00] bg-white text-[#FF7A00]" aria-hidden="true">
                  <CocheIcon className="h-3 w-3" strokeWidth={3.2} />
                </span>
              </div>

              <div className="min-w-0 flex-1 pt-3">
                <p className="truncate text-[12px] font-extrabold text-brand-ink">{produit.nom_produit}</p>
                {resume ? <p className="mt-0.5 truncate text-[9px] text-brand-muted">{resume}</p> : null}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                      disabled={quantite <= 1}
                      aria-label="Retirer un exemplaire"
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-brand-ink text-brand-ink disabled:opacity-35"
                    >
                      <MoinsIcon className="h-3 w-3" strokeWidth={3} />
                    </button>
                    <span className="min-w-4 border-b border-brand-ink text-center text-[13px] font-extrabold" aria-label={`Quantité : ${quantite}`}>
                      {quantite}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantite((q) => Math.min(QUANTITE_MAX, q + 1))}
                      disabled={quantite >= QUANTITE_MAX}
                      aria-label="Ajouter un exemplaire"
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7A00] text-white disabled:opacity-40"
                    >
                      <PlusIcon className="h-3 w-3" strokeWidth={3} />
                    </button>
                  </div>
                  <p className="whitespace-nowrap text-[15px] font-extrabold text-[#FF8A00]">
                    {formaterPrix(totalClient)}
                    <span className="text-[10px] font-bold text-brand-ink">&nbsp;CFA</span>
                  </p>
                </div>
              </div>

              {produit.etat_produit ? (
                <span className="bg-gradient-brand-orange absolute right-0 top-0 rounded-bl-xl px-3 py-1 text-[10px] font-extrabold italic text-white">
                  {LIBELLE_ETAT_PRODUIT[produit.etat_produit] ?? produit.etat_produit}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section className={CARTE}>
          <TitreCarte>À recevoir</TitreCarte>
          <FriseElements elements={[`${quantite} ${produit.nom_produit}`]} />
        </section>

        <section className={CARTE}>
          <TitreCarte>Modalités de payement</TitreCarte>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#EAF3FF] px-3 py-3">
            <p className="text-[13px] font-extrabold leading-tight text-[#0B1B3A]">
              Le client vous
              <br />
              paie
            </p>
            <p className="whitespace-nowrap text-[24px] font-extrabold leading-none text-[#1D63E0]">
              {formaterPrix(totalClient)}
              <span className="text-[11px] font-bold text-brand-ink">&nbsp;CFA</span>
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#F5F6FB] px-3 py-3">
            <p className="text-[13px] font-extrabold leading-tight text-[#0B1B3A]">
              Votre prix
              <br />
              de cession
            </p>
            <p className="whitespace-nowrap text-[22px] font-extrabold leading-none text-brand-ink">
              {formaterPrix(produit.prix_cession * quantite)}
              <span className="text-[11px] font-bold">&nbsp;CFA</span>
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#E7F8EE] px-3 py-3">
            <p className="text-[13px] font-extrabold leading-tight text-[#15803D]">Votre bénéfice</p>
            <p className="whitespace-nowrap text-[22px] font-extrabold leading-none text-[#15803D]">
              +{formaterPrix(benefice)}
              <span className="text-[11px] font-bold">&nbsp;CFA</span>
            </p>
          </div>

          <p className={`mt-4 rounded-xl px-3 py-2.5 text-[11px] font-semibold ${manquant === 0 ? "bg-[#E7F8EE] text-[#15803D]" : "bg-[#FFF1DC] text-[#EA7A0B]"}`}>
            {manquant === 0
              ? `En stock (${produit.stock}) : la commande est validée tout de suite, rien à payer.`
              : `Stock : ${produit.stock}. Il manque ${manquant} article${manquant > 1 ? "s" : ""} : payez-le${manquant > 1 ? "s" : ""} à Ordi'Space, l'expédition suit.`}
          </p>
        </section>
      </div>

      <BarrePaiement
        montant={manquant === 0 ? totalClient : aPayer}
        libelle={manquant === 0 ? "Total client" : "À payer à Ordi'Space"}
        note={manquant === 0 ? "Payé par le client à la livraison" : "Prix de cession des articles manquants"}
        bouton={manquant === 0 ? "Valider" : "Payer"}
        enCours={enCours}
        onPayer={() => onValider(quantite)}
      >
        {erreur ? <p className="mb-2 text-center text-xs font-semibold text-red-500">{erreur}</p> : null}
      </BarrePaiement>
    </main>
  );
}
