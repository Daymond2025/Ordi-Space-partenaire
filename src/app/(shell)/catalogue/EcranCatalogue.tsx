"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type SVGProps } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { familleProduit } from "@/lib/catalogue";
import type { Pagination, ProduitCatalogue } from "@/lib/types";
import { EngrenageIcon, GridIcon, HeadsetIcon, MonitorIcon, PanierIcon, SearchIcon } from "@/components/icons";
import { GrilleProduitsCatalogue } from "@/components/catalogue/GrilleProduitsCatalogue";

const CATEGORIES = [
  { id: "tout", label: "Tout", icone: GridIcon },
  { id: "ordinateurs", label: "Ordinateurs", icone: MonitorIcon },
  { id: "accessoires", label: "Accessoires", icone: HeadsetIcon },
  { id: "logiciels", label: "Logiciels", icone: EngrenageIcon },
] as const;

/** Entonnoir — accès à l'écran Filtres (à la place du panier client, dans la pilule de recherche). */
function FiltreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M3 5h18l-7 8v6l-4 2v-8z" />
    </svg>
  );
}

/**
 * Catalogue du partenaire — même page que la Market Space du client
 * (Ordi'Space_App_Mobile/market-space : bandeau dégradé + logo, auvent rayé,
 * carte recherche + 4 catégories, produits posés sur un rectangle blanc).
 * Ce qui change : tout le catalogue Ordi'Space avec SES prix de cession,
 * bénéfices et stock (GET /partenaire/catalogue) ; le bouton de la pilule
 * ouvre les Filtres, le bouton du bandeau son Centre des commandes.
 */
export function EcranCatalogue() {
  const { token } = useAuth();
  const [categorie, setCategorie] = useState<(typeof CATEGORIES)[number]["id"]>("tout");
  const [recherche, setRecherche] = useState("");
  const [produits, setProduits] = useState<ProduitCatalogue[] | null>(null);

  useEffect(() => {
    if (!token) return;
    let annule = false;
    apiFetch<Pagination<ProduitCatalogue>>("/partenaire/catalogue?per_page=50", { token })
      .then((page) => {
        if (!annule) setProduits(page.data);
      })
      .catch(() => {
        if (!annule) setProduits([]);
      });
    return () => {
      annule = true;
    };
  }, [token]);

  const produitsFiltres = useMemo(() => {
    if (!produits) return null;
    const terme = recherche.trim().toLowerCase();
    return produits.filter(
      (p) => (categorie === "tout" || familleProduit(p.categorie) === categorie) && (!terme || p.nom_produit.toLowerCase().includes(terme))
    );
  }, [produits, categorie, recherche]);

  return (
    <main className="min-h-full pb-8">
      <div className="bg-gradient-brand-blue relative overflow-hidden px-5 pb-7 pt-4 text-white">
        <Image src="/images/image_header.png" alt="" fill className="object-cover opacity-20 mix-blend-soft-light" />

        <div className="relative flex items-center justify-between">
          <Image src="/images/Logo_Ordi_Space_bleu_et_blanc.png" alt="Ordi'Space" width={859} height={291} className="h-9 w-auto object-contain" priority />
          <Link href="/commandes" aria-label="Centre des commandes" className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white">
            <PanierIcon className="h-4.5 w-4.5 text-[color:var(--brand-blue-end)]" />
          </Link>
        </div>
      </div>

      {/* Auvent — posé à la bordure du bandeau (même rendu que la Market Space client). */}
      <div className="relative -mt-5 h-[63px] w-full overflow-hidden">
        <div className="absolute left-1/2 h-full w-[420px] -translate-x-1/2">
          <Image src="/images/Auvent_rayé.png" alt="" fill className="object-cover" style={{ objectPosition: "50% 47%" }} priority />
        </div>
      </div>

      <section className="px-2 pt-1">
        <div className="rounded-[22px] p-2.5" style={{ background: "linear-gradient(135deg, #EAF3FF 0%, #DCEBFF 100%)" }}>
          <div className="flex h-11 items-center gap-2 rounded-full bg-white py-1 pl-4 pr-1 shadow-sm shadow-slate-900/5">
            <SearchIcon className="h-4.5 w-4.5 shrink-0 text-brand-muted" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full min-w-0 bg-transparent text-sm text-brand-ink outline-none placeholder:text-brand-muted"
            />
            <Link
              href="/catalogue/filtres"
              aria-label="Filtrer (marque, RAM, stockage…)"
              className="bg-gradient-brand-blue flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
            >
              <FiltreIcon className="h-4.5 w-4.5" />
            </Link>
          </div>

          <div className="-mx-2.5 mt-3 flex items-center justify-between gap-1 overflow-x-auto px-2.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategorie(cat.id)}
                className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
                  categorie === cat.id ? "bg-gradient-brand-blue text-white shadow-sm" : "bg-white text-brand-ink shadow-sm shadow-slate-900/5"
                }`}
              >
                <cat.icone className={`h-3.5 w-3.5 shrink-0 ${categorie === cat.id ? "text-white" : "text-[color:var(--brand-blue-end)]"}`} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-4 px-2">
        <div className="rounded-[22px] bg-white p-2.5">
          {produitsFiltres === null ? (
            <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>
          ) : produitsFiltres.length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-muted">Aucun produit dans cette catégorie.</p>
          ) : (
            <GrilleProduitsCatalogue produits={produitsFiltres} encadre />
          )}
        </div>
      </section>
    </main>
  );
}
