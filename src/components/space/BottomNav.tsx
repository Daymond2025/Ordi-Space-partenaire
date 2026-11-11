"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, StoreIcon } from "@/components/icons";
import type { ComponentType, SVGProps } from "react";

function Onglet({
  href,
  label,
  icone: Icone,
  actif,
}: {
  href: string;
  label: string;
  icone: ComponentType<SVGProps<SVGSVGElement>>;
  actif: boolean;
}) {
  return (
    <Link href={href} aria-current={actif ? "page" : undefined} className="flex flex-1 flex-col items-center gap-1 py-2 text-[#111111]">
      <Icone className="h-[26px] w-[26px]" />
      <span className={`text-center text-[13px] leading-tight ${actif ? "font-semibold" : "font-normal"}`}>{label}</span>
    </Link>
  );
}

/** Barre du bas de l'app Partenaire : Space, bouton central (mascotte), Catalogue — d'après la maquette de l'accueil. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-20 flex items-end bg-white px-6 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1"
      style={{ boxShadow: "0px -2px 10px rgba(0, 0, 0, 0.08)" }}
    >
      <Onglet href="/" label="Space" icone={HomeIcon} actif={pathname === "/"} />

      <div className="flex flex-1 justify-center">
        {/* Bouton central : toujours vers le Centre des commandes. */}
        <Link
          href="/commandes"
          aria-label="Centre des commandes"
          className="-mt-7 flex h-[64px] w-[64px] items-center justify-center rounded-full border-4 border-white"
          style={{ background: "linear-gradient(135deg, #0A6CFF 0%, #00B4FF 100%)", boxShadow: "0 6px 16px rgba(10, 108, 255, 0.35)" }}
        >
          <Image src="/images/mascotte.png" alt="" width={38} height={38} className="h-[38px] w-[38px] object-contain" />
        </Link>
      </div>

      <Onglet href="/catalogue" label="Catalogue" icone={StoreIcon} actif={pathname.startsWith("/catalogue")} />
    </nav>
  );
}
