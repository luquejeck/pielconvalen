"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconoFlecha } from "./iconos";
import { vieneDeEstaWeb } from "./Recorrido";

/**
 * "Volver": atras de verdad si se venia navegando por la web, y si no,
 * a `href`. Ver components/Recorrido.tsx.
 *
 * Es un link comun con `href` real: sin javascript, o abierto en otra
 * pestaña, lleva a `href` igual.
 */
export default function BotonVolver({ href, texto = "Volver" }: { href: string; texto?: string }) {
  const router = useRouter();

  return (
    <Link
      href={href}
      onClick={(e) => {
        if (!vieneDeEstaWeb()) return;
        e.preventDefault();
        router.back();
      }}
      className="inline-flex min-h-11 items-center gap-1.5 text-base text-tinta-suave transition-colors hover:text-vino"
    >
      <IconoFlecha className="h-4 w-4 rotate-180" />
      {texto}
    </Link>
  );
}
