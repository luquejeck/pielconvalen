"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconoFlecha } from "../iconos";

/**
 * "Tenés 2 giftcards para cobrar", arriba de Turnos.
 *
 * Turnos es lo primero que abre Valen: si la giftcard pedida por la web
 * solo apareciera en su pestaña, la veria recien cuando fuera a buscarla.
 * Es un renglon que lleva a Giftcards, no la lista entera: el trabajo se
 * hace alla. Y solo cuando hay alguna, como los pedidos.
 */
export default function AvisoGiftcards() {
  const [nuevas, setNuevas] = useState(0);

  useEffect(() => {
    fetch("/api/giftcards?estado=nueva")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNuevas(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, []);

  if (nuevas === 0) return null;

  return (
    <Link
      href="/admin/giftcards"
      className="mb-8 flex min-h-14 items-center justify-between gap-3 rounded-suave border-2 border-vino bg-white px-5 py-3 text-lg font-semibold text-tinta transition-colors hover:bg-vino-suave"
    >
      {nuevas === 1 ? "1 giftcard para cobrar" : `${nuevas} giftcards para cobrar`}
      <IconoFlecha className="h-5 w-5 shrink-0 text-vino" />
    </Link>
  );
}
