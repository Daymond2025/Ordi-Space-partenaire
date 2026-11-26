"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { LIBELLE_ETAT_PRODUIT, formaterPrix, prixClient, resumerSpecs } from "@/lib/catalogue";
import type { ProduitCatalogueDetail, ReponseCommandeCatalogue } from "@/lib/types";
import {
  CarteGraphiqueIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DisqueIcon,
  EcranIcon,
  EngrenageIcon,
  FenetresIcon,
  ImageIcon,
  MemoireIcon,
  PencilIcon,
  ProcesseurIcon,
  ShareIcon,
  TruckIcon,
} from "@/components/icons";
import { VisionneuseImages } from "@/components/catalogue/VisionneuseImages";
import { FormulaireInformationLivraison, type InfosClient } from "@/components/catalogue/FormulaireInformationLivraison";
import { RecapitulatifCommande } from "@/components/catalogue/RecapitulatifCommande";
import { ConfirmationPaiement } from "@/components/catalogue/ConfirmationPaiement";
import { useRetour } from "@/lib/navigation";

const ONGLETS = [
  { id: "cadeaux", label: "Les cadeaux" },
  { id: "description", label: "Description" },
  { id: "pack", label: "Pack complet" },
] as const;

type IconeSpec = ComponentType<SVGProps<SVGSVGElement>>;
type Etape = "fiche" | "recapitulatif" | "confirmation";

const OMBRE_CARTE = "0px 1px 2px 0px rgba(0, 0, 0, 0.05)";

function messageErreur(e: unknown): string {
  if (e instanceof ApiRequestError) return (e.fields ? Object.values(e.fields)[0]?.[0] : undefined) ?? e.message;
  return "Une erreur est survenue, réessayez.";
}

/**
 * "Détails" — même fiche que la boutique Livreur / la marketplace client
 * (Partager dans l'en-tête, photos, caractéristiques, onglets Les cadeaux /
 * Description / Pack complet, livraison, garantie, barre du bas "Je passe la
 * commande" + Copier). Propre au partenaire : son prix de vente (modifiable),
 * son prix de cession, son bénéfice et son stock ; Partager/Copier portent
 * une annonce du produit à SON prix. La commande suit : nom / numéro / lieu
 * du client → récapitulatif → validée (en stock) ou "Payer" les articles
 * manquants → Confirmation (formalité Wave : paiement fait hors application,
 * confirmé ici puis validé par l'Admin).
 */
export function EcranArticle({ produitId }: { produitId: number }) {
  const router = useRouter();
  // Retour fiable même si la page a été ouverte directement (notification, lien, appli rouverte) — voir lib/navigation.ts.
  const retour = useRetour("/catalogue");
  const { token } = useAuth();
  const [produit, setProduit] = useState<ProduitCatalogueDetail | null>(null);
  const [introuvable, setIntrouvable] = useState(false);
  const [imageActive, setImageActive] = useState(0);
  const [ongletActif, setOngletActif] = useState<(typeof ONGLETS)[number]["id"]>("description");
  const [visionneuseOuverte, setVisionneuseOuverte] = useState(false);
  const [copie, setCopie] = useState(false);

  const [editionPrix, setEditionPrix] = useState(false);
  const [prixSaisi, setPrixSaisi] = useState("");
  const [erreurPrix, setErreurPrix] = useState<string | null>(null);

  const [etape, setEtape] = useState<Etape>("fiche");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [infos, setInfos] = useState<InfosClient | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [paiement, setPaiement] = useState<NonNullable<ReponseCommandeCatalogue["paiement"]> | null>(null);

  const charger = useCallback(() => {
    if (!token) return;
    apiFetch<ProduitCatalogueDetail>(`/partenaire/catalogue/${produitId}`, { token })
      .then(setProduit)
      .catch(() => setIntrouvable(true));
  }, [token, produitId]);

  useEffect(charger, [charger]);

  /** Annonce partagée / copiée : le produit à SON prix de vente. */
  function annonce(p: ProduitCatalogueDetail): string {
    const specs = resumerSpecs(p);
    return [p.nom_produit, specs.length ? specs.join(" • ") : null, `Prix : ${formaterPrix(prixClient(p))} FCFA`, p.duree_garantie_mois ? `Garantie ${p.duree_garantie_mois} mois` : null]
      .filter(Boolean)
      .join("\n");
  }

  async function onPartager() {
    if (!produit) return;
    const texte = annonce(produit);
    if (navigator.share) {
      try {
        await navigator.share({ title: produit.nom_produit, text: texte });
      } catch {
        // Partage annulé — rien à faire.
      }
    } else {
      await onCopier();
    }
  }

  async function onCopier() {
    if (!produit) return;
    try {
      await navigator.clipboard.writeText(annonce(produit));
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers refusé par le navigateur.
    }
  }

  async function enregistrerPrix() {
    if (!token || !produit) return;
    setErreurPrix(null);
    try {
      await apiFetch(`/partenaire/catalogue/${produit.id}/offre`, { method: "PUT", token, body: { prix_revente: Number(prixSaisi.replace(/\D/g, "")) } });
      setEditionPrix(false);
      charger();
    } catch (e) {
      setErreurPrix(messageErreur(e));
    }
  }

  async function commander(quantite: number) {
    if (!token || !produit || !infos || envoi) return;
    setErreur(null);
    setEnvoi(true);
    try {
      const reponse = await apiFetch<ReponseCommandeCatalogue>("/partenaire/commandes", {
        method: "POST",
        token,
        body: { produit_id: produit.id, quantite, prix_unitaire: prixClient(produit), ...infos },
      });
      if (!reponse.paiement) {
        router.replace(`/commande/${reponse.commande.id}`);
        return;
      }
      setPaiement(reponse.paiement);
      setEtape("confirmation");
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  }

  /** "Payer" : Wave n'est qu'une formalité — confirme le paiement fait hors application. */
  async function confirmerPaiement() {
    if (!token || !paiement || envoi) return;
    setErreur(null);
    setEnvoi(true);
    try {
      await apiFetch(`/partenaire/approvisionnements/${paiement.approvisionnement_id}/confirmer`, { method: "POST", token });
      router.replace(`/paiement/${paiement.approvisionnement_id}`);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  }

  if (introuvable) {
    return <p className="p-10 text-center text-sm text-brand-muted">Produit introuvable ou retiré du catalogue.</p>;
  }
  if (!produit) {
    return <p className="p-10 text-center text-sm text-brand-muted">Chargement…</p>;
  }

  if (etape === "confirmation" && paiement) {
    return (
      <ConfirmationPaiement
        montant={paiement.montant}
        enCours={envoi}
        erreur={erreur}
        onRetour={() => router.push(`/paiement/${paiement.approvisionnement_id}`)}
        onPayer={confirmerPaiement}
      />
    );
  }

  if (etape === "recapitulatif" && infos) {
    return (
      <RecapitulatifCommande
        produit={produit}
        prixVente={prixClient(produit)}
        infos={infos}
        onRetour={() => setEtape("fiche")}
        onValider={commander}
        enCours={envoi}
        erreur={erreur}
      />
    );
  }

  const prixVente = prixClient(produit);
  const prixBarre = produit.prix_barre && produit.prix_barre > prixVente ? produit.prix_barre : null;
  const enStock = produit.stock > 0;
  const specs = resumerSpecs(produit);
  const specsDetail = (
    [
      { label: "Processeur", valeur: produit.processeur, Icone: ProcesseurIcon },
      { label: "Disque dur", valeur: produit.stockage, Icone: DisqueIcon },
      { label: "Ram", valeur: produit.memoire_ram, Icone: MemoireIcon },
      { label: "Carte graphique", valeur: produit.carte_graphique, Icone: CarteGraphiqueIcon },
      { label: "Taille d'écran", valeur: produit.taille, Icone: EcranIcon },
      { label: "Système installé", valeur: produit.systeme_exploitation, Icone: FenetresIcon },
    ] as { label: string; valeur: string | null; Icone: IconeSpec }[]
  ).filter((s): s is { label: string; valeur: string; Icone: IconeSpec } => Boolean(s.valeur));

  const contenuOnglet: Record<(typeof ONGLETS)[number]["id"], string> = {
    cadeaux: produit.cadeaux.length > 0 ? produit.cadeaux.join(", ") : "Aucun cadeau inclus avec ce produit.",
    description: produit.description ?? "Aucune description fournie pour ce produit.",
    pack: produit.contenu_pack.length > 0 ? produit.contenu_pack.join(", ") : "Aucun pack complet pour ce produit.",
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="flex shrink-0 items-center justify-between bg-white px-4 py-3">
        <button type="button" onClick={retour} aria-label="Retour" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2F5FA] text-brand-ink">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="text-base font-extrabold text-brand-ink">Détails</p>
        <button
          type="button"
          onClick={onPartager}
          aria-label="Partager le produit"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-ink shadow-[0px_1px_3px_0px_rgba(0,0,0,0.15)]"
        >
          <ShareIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="relative h-[320px] w-full shrink-0 bg-[#F2F5FA]">
        {produit.images[imageActive] ? (
          <button type="button" onClick={() => setVisionneuseOuverte(true)} aria-label="Voir la photo en grand" className="block h-full w-full cursor-zoom-in">
            {/* eslint-disable-next-line @next/next/no-img-element -- domaine backend dynamique */}
            <img src={produit.images[imageActive]} alt="" className="h-full w-full object-cover" />
          </button>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-muted">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}
        {produit.etat_produit ? (
          <span
            className="absolute left-[13px] top-[15px] flex h-[22px] items-center rounded-lg px-2 text-xs font-bold leading-[14px] text-white"
            style={{ background: "linear-gradient(273.52deg, #FFCC00 -3.09%, #FF7800 98.47%)", boxShadow: OMBRE_CARTE }}
          >
            {LIBELLE_ETAT_PRODUIT[produit.etat_produit] ?? produit.etat_produit}
          </span>
        ) : null}
        {produit.pourcentage_reduction ? (
          <span
            className="absolute right-3 top-[15px] flex h-[22px] items-center rounded px-2 text-xs font-bold leading-[14px] text-white"
            style={{ background: "linear-gradient(115.13deg, #FF9700 0%, #FFB800 100%)" }}
          >
            -{produit.pourcentage_reduction}%
          </span>
        ) : null}
      </div>

      {produit.images.length > 1 ? (
        <div className="flex shrink-0 gap-2 overflow-x-auto px-1 pb-[25px] pt-[9px]">
          {produit.images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setImageActive(index)}
              className="h-[87px] w-[112px] shrink-0 overflow-hidden rounded-[5px] border-2 bg-white"
              style={{ borderColor: index === imageActive ? "rgba(38, 128, 235, 1)" : "transparent" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- domaine backend dynamique */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="h-[25px] shrink-0" />
      )}

      <div className="mx-2.5 flex shrink-0 flex-col gap-1 rounded-xl bg-white p-4" style={{ boxShadow: OMBRE_CARTE }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-black px-2 py-1 text-[10px] font-extrabold text-white">{produit.nom_produit.split(" ")[0].toUpperCase()}</span>
          {enStock ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {produit.stock} pièce{produit.stock > 1 ? "s" : ""} dans votre stock
            </span>
          ) : null}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${enStock ? "bg-[#F2F5FA] text-brand-muted" : "bg-rose-50 text-rose-500"}`}>
            {enStock ? "En stock" : "Pas en stock"}
          </span>
        </div>

        <p className="text-xl font-extrabold text-brand-ink">{produit.nom_produit}</p>
        {specs.length > 0 ? <p className="text-xs text-brand-muted">{specs.join(" • ")}</p> : null}

        {/* Prix de vente au client : SON prix (modifiable, jamais sous le prix de cession). */}
        <div className="mt-2 flex min-h-[58px] flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg px-3 py-2" style={{ background: "rgba(242, 243, 255, 0.6)" }}>
          {editionPrix ? (
            <div className="flex w-full items-center gap-2">
              <input
                value={prixSaisi}
                onChange={(e) => setPrixSaisi(e.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric"
                aria-label="Mon prix de vente"
                className="h-10 min-w-0 flex-1 rounded-lg border border-orange-300 bg-white px-3 text-base font-extrabold text-orange-700 outline-none"
              />
              <button type="button" onClick={enregistrerPrix} className="bg-gradient-brand-orange h-10 shrink-0 rounded-lg px-3 text-xs font-extrabold text-white">
                Enregistrer
              </button>
            </div>
          ) : (
            <>
              <div className="shrink-0">
                <p className="whitespace-nowrap text-[10px] text-brand-muted">Prix de vente</p>
                <div className="mt-0.5 flex items-baseline gap-2 whitespace-nowrap">
                  <p className="text-[17px] font-extrabold text-orange-600">{formaterPrix(prixVente)}&nbsp;FCFA</p>
                  {prixBarre ? <p className="text-[11px] text-brand-muted line-through">{formaterPrix(prixBarre)}&nbsp;FCFA</p> : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPrixSaisi(String(prixVente));
                  setEditionPrix(true);
                }}
                aria-label="Modifier mon prix de vente"
                className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white px-3 text-[10px] font-bold text-orange-600 shadow-sm"
              >
                <PencilIcon className="h-3.5 w-3.5" /> Modifier
              </button>
            </>
          )}
        </div>
        {erreurPrix ? <p className="text-[11px] font-semibold text-rose-600">{erreurPrix}</p> : null}

        {/* À la place de la "Commission" du livreur : son prix de cession et son bénéfice. */}
        <div className="relative mt-1.5 flex min-h-[51px] items-center justify-between rounded-md py-2 pl-5 pr-4" style={{ background: "rgba(255, 236, 208, 0.54)" }}>
          <span aria-hidden="true" className="absolute left-[5px] top-1 h-[42px] w-1 rounded-md" style={{ background: "rgba(255, 119, 0, 1)" }} />
          <span className="whitespace-nowrap text-lg font-light text-orange-700">Prix de cession</span>
          <span className="whitespace-nowrap text-lg font-extrabold text-orange-600">{formaterPrix(produit.prix_cession)}&nbsp;FCFA</span>
        </div>
        <div className="relative mt-1.5 flex min-h-[51px] items-center justify-between rounded-md py-2 pl-5 pr-4" style={{ background: "rgba(35, 231, 85, 0.12)" }}>
          <span aria-hidden="true" className="absolute left-[5px] top-1 h-[42px] w-1 rounded-md" style={{ background: "#17A34A" }} />
          <span className="whitespace-nowrap text-lg font-light text-[#15803D]">Bénéfice</span>
          <span className="whitespace-nowrap text-lg font-extrabold text-[#15803D]">+{formaterPrix(prixVente - produit.prix_cession)}&nbsp;FCFA</span>
        </div>
      </div>

      <div className="mx-[11px] mt-3.5 shrink-0 rounded-[13px] bg-white p-4" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
        {specsDetail.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {specsDetail.map((spec) => (
              <div key={spec.label} className="flex items-center gap-1.5 rounded-xl bg-[#F7F8FF] px-2 py-2.5">
                <spec.Icone className="h-5 w-5 shrink-0 text-orange-500" />
                <div className="min-w-0">
                  <p className="truncate text-[9px] text-brand-muted">{spec.label}</p>
                  <p className="text-[10px] font-extrabold leading-tight text-brand-ink">{spec.valeur}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex gap-1 rounded-full bg-white p-1" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
          {ONGLETS.map((onglet) => (
            <button
              key={onglet.id}
              type="button"
              onClick={() => setOngletActif(onglet.id)}
              className={`flex-1 rounded-full py-2 text-[11px] font-extrabold transition-colors ${
                ongletActif === onglet.id ? "text-white shadow-[0px_3px_8px_0px_rgba(249,115,22,0.4)]" : "text-brand-muted"
              }`}
              style={ongletActif === onglet.id ? { background: "linear-gradient(90deg, #FBBF24 0%, #F97316 100%)" } : undefined}
            >
              {onglet.label}
            </button>
          ))}
        </div>

        <div className="mt-3 min-h-[160px] whitespace-pre-line rounded-[13px] p-4 text-xs leading-relaxed text-brand-muted" style={{ background: "rgba(247, 248, 255, 1)" }}>
          {contenuOnglet[ongletActif]}
        </div>
      </div>

      <div className="mx-[11px] mb-6 mt-3.5 flex shrink-0 flex-col gap-3 rounded-xl bg-white p-4" style={{ boxShadow: OMBRE_CARTE }}>
        <div className="flex min-h-[44px] items-center gap-3">
          <TruckIcon viewBox="1 6 22 16" className="h-[14.67px] w-[20.17px] shrink-0" style={{ color: "rgba(255, 119, 0, 1)" }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-brand-ink">Livraison</p>
            <p className="mt-0.5 text-xs text-brand-muted">Assurée par votre boutique, au lieu indiqué par le client</p>
          </div>
        </div>
        {produit.duree_garantie_mois ? (
          <div className="flex min-h-[56px] items-center gap-3 rounded-xl px-4 py-1.5" style={{ background: "linear-gradient(274.19deg, #23E755 3.13%, #008421 98.13%)" }}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "rgba(255, 255, 255, 0.54)" }}>
              <EngrenageIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1 text-white">
              <p className="text-sm font-extrabold">Garantie</p>
              <p className="text-xs">{produit.duree_garantie_mois} mois</p>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className="sticky bottom-0 z-20 mt-auto flex h-[110px] shrink-0 items-start gap-[21px] rounded-t-[23px] bg-white px-[22px] pt-[25px]"
        style={{ boxShadow: "0px -3px 3px 0px rgba(0, 0, 0, 0.1608)" }}
      >
        <button
          type="button"
          onClick={() => setFormulaireOuvert(true)}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-extrabold text-white"
          style={{ background: "linear-gradient(90deg, #FBBF24 0%, #F97316 100%)", boxShadow: "0px 2px 4px -2px rgba(255, 151, 0, 0.2)" }}
        >
          Je passe la commande
          <ChevronRightIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onCopier}
          aria-label="Copier l'annonce du produit"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(37, 211, 102, 0.16)", color: "rgba(37, 211, 102, 1)", boxShadow: OMBRE_CARTE }}
        >
          {copie ? <CheckIcon className="h-5 w-5" /> : <CopyIcon className="h-5 w-5" />}
        </button>
      </div>

      {visionneuseOuverte ? <VisionneuseImages images={produit.images} indexInitial={imageActive} onFermer={() => setVisionneuseOuverte(false)} /> : null}

      {formulaireOuvert ? (
        <FormulaireInformationLivraison
          initiales={infos}
          onFermer={() => setFormulaireOuvert(false)}
          onEnregistrer={(saisie) => {
            setInfos(saisie);
            setFormulaireOuvert(false);
            setErreur(null);
            setEtape("recapitulatif");
          }}
        />
      ) : null}
    </div>
  );
}
