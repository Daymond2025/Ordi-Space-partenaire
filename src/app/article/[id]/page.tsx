import { EcranArticle } from "./EcranArticle";

export default async function ArticlePage({ params }: PageProps<"/article/[id]">) {
  const { id } = await params;

  return <EcranArticle produitId={Number(id)} />;
}
