"use client";

import { useCallback, useEffect, useState } from "react";
import { claveFecha, formatearFechaLarga, sumarDias } from "@/lib/fechas";
import { clienteNavegador } from "@/lib/supabase";
import { linkWhatsAppA } from "@/lib/whatsapp";

type TurnoManana = {
  id: string;
  fecha: string;
  hora: string;
  cliente: string | null;
  telefono: string | null;
  tratamiento: string | null;
};

/**
 * A quien hay que recordarle el turno de mañana.
 *
 * El recordatorio automatico de verdad —que el mensaje salga solo— exige
 * la API de WhatsApp Business, que se paga y hay que dar de alta. Sin
 * eso, prometer "recordatorios automaticos" seria mentir.
 *
 * Esto hace lo que si se puede hacer hoy y resuelve el mismo problema:
 * junta los turnos de mañana en un solo lugar y deja el mensaje escrito.
 * Valen toca, se abre WhatsApp, manda. Diez segundos por clienta en vez
 * de buscar cada telefono en la agenda.
 */
export default function Recordatorios({ direccion }: { direccion: string }) {
  const supabase = clienteNavegador();
  const [turnos, setTurnos] = useState<TurnoManana[]>([]);
  const [avisados, setAvisados] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState(true);

  const manana = claveFecha(sumarDias(new Date(), 1));

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from("turnos")
      .select("id, fecha, hora, cliente, telefono, tratamiento")
      .eq("fecha", manana)
      .eq("estado", "confirmado")
      .order("hora");

    setTurnos((data as TurnoManana[]) ?? []);
    setCargando(false);
  }, [supabase, manana]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const mensaje = (t: TurnoManana) =>
    [
      `${t.cliente?.trim() ? `Hola ${t.cliente.trim()}!` : "Hola!"} Te recuerdo tu turno de mañana 🌿`,
      ``,
      t.tratamiento ? `• ${t.tratamiento}` : null,
      `• ${formatearFechaLarga(t.fecha)}`,
      `• ${t.hora} hs`,
      ``,
      `Te espero en ${direccion}. Si no vas a poder venir, avisame así libero el lugar.`,
    ]
      .filter((l) => l !== null)
      .join("\n");

  if (cargando || turnos.length === 0) return null;

  const conTelefono = turnos.filter((t) => t.telefono);

  return (
    <section className="mb-8 rounded-suave border border-borde bg-crema-oscuro p-5">
      <h2 className="text-xl font-semibold text-tinta">
        Mañana atendés a {turnos.length}
        {turnos.length === 1 ? " clienta" : " clientas"}
      </h2>
      <p className="mt-1 text-base text-tinta-suave">
        {conTelefono.length === 0
          ? "Ninguna tiene teléfono cargado, así que no se les puede avisar desde acá."
          : "Tocá para abrir WhatsApp con el recordatorio ya escrito."}
      </p>

      <ul className="mt-4 space-y-2">
        {turnos.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-chico bg-white px-4 py-3"
          >
            <span className="text-lg font-semibold text-tinta">{t.hora}</span>
            <span className="min-w-0 flex-1 text-base text-tinta">
              {t.cliente || "Sin nombre"}
              {t.tratamiento ? ` · ${t.tratamiento}` : ""}
            </span>

            {t.telefono ? (
              <a
                href={linkWhatsAppA(t.telefono, mensaje(t))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  setAvisados((prev) => new Set(prev).add(t.id))
                }
                className={`min-h-11 rounded-full px-5 py-2.5 text-base font-medium ${
                  avisados.has(t.id)
                    ? "bg-positivo-suave text-positivo"
                    : "bg-vino text-crema"
                }`}
              >
                {/* Se marca al tocar, no al enviar: el envio pasa dentro
                    de WhatsApp y desde aca no hay forma de saberlo. Sirve
                    igual para no repetir a quien ya se le abrio. */}
                {avisados.has(t.id) ? "Avisada ✓" : "Recordarle"}
              </a>
            ) : (
              <span className="text-sm text-tinta-suave">sin teléfono</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
