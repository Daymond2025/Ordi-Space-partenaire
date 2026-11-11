/** "123.357 F" — séparateur de milliers en point, comme sur les maquettes. */
export function montant(valeur: number): string {
  return `${Math.round(valeur).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} F`;
}

/** "il y a 2h", "il y a 5 min", "il y a 3 j"… */
export function ilYA(iso: string | null): string {
  if (!iso) return "";
  const secondes = Math.max(0, (Date.now() - new Date(iso.replace(" ", "T")).getTime()) / 1000);
  if (secondes < 60) return "à l'instant";
  if (secondes < 3600) return `il y a ${Math.floor(secondes / 60)} min`;
  if (secondes < 86400) return `il y a ${Math.floor(secondes / 3600)}h`;
  return `il y a ${Math.floor(secondes / 86400)} j`;
}
