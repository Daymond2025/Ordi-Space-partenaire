/** Produit tel que l'API le montre au partenaire (jamais le prix fournisseur). */
export type ProduitPartenaire = {
  id: number;
  nom_produit: string;
  marque: string | null;
  categorie: string | null;
  etat_produit: string | null;
  image: string | null;
  duree_garantie_mois: number | null;
};

/** ?periode= de GET /partenaire/accueil — voir resoudre_periode() côté backend. */
export type Periode = "tout" | "aujourd_hui" | "semaine" | "mois";

export type ProduitAccueil = {
  produit: ProduitPartenaire;
  en_stock: boolean;
  commandes: number;
  livrees: number;
  en_cours: number;
  annulees: number;
  /** Commandes encore à accepter (pastille verte). */
  nouvelles: number;
  derniere_activite: string | null;
};

export type Accueil = {
  periode: Periode;
  partenaire: { nom: string; prenom: string | null; photo: string | null; nom_boutique: string };
  statistiques: {
    produits_en_stock: number;
    produits_vendus: number;
    nouvelles_commandes: number;
    chiffre_affaires: number;
    investissement: number;
    benefice: number;
  };
  produits: ProduitAccueil[];
};

// --- Suivi des commandes — mêmes formes que les apps Fournisseur/Coordinateur (backend : App\Services\Partenaire\FilPartenaire). ---

export type StatistiquesProduit = {
  recues: number;
  livrees: number;
  annulees: number;
  en_cours: number;
};

export type ProduitActif = {
  produit_id: number;
  nom_produit: string;
  photo: string | null;
  statistiques: StatistiquesProduit;
  derniere_activite: string | null;
  nouvelles_activites: number;
  /** Toujours false côté partenaire (pas d'épinglage). */
  epingle: boolean;
};

/** Dernier événement du suivi de la commande. */
export type DernierSuivi = {
  texte: string;
  acteur: string;
  date: string;
};

/**
 * Carte commande (fil produit + "Commandes uniquement") — même forme que les
 * apps Fournisseur/Coordinateur, produite par FilPartenaire::carte().
 */
export type CommandeCarte = {
  commande_id: number;
  reference?: string;
  photo: string | null;
  nom_produit: string;
  description: string | null;
  nom_client: string;
  zone_localite: string | null;
  telephone: string | null;
  derniere_action: string;
  statut: string;
  nouvelles_activites: number;
  dernier_suivi: DernierSuivi | null;
};

/** Discussion produit du partenaire (GET /partenaire/produits/{id}/conversation). */
export type MessageAuteur = {
  id: number;
  nom: string;
  prenom: string | null;
  type_utilisateur: string;
  telephone?: string | null;
};

export type TypeMessage =
  | "texte"
  | "image"
  | "video"
  | "audio"
  | "note_vocale"
  | "document"
  | "rapport"
  | "commande_creee"
  | "proposition_prix";

export type DonneesCommandeCreee = {
  nom_produit: string;
  photo: string | null;
  prix_produit: number;
  nom_client: string;
  telephone: string | null;
  zone_livraison: string | null;
  date_livraison_prevue: string | null;
  frais_livraison: number;
  remise: number;
  total: number;
  bonus_offerts: string | null;
  notes?: string | null;
};

export type DonneesRapport = {
  date: string;
  envoyees: number;
  validees: number;
  reportees: number;
  non_livre: number;
  annulees: number;
};

export type DonneesPropositionPrix = {
  prix_liste: number;
  prix_propose: number;
};

export type MessageConversation = {
  id: number;
  produit_id: number | null;
  commande_id: number | null;
  auteur_id: number;
  auteur: MessageAuteur;
  type: TypeMessage;
  contenu: string | null;
  fichier: string | null;
  donnees: DonneesCommandeCreee | DonneesRapport | DonneesPropositionPrix | null;
  date_envoi: string;
};

export type ItemFil =
  | { type: "message"; date: string; donnee: MessageConversation }
  | { type: "commande"; date: string; donnee: CommandeCarte };

/** = Produit::statistiquesCommandes() — mêmes 4 champs que StatistiquesProduit. */
export type EnTeteConversation = {
  recues: number;
  livrees: number;
  annulees: number;
  en_cours: number;
};

export type ConversationProduit = {
  items: ItemFil[];
  en_tete: EnTeteConversation;
  produit: { id: number; nom_produit: string; photo: string | null };
};

export type SuiviDonnees = {
  statut_avant?: string | null;
  statut_apres?: string | null;
};

/** GET /partenaire/commandes/{id}/suivi — timeline verticale. */
export type SuiviEntree = {
  id: number;
  action: string;
  details: string | null;
  date_heure: string;
  acteur: MessageAuteur | null;
  donnees: SuiviDonnees | null;
};

/** "12.357 F" — même formatage que Cordinateur_App_Web/EcranSpace.tsx (regroupement en-US, séparateur remplacé par un point). */
export function formaterMontant(valeur: number): string {
  return `${Math.round(valeur).toLocaleString("en-US").replace(/,/g, ".")} F`;
}

/** GET /partenaire/commandes/{id} — la commande vue par son partenaire. */
export type CommandePartenaireDetail = {
  id: number;
  reference: string;
  statut_commande: string;
  date_commande: string;
  mode_remise: "livraison" | "retrait_boutique";
  telephone_contact: string;
  montant_total: string;
  benefice: number;
  motif_annulation: string | null;
  lignes: { id: number; produit: ProduitPartenaire; quantite: number; prix_unitaire: number; prix_cession_unitaire: number; benefice: number }[];
};

/** GET /partenaire/commandes?statut= — "Commandes uniquement". */
export type ReponseCommandesPartenaire = {
  commandes: { data: CommandeCarte[]; total: number };
  compteurs: Record<"nouvelle" | "en_cours" | "attention" | "livree" | "annulee", number>;
};

/**
 * Carte du catalogue partenaire (GET /partenaire/catalogue) : son prix de
 * cession, son prix de revente, son bénéfice et son stock — jamais le prix
 * fournisseur ni la marge Ordi'Space.
 */
export type ProduitCatalogue = ProduitPartenaire & {
  processeur: string | null;
  memoire_ram: string | null;
  stockage: string | null;
  taille: string | null;
  prix_barre: number | null;
  pourcentage_reduction: number | null;
  prix_ordispace: number;
  prix_cession: number;
  prix_revente: number | null;
  en_vente: boolean;
  benefice_unitaire: number | null;
  stock: number;
};

/** GET /partenaire/catalogue/{id} — fiche détaillée. */
export type ProduitCatalogueDetail = ProduitCatalogue & {
  description: string | null;
  images: string[];
  systeme_exploitation: string | null;
  carte_graphique: string | null;
  couleur: string | null;
  cadeaux: string[];
  contenu_pack: string[];
};

/** POST /partenaire/commandes — commande pour un client depuis le catalogue. */
export type ReponseCommandeCatalogue = {
  commande: CommandePartenaireDetail;
  paiement: { approvisionnement_id: number; reference: string; montant: number } | null;
};

export type Pagination<T> = { data: T[]; total: number; current_page: number; last_page: number };

/** GET /partenaire/profil — écran "Profil" (même écran que le Fournisseur). */
export type ProfilPartenaire = {
  id: number;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  photo: string | null;
  nom_boutique: string;
  adresse_boutique: string | null;
  contact_pro: string | null;
  horaires_ouverture: string | null;
  lien_maps: string | null;
  /** Ses villes, fixées par l'Admin (lecture seule). */
  zone_couverte: string | null;
  nom_gerant: string | null;
  telephone_gerant: string | null;
  created_at: string;
};

/** ?periode= de l'écran Statistiques (même sélecteur que le Fournisseur). */
export type PeriodeEspace = "aujourd_hui" | "semaine" | "semaine_derniere" | "mois" | "tout";

export type ProduitPlusVendu = {
  produit_id: number;
  nom_produit: string | null;
  photo: string | null;
  quantite_vendue: number;
  montant: number;
};

/** GET /partenaire/statistiques — écran "Statistiques" (Profil → Statistique). */
export type StatistiquesPartenaire = {
  periode: PeriodeEspace;
  chiffre_affaires: number;
  croissance_pourcentage: number | null;
  produits_vendus: number;
  produits_distincts_vendus: number;
  commandes_recues: number;
  commandes_validees: number;
  commandes_annulees: number;
  commandes_en_attente: number;
  benefice: number;
  produits_plus_vendus: ProduitPlusVendu[];
};
