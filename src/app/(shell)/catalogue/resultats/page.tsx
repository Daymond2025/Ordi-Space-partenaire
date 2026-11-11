import { Suspense } from "react";
import { EcranResultats } from "./EcranResultats";

export default function ResultatsCataloguePage() {
  return (
    <Suspense fallback={null}>
      <EcranResultats />
    </Suspense>
  );
}
