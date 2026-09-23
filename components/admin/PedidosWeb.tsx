"use client";

import { useCallback, useEffect, useState } from "react";
import { formatearPrecio } from "@/lib/tratamientos";
import { IconoCheck } from "../iconos";

type Pedido = {
  id: string;
  codigo: string;
  items: { marca: string; nombre: string; cantidad: number; precio: number }[];
  total: number;
  creado_en: string;
};

/** "hace 5 min", "hace 3 h", o el dia y la hora si fue antes de ayer. */
function cuando(iso: string) {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;
  if (minutos < 48 * 60) return `hace ${Math.round(minutos / 60)} h`;
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Los pedidos de la tienda que entraron por la web, para cruzarlos con
 * el WhatsApp.
 *
 * Cuando una clienta toca "Enviar pedido por WhatsApp", la web lo
 * registra con un codigo (P-4K7M) que tambien va en el mensaje. Aca
 * aparece ese mismo codigo con lo que pidio y el total calculado con los
 * precios de ese momento: si el WhatsApp dice lo mismo, es ese pedido.
 * Es la doble validacion.
 *
 * Dos respuestas y nada mas: "me llego el WhatsApp" o "no llego". Las dos
 * lo sacan de la lista. Si no llego, es porque la clienta toco el boton
 * pero no apreto enviar adentro de WhatsApp.
 *
 * Va arriba de todo en Turnos, que es lo primero que mira Valen, y solo
 * cuando hay algo: una bandeja vacia todos los dias se vuelve invisible.
 */
export default function PedidosWeb() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetch("/api/pedidos");
    if (res.ok) {
      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const marcar = async (id: string, estado: "recibido" | "no-llego") => {
    setTrabajando(id);
    setError(null);
    const res = await fetch(`/api/pedidos?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    setTrabajando(null);
    if (!res.ok) {
      setError("No se pudo. Probá de nuevo.");
      return;
    }
    setPedidos((antes) => antes.filter((p) => p.id !== id));
  };

  if (pedidos.length === 0) return null;

  return (
    <section className="mb-8 rounded-suave border-2 border-vino bg-white p-5">
      <h2 className="text-xl font-semibold text-tinta">
        {pedidos.length === 1
          ? "1 pedido de la tienda para revisar"
          : `${pedidos.length} pedidos de la tienda para revisar`}
      </h2>
      <p className="mt-1 text-base text-tinta-suave">
        Buscá el mismo código en el WhatsApp de la clienta.
      </p>

      {error && (
        <p className="mt-3 rounded-chico bg-negativo-suave px-4 py-2.5 text-base text-negativo">
          {error}
        </p>
      )}

      <ul className="mt-4 space-y-2.5">
        {pedidos.map((p) => (
          <li key={p.id} className="rounded-chico border border-vino/30 bg-vino-suave p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="text-lg font-semibold tracking-[0.06em] text-tinta">{p.codigo}</span>
              <span className="text-sm text-tinta-suave">{cuando(p.creado_en)}</span>
            </div>

            <ul className="mt-1.5 space-y-0.5 text-base text-tinta">
              {p.items.map((i, n) => (
                <li key={n}>
                  {i.cantidad} × {i.marca} {i.nombre}
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-base font-semibold text-tinta">
              Total {formatearPrecio(p.total)}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={trabajando === p.id}
                onClick={() => marcar(p.id, "recibido")}
                className="flex min-h-11 items-center gap-2 rounded-full bg-vino px-6 text-base font-semibold text-crema disabled:opacity-50"
              >
                <IconoCheck className="h-4 w-4" />
                Me llegó el WhatsApp
              </button>
              <button
                type="button"
                disabled={trabajando === p.id}
                onClick={() => marcar(p.id, "no-llego")}
                className="min-h-11 rounded-full px-4 text-base text-tinta-suave underline disabled:opacity-50"
              >
                No llegó
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
