// Thème des écrans de connexion/inscription de cette app (kit
// d'authentification : CadreAuth, MascotteVivante, DecorAuth…). Chaque app a
// le sien : couleurs, décor animé, accessoire de la mascotte et répliques.

export type ThemeAuth = {
  espace: string;
  slogan: string;
  degrade: string;
  halos: [string, string, string];
  accent: string;
  accentFin: string;
  accentHalo: string;
  accentOmbre: string;
  decor: "constellation" | "etincelles" | "colis" | "route" | "etiquettes" | "engrenages" | "bulles" | "radar";
  posture: "flotte" | "roule";
  accessoire: "aucun" | "engrenage" | "logo" | "radar" | "etoile" | "coeur" | "colis" | "casque";
  logo?: string;
  confettis: string[];
  badge: string;
  repliques: {
    salut: string;
    repos: string;
    telephone: string;
    telephoneOk: string;
    email: string;
    emailOk: string;
    mdp: string;
    erreur: string;
    code: string;
    succes: string;
    nom: string;
  };
};

export const THEME_AUTH: ThemeAuth = {
  "espace": "Partenaire",
  "slogan": "Gère ta boutique, ton stock et les commandes de tes clients.",
  "degrade": "linear-gradient(160deg,#0b1f5c 0%,#1d4ed8 50%,#d97706 130%)",
  "halos": [
    "rgba(251,191,36,0.32)",
    "rgba(96,165,250,0.35)",
    "rgba(255,255,255,0.14)"
  ],
  "accent": "#1d4ed8",
  "accentFin": "#f59e0b",
  "accentHalo": "rgba(29,78,216,0.16)",
  "accentOmbre": "rgba(217,119,6,0.35)",
  "decor": "etiquettes",
  "posture": "flotte",
  "accessoire": "logo",
  "logo": "/images/logo-partenaire.png",
  "confettis": [
    "#1d4ed8",
    "#f59e0b",
    "#fde68a",
    "#ffffff",
    "#60a5fa"
  ],
  "badge": "Connexion sécurisée · code WhatsApp",
  "repliques": {
    "telephone": "Ton numéro WhatsApp 📱",
    "telephoneOk": "Parfait, je t'envoie le code 🚀",
    "email": "Ton adresse e-mail 📧",
    "emailOk": "Cet e-mail me va ✅",
    "mdp": "Je ne regarde pas 🙈",
    "code": "Regarde WhatsApp 💬",
    "salut": "Ta boutique ouvre ? 🏪",
    "repos": "Tes clients t'attendent 🛍️",
    "erreur": "Oups… on vérifie ça 😅",
    "succes": "Bonnes ventes en boutique ! 🎉",
    "nom": "Comment tu t'appelles ? ✍️"
  }
};
