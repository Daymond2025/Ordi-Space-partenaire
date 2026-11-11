"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { formaterPrix } from "@/lib/catalogue";
import { useRefetchOnFocus } from "@/lib/useRefetchOnFocus";
import { CocheIcon, FlecheGaucheIcon } from "@/components/icons";

type Appro = {
  id: number;
  reference: string;
  statut: string;
  montant_total: string;
  motif_refus: string | null;
  commande_partenaire_id: number | null;
};

const ETAPES: Record<string, { titre: string; texte: string; ok: boolean }> = {
  paiement_declare: {
    titre: "Paiement confirmé",
    texte: "Ordi'Space vérifie votre paiement fait hors application. Vous serez notifié dès sa validation.",
    ok: true,
  },
  paiement_valide: { titre: "Paiement validé", texte: "Ordi'Space prépare l'expédition de votre stock.", ok: true },
  expedie: { titre: "Stock expédié", texte: "Confirmez la réception dès l'arrivée : la commande de votre client sera validée.", ok: true },
  recu: { titre: "Stock reçu", texte: "La commande de votre client est validée.", ok: true },
  annule: { titre: "Approvisionnement annulé", texte: "Contactez Ordi'Space pour plus d'informations.", ok: false },
};

function messageErreur(e: unknown): string {
  return e instanceof ApiRequestError ? ((e.fields ? Object.values(e.fields)[0]?.[0] : undefined) ?? e.message) : "Réessayez.";
}

/**
 * Suivi du paiement d'avance après l'écran Confirmation. Wave n'est qu'une
 * formalité : le partenaire paie hors application, confirme, puis l'Admin
 * valide et expédie ; ici le partenaire confirme enfin la réception, ce qui
 * valide automatiquement la commande de son client.
 */
export function EcranRetourPaiement({ approvisionnementId }: { approvisionnementId: number }) {
  const { token } = useAuth();
  const [appro, setAppro] = useState<Appro | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const charger = useCallback(() => {
    if (!token) return;
    apiFetch<Appro>(`/partenaire/approvisionnements/${approvisionnementId}`, { token })
      .then(setAppro)
      .catch(() => setErreur("Paiement introuvable."));
  }, [token, approvisionnementId]);

  useEffect(charger, [charger]);
  useRefetchOnFocus(charger);

  async function action(chemin: "confirmer" | "reception") {
    if (!token || enCours) return;
    setErreur(null);
    setEnCours(true);
    try {
      setAppro(await apiFetch<Appro>(`/partenaire/approvisionnements/${approvisionnementId}/${chemin}`, { method: "POST", token }));
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  }

  const etape = appro ? ETAPES[appro.statut] : null;

  return (
    <main className="min-h-full bg-[#F5F5FF] pb-10">
      <header className="relative h-[150px] rounded-b-[44px] px-6 pt-6 text-white" style={{ background: "linear-gradient(135deg, #0077FF 0%, #00BFFF 100%)" }}>
        <div className="flex items-center gap-3">
          <Link href="/commandes" aria-label="Centre des commandes" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/25">
            <FlecheGaucheIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-[22px] font-extrabold leading-tight">Paiement</h1>
            <p className="text-[10px] text-white/85">{appro?.reference ?? ""}</p>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-6 -mt-[64px] flex flex-col items-center rounded-[36px] bg-white px-6 pb-8 pt-8 text-center shadow-[0_10px_30px_rgba(20,20,60,0.12)]">
        {!appro ? (
          <p className="py-10 text-sm text-brand-muted">{erreur ?? "Chargement…"}</p>
        ) : appro.statut === "en_attente_paiement" ? (
          <>
            <p className="text-[12px] text-brand-ink">Montant à payer</p>
            <p className="mt-0.5 text-[30px] font-extrabold leading-none text-black">{formaterPrix(Number(appro.montant_total))} F</p>
            {appro.motif_refus ? (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-600">Paiement non validé : {appro.motif_refus}</p>
            ) : null}
            <p className="mt-3 text-[13px] text-brand-muted">Payez Ordi&apos;Space hors application, puis confirmez votre paiement.</p>
            <button
              type="button"
              onClick={() => action("confirmer")}
              disabled={enCours}
              className="mt-5 h-12 w-full rounded-xl text-sm font-extrabold uppercase text-white disabled:opacity-60"
              style={{ background: "linear-gradient(90deg, #FF7A00 0%, #FFC700 100%)" }}
            >
              {enCours ? "…" : "Payer"}
            </button>
          </>
        ) : etape ? (
          <>
            <span className={`flex h-16 w-16 items-center justify-center rounded-full ${etape.ok ? "bg-[#E7F8EE] text-[#17A34A]" : "bg-rose-50 text-rose-500"}`}>
              <CocheIcon className="h-8 w-8" strokeWidth={3} />
            </span>
            <p className="mt-4 text-lg font-extrabold text-brand-ink">{etape.titre}</p>
            <p className="mt-1 text-[13px] text-brand-muted">
              {formaterPrix(Number(appro.montant_total))} F — {etape.texte}
            </p>
            {appro.statut === "expedie" ? (
              <button
                type="button"
                onClick={() => action("reception")}
                disabled={enCours}
                className="bg-gradient-brand-orange mt-5 h-12 w-full rounded-xl text-sm font-extrabold uppercase text-white disabled:opacity-60"
              >
                {enCours ? "…" : "Confirmer la réception"}
              </button>
            ) : null}
          </>
        ) : (
          <p className="text-[13px] text-brand-muted">Statut : {appro.statut}</p>
        )}
        {erreur && appro ? <p className="mt-3 text-xs font-semibold text-rose-600">{erreur}</p> : null}
      </section>

      {appro?.commande_partenaire_id ? (
        <div className="mx-6 mt-6">
          <Link href={`/commande/${appro.commande_partenaire_id}`} className="block rounded-xl bg-white py-3 text-center text-sm font-bold text-[color:var(--brand-blue-end)] shadow-sm">
            Voir la commande du client
          </Link>
        </div>
      ) : null}
    </main>
  );
}
