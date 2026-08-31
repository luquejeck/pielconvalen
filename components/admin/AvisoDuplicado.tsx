"use client";

import { useEffect, useState } from "react";
import { formatearFechaLarga } from "@/lib/fechas";
import { formatearPrecio } from "@/lib/tratamientos";

/**
 * "Esto ya lo cargaste": el aviso que evita anotar dos veces la misma
 * atencion.
 *
 * Tres pantallas registran que Valen atendio a alguien —la ficha de la
 * clienta, Economia y el cobro del turno— y ninguna sabe de las otras.
 * Cargar dos no da ningun error: la ficha queda diciendo que la clienta
 * vino dos veces, o Economia contando el mismo ingreso dos veces.
 *
 * NO bloquea. Muestra lo que ya existe y deja seguir: una clienta puede
 * volver a la semana, o comprar un producto el dia que se atiende. Lo
 * que no puede es que el sistema se lo oculte.
 */

type Hallazgo = {
  id: string;
  fecha: string;
  detalle: string;
  monto: number | null;
  origen: string;
};

export default function AvisoDuplicado({
  clienteId,
  fecha,
  /** Que no se avise a si mismo cuando ya existe la fila que se edita. */
  ignorar = [],
  onCambio,
}: {
  clienteId: string | null;
  fecha: string;
  ignorar?: string[];
  onCambio?: (cantidad: number) => void;
}) {
  const [hallazgos, setHallazgos] = useState<Hallazgo[]>([]);

  useEffect(() => {
    if (!clienteId || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      setHallazgos([]);
      onCambio?.(0);
      return;
    }

    /* `vigente` corta la carrera entre dos consultas: si cambia la fecha
       mientras vuelve la anterior, la vieja no pisa a la nueva. */
    let vigente = true;

    void (async () => {
      try {
        const res = await fetch(
          `/api/clientes/actividad?cliente_id=${clienteId}&fecha=${fecha}`
        );
        if (!res.ok) throw new Error("no ok");
        const datos = await res.json();
        if (!vigente) return;

        const lista: Hallazgo[] = [
          ...(datos.sesiones ?? []).map((s: {
            id: string;
            fecha: string;
            tratamiento: string | null;
            precio: number | null;
          }) => ({
            id: s.id,
            fecha: s.fecha,
            detalle: s.tratamiento ?? "Sesión",
            monto: s.precio,
            origen: "sesión en la ficha",
          })),
          ...(datos.ingresos ?? []).map((m: {
            id: string;
            fecha: string;
            descripcion: string | null;
            monto: number | null;
          }) => ({
            id: m.id,
            fecha: m.fecha,
            detalle: m.descripcion ?? "Ingreso",
            monto: m.monto,
            origen: "ingreso en Economía",
          })),
        ].filter((h) => !ignorar.includes(h.id));

        setHallazgos(lista);
        onCambio?.(lista.length);
      } catch {
        /* Si la consulta falla no se inventa un aviso: se sigue como
           antes. Un falso "está todo bien" es mejor que un falso
           "ojo, duplicado". */
        if (!vigente) return;
        setHallazgos([]);
        onCambio?.(0);
      }
    })();

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, fecha, ignorar.join(",")]);

  if (hallazgos.length === 0) return null;

  return (
    <div className="mt-4 rounded-chico border border-vino/30 bg-vino-suave px-4 py-3">
      <p className="text-base font-semibold text-vino">
        Esta clienta ya tiene algo cargado por estos días
      </p>

      <ul className="mt-2 space-y-1">
        {hallazgos.map((h) => (
          <li key={h.id} className="text-base text-tinta">
            {/* Con el dia de la semana: la ventana es de varios dias y
                "2026-08-31" no le dice a nadie si fue el lunes pasado. */}
            <span className="font-medium">{formatearFechaLarga(h.fecha)}</span> ·{" "}
            {h.detalle}
            {h.monto ? ` · ${formatearPrecio(h.monto)}` : ""}{" "}
            <span className="text-tinta-suave">({h.origen})</span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-base text-tinta-suave">
        Si es la misma atención, no la cargues de nuevo. Si vino más de una vez,
        seguí tranquila.
      </p>
    </div>
  );
}
