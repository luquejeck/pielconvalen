"use client";

import { useCallback, useEffect, useState } from "react";
import { claveFecha, sumarDias } from "@/lib/fechas";
import { clienteNavegador } from "@/lib/supabase";
import { linkRecordatorio } from "@/lib/whatsapp";

type TurnoRecordar = {
  id: string;
  hora: string;
  cliente: string | null;
  telefono: string | null;
  tratamiento: string | null;
  recordado_en: string | null;
};

/**
 * Recordatorios del dia siguiente.
 *
 * No los manda solo: WhatsApp no deja enviar mensajes automaticos sin la
 * API de empresa de Meta, que se paga por mensaje y exige aprobar cada
 * plantilla. Asi que el panel arma la lista con los mensajes ya escritos
 * y Valen los despacha de a uno, desde su propio numero.
 *
 * Solo aparece cuando hay algo que hacer: si no hay turnos mañana, o ya
 * les escribio a todas, la tarjeta no se muestra.
 */
export default function Recordatorios() {
  const supabase = clienteNavegador();
  const manana = claveFecha(sumarDias(new Date(), 1));

  const [turnos, setTurnos] = useState<TurnoRecordar[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from("turnos")
      .select("id, hora, cliente, telefono, tratamiento, recordado_en")
      .eq("fecha", manana)
      .neq("estado", "bloqueado")
      .order("hora");

    setTurnos((data as TurnoRecordar[]) ?? []);
    setCargando(false);
  }, [manana, supabase]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** Marca el aviso como enviado en cuanto se abre WhatsApp. */
  const marcarEnviado = async (id: string) => {
    await supabase
      .from("turnos")
      .update({ recordado_en: new Date().toISOString() })
      .eq("id", id);
    await cargar();
  };

  const deshacer = async (id: string) => {
    await supabase.from("turnos").update({ recordado_en: null }).eq("id", id);
    await cargar();
  };

  // Sin telefono no hay a quien escribirle.
  const contactables = turnos.filter((t) => t.telefono);
  const pendientes = contactables.filter((t) => !t.recordado_en);

  if (cargando || contactables.length === 0) return null;

  return (
    <section className="mb-6 rounded-2xl border border-vino/25 bg-vino-suave p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-vino">Recordatorios de mañana</h2>
        <p className="text-sm text-tinta-suave">
          {pendientes.length > 0
            ? `${pendientes.length} sin avisar`
            : "Ya les escribiste a todas ✓"}
        </p>
      </div>

      <ul className="mt-4 space-y-2">
        {contactables.map((t) => {
          const enviado = Boolean(t.recordado_en);

          return (
            <li
              key={t.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-borde bg-white px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-tinta">
                  {t.hora} hs · {t.cliente ?? "Sin nombre"}
                </p>
                {t.tratamiento && (
                  <p className="truncate text-sm text-tinta-suave">{t.tratamiento}</p>
                )}
              </div>

              {enviado ? (
                <button
                  type="button"
                  onClick={() => deshacer(t.id)}
                  className="shrink-0 rounded-full border border-borde px-4 py-2 text-sm text-tinta-suave hover:border-vino hover:text-vino"
                >
                  Avisada ✓
                </button>
              ) : (
                <a
                  href={linkRecordatorio({
                    telefono: t.telefono!,
                    nombre: t.cliente,
                    hora: t.hora,
                    tratamiento: t.tratamiento,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => marcarEnviado(t.id)}
                  className="shrink-0 rounded-full bg-vino px-4 py-2 text-sm font-medium text-crema"
                >
                  Recordar
                </a>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-tinta-suave">
        Se abre WhatsApp con el mensaje escrito. Solo tenés que enviarlo.
      </p>
    </section>
  );
}
