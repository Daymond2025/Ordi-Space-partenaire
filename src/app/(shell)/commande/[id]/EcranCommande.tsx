"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiFetchAvecMeta } from "@/lib/api";
import { LIBELLES_STATUT } from "@/lib/statuts";
import { partager } from "@/lib/partage";
import { ChevronLeftIcon, FlagIcon, MonitorIcon, PhoneFilledIcon, ShareIcon } from "@/components/icons";
import { DetailCommande } from "@/components/discussion/DetailCommande";
import { BulleMessage } from "@/components/discussion/BulleMessage";
import { BarreDeSaisie } from "@/components/discussion/BarreDeSaisie";
import { TimelineSuivi } from "@/components/commande/TimelineSuivi";
import { FeuilleChangementStatut } from "@/components/commande/FeuilleChangementStatut";
import { formaterMontant } from "@/lib/types";
import type { CommandePartenaireDetail, DonneesCommandeCreee, MessageConversation, SuiviEntree } from "@/lib/types";
import { useRetour } from "@/lib/navigation";

function formaterDateCommande(iso: string): string {
  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";

  return `${date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} · ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

const STATUTS_FINAUX = ["livree", "annulee"];

/**
 * Détail commande (Suivie / Information) — même écran que les apps
 * Fournisseur/Coordinateur, sur une commande du partenaire
 * (GET /partenaire/commandes/{id}, /suivi, /messages). Comme le
 * coordinateur, le partenaire pilote le statut via la feuille (drapeau de la
 * barre de saisie) — il livre lui-même, donc pas d'envoi à un livreur.
 */
export function EcranCommande({ commandeId }: { commandeId: number }) {
  const { user, token } = useAuth();
  const router = useRouter();
  // Retour fiable même si la page a été ouverte directement (notification, lien, appli rouverte) — voir lib/navigation.ts.
  const retour = useRetour("/commandes");

  const [commande, setCommande] = useState<CommandePartenaireDetail | null>(null);
  const [apercu, setApercu] = useState<DonneesCommandeCreee | null>(null);
  const [onglet, setOnglet] = useState<"information" | "suivi">("information");
  const [suivi, setSuivi] = useState<SuiviEntree[] | null>(null);
  const [messages, setMessages] = useState<MessageConversation[]>([]);
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  // Commande inexistante ou d'un autre partenaire (404) : message au lieu d'un "Chargement…" sans fin.
  const [introuvable, setIntrouvable] = useState(false);

  const chargerCommande = useCallback(() => {
    if (!token) return;
    apiFetchAvecMeta<CommandePartenaireDetail>(`/partenaire/commandes/${commandeId}`, { token })
      .then(({ data, meta }) => {
        setCommande(data);
        setApercu((meta.apercu as DonneesCommandeCreee) ?? null);
      })
      .catch(() => setIntrouvable(true));
  }, [token, commandeId]);

  const chargerSuivi = useCallback(() => {
    if (!token) return;
    apiFetch<SuiviEntree[]>(`/partenaire/commandes/${commandeId}/suivi`, { token }).then(setSuivi).catch(() => {});
  }, [token, commandeId]);

  const chargerMessages = useCallback(() => {
    if (!token) return;
    apiFetch<{ data: MessageConversation[] }>(`/partenaire/commandes/${commandeId}/messages`, { token })
      // Plus récent en dernier, comme un fil de discussion.
      .then((pagination) => setMessages([...pagination.data].reverse()))
      .catch(() => {});
  }, [token, commandeId]);

  useEffect(chargerCommande, [chargerCommande]);
  useEffect(() => {
    if (onglet !== "suivi") return;
    chargerSuivi();
    chargerMessages();
  }, [onglet, chargerSuivi, chargerMessages]);

  async function envoyerMessage(texte: string) {
    if (!token) return;
    await apiFetch(`/partenaire/commandes/${commandeId}/messages`, { method: "POST", token, body: { contenu: texte } });
    chargerMessages();
    setOnglet("suivi");
  }

  async function envoyerAudio(blob: Blob) {
    if (!token) return;
    const formData = new FormData();
    formData.append("fichier", blob, "message-vocal.webm");
    formData.append("type", "note_vocale");
    await apiFetch(`/partenaire/commandes/${commandeId}/messages`, { method: "POST", token, body: formData });
    chargerMessages();
    setOnglet("suivi");
  }

  const titre = commande ? (LIBELLES_STATUT[commande.statut_commande] ?? commande.statut_commande) : "Commande";
  const produitId = commande?.lignes[0]?.produit.id ?? null;
  const modifiable = commande ? !STATUTS_FINAUX.includes(commande.statut_commande) : false;

  function partagerCommande() {
    if (!apercu || !commande) return;
    const lignes = [
      `Commande ${commande.reference} — ${titre}`,
      `Produit : ${apercu.nom_produit}`,
      `Client : ${apercu.nom_client}${apercu.telephone ? ` (${apercu.telephone})` : ""}`,
      apercu.zone_livraison ? `Livraison : ${apercu.zone_livraison}` : null,
      `Total : ${apercu.total.toLocaleString("fr-FR")} FCFA`,
    ].filter((ligne): ligne is string => ligne !== null);

    partager(lignes.join("\n"), `Commande ${commande.reference}`);
  }

  const barre = (
    <BarreDeSaisie
      onEnvoyer={envoyerMessage}
      onEnvoyerAudio={envoyerAudio}
      iconeExtra={modifiable ? <FlagIcon className="h-5 w-5" /> : undefined}
      onIconeExtra={() => setFeuilleOuverte(true)}
    />
  );

  if (introuvable) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-sm text-brand-muted">Cette commande est introuvable.</p>
        <button type="button" onClick={() => router.push("/commandes")} className="bg-gradient-espace rounded-full px-5 py-2.5 text-sm font-bold text-white">
          Centre des commandes
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-brand-line bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={retour} aria-label="Retour" className="flex h-8 w-8 shrink-0 items-center justify-center text-brand-ink">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-[color:var(--brand-blue-end)]">{titre}</p>
            {commande ? (
              <p className="text-xs text-brand-muted">
                {commande.reference} · {formaterDateCommande(commande.date_commande)}
              </p>
            ) : null}
          </div>
          <button type="button" onClick={partagerCommande} disabled={!apercu} aria-label="Partager" className="flex h-8 w-8 shrink-0 items-center justify-center text-brand-ink disabled:opacity-40">
            <ShareIcon className="h-5 w-5" />
          </button>
        </div>

        {apercu ? (
          <div className="mt-3 rounded-[9px] bg-white p-2.5" style={{ boxShadow: "1px 1px 2px 0px rgba(0, 0, 0, 0.25)" }}>
            <button
              type="button"
              onClick={() => produitId && router.push(`/produits/${produitId}`)}
              disabled={!produitId}
              aria-label="Voir la discussion du produit"
              className="flex w-full gap-2.5 text-left"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[9px] bg-[#F6F8FE]">
                {apercu.photo ? (
                  <Image src={apercu.photo} alt={apercu.nom_produit} fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brand-muted">
                    <MonitorIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-brand-ink">{apercu.nom_produit}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-brand-ink">{apercu.nom_client}</span>
                  {apercu.zone_livraison ? (
                    <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-brand-muted">{apercu.zone_livraison}</span>
                  ) : null}
                </div>
              </div>
            </button>
            {apercu.telephone ? (
              <a href={`tel:${apercu.telephone}`} className="ml-[66px] mt-1.5 block text-sm font-semibold text-[color:var(--brand-blue-end)]">
                {apercu.telephone}
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex rounded-full bg-[#EEF1F6] p-1">
          <button
            type="button"
            onClick={() => setOnglet("suivi")}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${onglet === "suivi" ? "bg-gradient-espace text-white" : "text-brand-muted"}`}
          >
            Suivie
          </button>
          <button
            type="button"
            onClick={() => setOnglet("information")}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${onglet === "information" ? "bg-gradient-espace text-white" : "text-brand-muted"}`}
          >
            Information
          </button>
        </div>
      </div>

      {onglet === "information" ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {apercu ? (
              <div className="overflow-hidden rounded-[9px] bg-white">
                <div className="px-3.5 pb-3.5 pt-3">
                  <DetailCommande donnees={apercu} />
                </div>
                <div className="h-4 w-full bg-black" />
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
            )}

            {/* Propre au partenaire : son bénéfice sur cette vente (jamais visible du client). */}
            {commande ? (
              <div className="flex items-center justify-between rounded-2xl bg-[#E7F8EE] px-4 py-3">
                <span className="text-sm font-semibold text-[#15803D]">Votre bénéfice sur cette vente</span>
                <span className="text-sm font-extrabold text-[#15803D]">{formaterMontant(commande.benefice)}</span>
              </div>
            ) : null}

            {commande?.motif_annulation ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">Motif : {commande.motif_annulation}</p>
            ) : null}

            {apercu?.telephone && modifiable ? (
              <a
                href={`tel:${apercu.telephone}`}
                style={{ background: "linear-gradient(270deg, #00BFFF 0%, #0077FF 100%)" }}
                className="flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[color:var(--brand-blue-end)]">
                  <PhoneFilledIcon className="h-3.5 w-3.5" />
                </span>
                Appeler le client
              </a>
            ) : null}

            {modifiable ? (
              <button type="button" onClick={() => setFeuilleOuverte(true)} className="bg-gradient-brand-orange w-full rounded-full py-3 text-sm font-bold text-white">
                Changer le statut
              </button>
            ) : null}
          </div>

          {barre}
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto bg-[#f6f2ed] px-4 py-4">
            <div className="rounded-[26px] bg-white p-4 shadow-sm shadow-slate-900/5">
              {suivi ? <TimelineSuivi entrees={suivi} /> : <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>}
            </div>

            {messages.map((message) => (
              <BulleMessage key={message.id} message={message} estMoi={message.auteur_id === user?.id} />
            ))}
          </div>

          {barre}
        </div>
      )}

      {feuilleOuverte && token ? (
        <FeuilleChangementStatut
          commandeId={commandeId}
          token={token}
          onFermer={() => setFeuilleOuverte(false)}
          onApplique={() => {
            setFeuilleOuverte(false);
            chargerCommande();
            chargerSuivi();
          }}
        />
      ) : null}
    </div>
  );
}
