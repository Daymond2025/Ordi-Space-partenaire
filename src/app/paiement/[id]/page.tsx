import { EcranRetourPaiement } from "./EcranRetourPaiement";

export default async function PaiementPage({ params }: PageProps<"/paiement/[id]">) {
  const { id } = await params;

  return <EcranRetourPaiement approvisionnementId={Number(id)} />;
}
