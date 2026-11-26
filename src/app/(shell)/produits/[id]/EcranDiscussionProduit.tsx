"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useRefetchOnFocus } from "@/lib/useRefetchOnFocus";
import { ChevronLeftIcon, MonitorIcon } from "@/components/icons";
import { CarteCommandeDiscussion } from "@/components/discussion/CarteCommandeDiscussion";
import { BulleMessage } from "@/components/discussion/BulleMessage";
import { BarreDeSaisie } from "@/components/discussion/BarreDeSaisie";
import type { ConversationProduit, ItemFil } from "@/lib/types";
import { useRetour } from "@/lib/navigation";

/**
 * Discussion produit — même écran que l'app Fournisseur
 * (produits/[id]/EcranDiscussionProduit.tsx), sur la conversation du
 * partenaire (GET /partenaire/produits/{id}/conversation) : ses commandes de
 * ce produit, la carte "Nouvelle commande", le rapport du jour et ses
 * échanges avec le coordinateur. Le fournisseur n'y a jamais accès.
 */
export function EcranDiscussionProduit({ produitId }: { produitId: number }) {
  const { user, token } = useAuth();
  const router = useRouter();
  // Retour fiable même si la page a été ouverte directement (notification, lien, appli rouverte) — voir lib/navigation.ts.
  const retour = useRetour("/");
  const [conversation, setConversation] = useState<ConversationProduit | null>(null);
  const [chargement, setChargement] = useState(true);

  const recharger = useCallback(() => {
    if (!token) return;
    apiFetch<ConversationProduit>(`/partenaire/produits/${produitId}/conversation`, { token })
      .then(setConversation)
      .catch(() => setConversation(null))
      .finally(() => setChargement(false));
  }, [token, produitId]);

  useEffect(recharger, [recharger]);
  useRefetchOnFocus(recharger);

  async function envoyerMessage(texte: string) {
    if (!token) return;
    await apiFetch(`/partenaire/produits/${produitId}/messages`, { method: "POST", token, body: { contenu: texte } });
    recharger();
  }

  async function envoyerAudio(blob: Blob) {
    if (!token) return;
    const formData = new FormData();
    formData.append("fichier", blob, "message-vocal.webm");
    formData.append("type", "note_vocale");
    await apiFetch(`/partenaire/produits/${produitId}/messages`, { method: "POST", token, body: formData });
    recharger();
  }

  const items: ItemFil[] = conversation?.items ?? [];
  const nomProduit = conversation?.produit.nom_produit ?? `Produit #${produitId}`;
  const photo = conversation?.produit.photo ?? null;
  const stats = conversation?.en_tete ?? { recues: 0, livrees: 0, annulees: 0, en_cours: 0 };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-brand-line bg-white px-3 py-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={retour} aria-label="Retour" className="flex h-8 w-8 shrink-0 items-center justify-center text-brand-ink">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#EEF1F6]">
            {photo ? (
              <Image src={photo} alt={nomProduit} fill className="object-cover" sizes="40px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-brand-muted">
                <MonitorIcon className="h-5 w-5" />
              </div>
            )}
          </div>

          <p className="min-w-0 flex-1 truncate text-sm font-bold text-brand-ink">{nomProduit}</p>

          <button
            type="button"
            onClick={() => router.push("/commandes")}
            aria-label="Centre des commandes"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F7FA]"
          >
            <Image src="/images/Icon-stats.png" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-brand-ink">{stats.recues} commandes reçu</span>
          <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-green-600">{stats.livrees} Livrée</span>
          <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-[color:var(--brand-blue-end)]">{stats.en_cours} En cours</span>
          <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-rose-500">{stats.annulees} Annulée</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto bg-[#f6f2ed]">
        <div className="space-y-3 px-3 py-4 pb-6">
          {chargement ? (
            <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-brand-muted">Aucune activité pour l&apos;instant.</p>
          ) : (
            items.map((item) =>
              item.type === "commande" ? (
                <CarteCommandeDiscussion key={`commande-${item.donnee.commande_id}`} carte={item.donnee} />
              ) : (
                <BulleMessage key={`message-${item.donnee.id}`} message={item.donnee} estMoi={item.donnee.auteur_id === user?.id} />
              )
            )
          )}
        </div>
      </div>

      <BarreDeSaisie onEnvoyer={envoyerMessage} onEnvoyerAudio={envoyerAudio} />
    </div>
  );
}
