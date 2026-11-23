"use client";

import { ClocheNotifications } from "@/components/notifications/Notifications";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type SVGProps } from "react";
import { ChevronDownIcon, UserIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ilYA, montant } from "@/lib/format";
import type { Accueil, Periode, ProduitAccueil } from "@/lib/types";
import { useRefetchOnFocus } from "@/lib/useRefetchOnFocus";

const DEGRADE_HEADER = "linear-gradient(120deg, #0866FF 0%, #00B4FF 100%)";
const OMBRE_CARTE = "0px 4px 14px rgba(16, 24, 40, 0.10)";

const PERIODES: { id: Periode; label: string }[] = [
  { id: "tout", label: "Tout" },
  { id: "aujourd_hui", label: "Aujourd'hui" },
  { id: "semaine", label: "Semaine" },
  { id: "mois", label: "Mois" },
];

function CarteCompteur({ valeur, label, puce, alerte = false, href }: { valeur: string; label: string; puce: string; alerte?: boolean; href?: string }) {
  const contenu = (
    <>
      <span className={`relative flex h-[42px] w-[42px] items-center justify-center rounded-full text-[19px] font-bold ${puce}`}>
        {valeur}
        {alerte ? <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-[#FF1E1E]" /> : null}
      </span>
      <p className="mt-2 whitespace-pre-line text-[11px] font-medium leading-tight text-[#2B2B2B]">{label}</p>
    </>
  );
  const classe = "flex h-[103px] flex-col items-center justify-center rounded-[18px] bg-white px-1 text-center";

  return href ? (
    <Link href={href} className={classe} style={{ boxShadow: OMBRE_CARTE }}>
      {contenu}
    </Link>
  ) : (
    <div className={classe} style={{ boxShadow: OMBRE_CARTE }}>
      {contenu}
    </div>
  );
}

function CarteMontant({ valeur, label, puce }: { valeur: string; label: string; puce: string }) {
  return (
    <div className="flex h-[103px] flex-col items-center justify-center rounded-[18px] bg-white px-1.5 text-center" style={{ boxShadow: OMBRE_CARTE }}>
      {/* Réduit au-delà de "999.999 F" pour que les millions tiennent en entier. */}
      <span
        className={`flex h-[30px] max-w-full items-center justify-center rounded-full font-bold ${valeur.length > 9 ? "px-2 text-[12px]" : "px-3 text-[15px]"} ${puce}`}
      >
        <span className="truncate">{valeur}</span>
      </span>
      <p className="mt-2 whitespace-pre-line text-[11px] font-medium leading-tight text-[#2B2B2B]">{label}</p>
    </div>
  );
}

function DoubleCoche(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M2 13l4 4L15 7" />
      <path d="M9 16l1 1L21 7" />
    </svg>
  );
}

/** Une ligne par produit commandé : compteurs par statut, pastille des commandes à accepter. */
function CarteProduit({ ligne }: { ligne: ProduitAccueil }) {
  const { produit } = ligne;

  return (
    <Link href={`/produits/${produit.id}`} className="flex items-center gap-3 rounded-[12px] bg-white px-2.5 py-2.5" style={{ boxShadow: "0px 2px 8px rgba(16, 24, 40, 0.08)" }}>
      <span className="relative shrink-0">
        <span className="flex h-[46px] w-[46px] items-center justify-center overflow-hidden rounded-full border border-[#E3E6EC] bg-[#F5F7FB]">
          {produit.image ? <Image src={produit.image} alt="" width={46} height={46} className="h-full w-full object-cover" /> : null}
        </span>
        <span
          className={`absolute bottom-0.5 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${ligne.en_stock ? "bg-[#23C55E]" : "bg-[#B8BEC9]"}`}
          aria-label={ligne.en_stock ? "En stock" : "Rupture de stock"}
        />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-[#1B1B1B]">{produit.nom_produit}</p>
        <p className="mt-1 truncate text-[10px] text-[#3A3A3A]">
          <b className="text-[#1B1B1B]">{ligne.commandes}</b> Commandes <span className="mx-1 text-[#9AA1AD]">•</span>
          <b className="text-[#17A34A]">{ligne.livrees}</b> livrée{ligne.livrees > 1 ? "s" : ""} <span className="mx-1 text-[#9AA1AD]">•</span>
          <b className="text-[#1E7BFF]">{ligne.en_cours}</b> en cours <span className="mx-1 text-[#9AA1AD]">•</span>
          <b className="text-[#E5252A]">{ligne.annulees}</b> annulée{ligne.annulees > 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 self-stretch py-0.5">
        {ligne.nouvelles > 0 ? (
          <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#17A34A] px-1 text-[11px] font-bold text-white ring-2 ring-[#BFEFCF]">
            {ligne.nouvelles}
          </span>
        ) : (
          <DoubleCoche className="h-[18px] w-[18px] text-[#1E7BFF]" />
        )}
        <span className="mt-auto text-[10px] text-[#8A8F98]">{ilYA(ligne.derniere_activite)}</span>
      </div>
    </Link>
  );
}

function SelecteurPeriode({ periode, onChange }: { periode: Periode; onChange: (p: Periode) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOuvert(false);
    };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, [ouvert]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        className="flex h-[30px] min-w-[112px] items-center justify-between gap-2 rounded-full pl-4 pr-1 text-[12px] font-semibold uppercase text-white"
        style={{ background: "rgba(255, 255, 255, 0.25)", border: "1px solid rgba(255, 255, 255, 0.35)" }}
      >
        {PERIODES.find((p) => p.id === periode)?.label}
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white/35">
          <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${ouvert ? "rotate-180" : ""}`} />
        </span>
      </button>

      {ouvert ? (
        <ul role="listbox" className="absolute right-0 z-30 mt-1.5 w-[140px] overflow-hidden rounded-[12px] bg-white py-1 shadow-lg ring-1 ring-black/5">
          {PERIODES.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                role="option"
                aria-selected={p.id === periode}
                onClick={() => {
                  onChange(p.id);
                  setOuvert(false);
                }}
                className={`w-full px-4 py-2 text-left text-[13px] ${p.id === periode ? "font-semibold text-[#0A6CFF]" : "text-[#2B2B2B]"}`}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * "Space" — accueil de l'app Partenaire (GET /partenaire/accueil) : compteurs
 * de la période choisie et produits commandés par ses clients.
 */
export function EcranSpace() {
  const { token, user } = useAuth();
  const [periode, setPeriode] = useState<Periode>("tout");
  const [accueil, setAccueil] = useState<Accueil | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(() => {
    if (!token) return;
    apiFetch<Accueil>(`/partenaire/accueil?periode=${periode}`, { token })
      .then((a) => {
        setAccueil(a);
        setErreur(null);
      })
      .catch((e: Error) => setErreur(e.message));
  }, [token, periode]);

  useEffect(charger, [charger]);
  useRefetchOnFocus(charger);

  const identite = accueil?.partenaire ?? user;
  const nomComplet = identite ? `${identite.prenom ? `${identite.prenom} ` : ""}${identite.nom}` : "";
  const stats = accueil?.statistiques;
  const tiret = "—";

  return (
    <div className="flex min-h-full flex-col bg-[#F2F5FA]">
      <div className="bg-white pb-6">
        <div className="px-[26px] pb-[62px] pt-[24px]" style={{ background: DEGRADE_HEADER, borderRadius: "0 0 30px 30px" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="mt-2 flex min-w-0 items-center gap-3">
              <Link href="/profil" aria-label="Mon profil" className="flex h-[62px] w-[62px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] border-2 border-white bg-white/20">
                {accueil?.partenaire.photo ? (
                  <Image src={accueil.partenaire.photo} alt="" width={62} height={62} className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-7 w-7 text-white" />
                )}
              </Link>
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-white">Bonjour, 👋</p>
                <p className="truncate text-xl font-extrabold uppercase leading-tight text-white">{nomComplet}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ClocheNotifications className="bg-white/15 text-white" />
              <SelecteurPeriode periode={periode} onChange={setPeriode} />
            </div>
          </div>
        </div>

        <div className="relative z-10 -mt-[42px] grid grid-cols-3 gap-[11px] px-4">
          <CarteCompteur valeur={stats ? String(stats.produits_en_stock) : tiret} label={"Produits\nen stock"} puce="bg-[#FFF1EC] text-[#FF8A1F]" />
          <CarteCompteur valeur={stats ? String(stats.produits_vendus) : tiret} label={"Produits\nTotal vendus"} puce="bg-[#E7F8EE] text-[#15803D]" />
          <CarteCompteur
            valeur={stats ? String(stats.nouvelles_commandes) : tiret}
            label={"Nouvelle\ncommande"}
            puce="bg-[#EAF3FF] text-[#1E7BFF]"
            alerte={(stats?.nouvelles_commandes ?? 0) > 0}
            href="/commandes"
          />
          <CarteMontant valeur={stats ? montant(stats.chiffre_affaires) : tiret} label={"De chiffre\nd'affaires"} puce="bg-[#EAF5FF] text-[#1E9BFF]" />
          <CarteMontant valeur={stats ? montant(stats.investissement) : tiret} label={"Investissement\ntotal"} puce="bg-[#FFF0F0] text-[#FF9F1A]" />
          <CarteMontant valeur={stats ? montant(stats.benefice) : tiret} label={"Bénéfice Total\nsur les ventes"} puce="bg-[#E7F8EE] text-[#17A34A]" />
        </div>
      </div>

      {/* Ligne de séparation sur toute la largeur de l'écran. */}
      <div className="h-px w-full shrink-0 bg-brand-line" />

      <div className="flex flex-1 flex-col gap-3 px-4 pb-8 pt-5">
        {erreur ? (
          <p className="py-10 text-center text-sm text-red-600">{erreur}</p>
        ) : accueil === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : accueil.produits.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune commande sur cette période.</p>
        ) : (
          accueil.produits.map((ligne) => <CarteProduit key={ligne.produit.id} ligne={ligne} />)
        )}
      </div>
    </div>
  );
}
