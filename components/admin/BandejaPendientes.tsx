"use client";

import { useCallback, useEffect, useState } from "react";
import { formatearFechaLarga } from "@/lib/fechas";
import { formatearPrecio } from "@/lib/tratamientos";
import {
  linkWhatsAppA,
  mensajeTurnoAceptado,
  mensajeTurnoRechazado,
} from "@/lib/whatsapp";
import { IconoCheck } from "../iconos";

type Pendiente = {
  id: string;
  fecha: string;
  hora: string;
  cliente: string | null;
  telefono: string | null;
  tratamiento: string | null;
  precio: number | null;
  creado_en: string;
  vencido: boolean;
};

/**
 * Los pedidos sin responder, de todos los dias juntos.
 *
 * El panel de turnos muestra un dia por vez. Un pedido para dentro de
 * tres semanas no aparecia en ningun lado: Valen se enteraba solo por el
 * WhatsApp de la clienta, y si ese mensaje se le pasaba, el horario
 * quedaba tomado y la clienta esperando una respuesta que no llegaba.
 *
 * Va arriba de todo y solo cuando hay algo que responder: un cajon vacio
 * ocupando media pantalla todos los dias se vuelve invisible enseguida.
 */
export default function BandejaPendientes({
  onCambio,
}: {
  /** Avisa al panel del dia para que se refresque si toca el mismo turno. */
  onCambio: () => void;
}) {
  const [pedidos, setPedidos] = useState<Pendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetch("/api/turnos/pendientes");
    if (res.ok) {
      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const responder = async (id: string, accion: "aceptar" | "liberar") => {
    setTrabajando(id);
    setError(null);

    const res = await fetch(
      accion === "aceptar" ? "/api/turnos/estado" : `/api/turnos/estado?id=${id}`,
      accion === "aceptar"
        ? {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, estado: "confirmado" }),
          }
        : { method: "DELETE" }
    );

    setTrabajando(null);

    if (!res.ok) {
      setError("No se pudo. Probá de nuevo.");
      return;
    }

    setPedidos((prev) => prev.filter((p) => p.id !== id));
    onCambio();
  };

  if (cargando || pedidos.length === 0) return null;

  const vencidos = pedidos.filter((p) => p.vencido).length;

  return (
    <section className="mb-8 rounded-suave border-2 border-vino bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold text-tinta">
          {pedidos.length === 1
            ? "1 pedido esperando respuesta"
            : `${pedidos.length} pedidos esperando respuesta`}
        </h2>
        {vencidos > 0 && (
          <span className="text-base text-tinta-suave">
            {vencidos === 1
              ? "1 lleva más de un día"
              : `${vencidos} llevan más de un día`}
          </span>
        )}
      </div>

      <p className="mt-1 text-base text-tinta-suave">
        Son de cualquier fecha, no solo del día que estés mirando.
      </p>

      {error && (
        <p className="mt-3 rounded-chico bg-negativo-suave px-4 py-2.5 text-base text-negativo">
          {error}
        </p>
      )}

      <ul className="mt-4 space-y-2.5">
        {pedidos.map((p) => (
          <li
            key={p.id}
            className={`rounded-chico border p-4 ${
              p.vencido ? "border-borde bg-crema-oscuro" : "border-vino/30 bg-vino-suave"
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="text-lg font-semibold text-tinta">
                {formatearFechaLarga(p.fecha)} · {p.hora} hs
              </span>
              {p.vencido && (
                <span className="text-sm text-tinta-suave">
                  {/* El horario ya se libero solo en la web: la vista
                      turnos_publicos ignora los pendientes viejos. */}
                  sin responder hace más de un día · el horario ya se liberó
                </span>
              )}
            </div>

            <p className="mt-1 text-base text-tinta">
              {p.cliente || "Sin nombre"}
              {p.tratamiento ? ` · ${p.tratamiento}` : ""}
              {p.precio ? ` · ${formatearPrecio(p.precio)}` : ""}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={trabajando === p.id}
                onClick={() => responder(p.id, "aceptar")}
                className="flex min-h-11 items-center gap-2 rounded-full bg-vino px-6 text-base font-semibold text-crema disabled:opacity-50"
              >
                <IconoCheck className="h-4 w-4" />
                Aceptar
              </button>

              {p.telefono && (
                <a
                  href={linkWhatsAppA(
                    p.telefono,
                    mensajeTurnoAceptado({
                      fecha: p.fecha,
                      hora: p.hora,
                      cliente: p.cliente,
                      tratamiento: p.tratamiento,
                    })
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center rounded-full border border-borde bg-white px-5 text-base text-tinta-suave hover:border-vino hover:text-vino"
                >
                  Avisarle que sí
                </a>
              )}

              {p.telefono && (
                <a
                  href={linkWhatsAppA(
                    p.telefono,
                    mensajeTurnoRechazado({
                      fecha: p.fecha,
                      hora: p.hora,
                      cliente: p.cliente,
                    })
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => void responder(p.id, "liberar")}
                  className="flex min-h-11 items-center rounded-full border border-borde bg-white px-5 text-base text-tinta-suave hover:border-vino hover:text-vino"
                >
                  Avisar que no y liberar
                </a>
              )}

              <button
                type="button"
                disabled={trabajando === p.id}
                onClick={() => responder(p.id, "liberar")}
                className="min-h-11 rounded-full px-4 text-base text-tinta-suave underline disabled:opacity-50"
              >
                {p.telefono ? "Liberar sin avisar" : "Liberar"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
