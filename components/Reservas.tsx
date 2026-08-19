"use client";

import { useState } from "react";
import Calendario from "./Calendario";
import { useReserva } from "./ReservaContext";
import { IconoWhatsApp } from "./iconos";
import { formatearFechaLarga } from "@/lib/fechas";
import { buscarTratamiento, formatearPrecio, TRATAMIENTOS } from "@/lib/tratamientos";
import { linkWhatsApp } from "@/lib/whatsapp";

export default function Reservas() {
  const { tratamientoId, setTratamientoId } = useReserva();
  const [fecha, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");

  const tratamiento = buscarTratamiento(tratamientoId);
  const completo = Boolean(tratamiento && fecha && hora);

  const href = completo
    ? linkWhatsApp({ tratamiento: tratamiento!, fecha: fecha!, hora: hora!, nombre })
    : undefined;

  const manejarCambio = (nuevaFecha: string | null, nuevaHora: string | null) => {
    setFecha(nuevaFecha);
    setHora(nuevaHora);
  };

  return (
    <section id="reservar" className="bg-crema py-20 md:py-28">
      <div className="contenedor">
        <header className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-vino/70">
            Reservas
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-tinta md:text-5xl">
            Reservá tu turno
          </h2>
          <p className="mt-5 text-base leading-relaxed text-tinta-suave">
            Elegí tratamiento, día y horario. Al confirmar se abre WhatsApp con el
            mensaje listo para enviar: ahí terminamos de coordinar.
          </p>
        </header>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          {/* ---------- Columna izquierda: pasos 1 y 2 ---------- */}
          <div className="rounded-suave border border-borde bg-white/70 p-6 sm:p-8">
            {/* Paso 1 */}
            <Paso numero={1} titulo="Elegí el tratamiento" />

            <div className="mt-5 flex flex-wrap gap-2">
              {TRATAMIENTOS.map((t) => {
                const activo = t.id === tratamientoId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTratamientoId(activo ? null : t.id)}
                    aria-pressed={activo}
                    className={`rounded-full px-4 py-2.5 text-sm transition-all ${
                      activo
                        ? "bg-vino text-crema shadow-md shadow-vino/20"
                        : "border border-borde bg-crema text-tinta hover:border-vino/40"
                    }`}
                  >
                    {t.nombreCorto}
                  </button>
                );
              })}
            </div>

            {/* Paso 2 */}
            <div className="mt-10 border-t border-borde pt-8">
              <Paso numero={2} titulo="Elegí día y horario" />

              {!tratamiento && (
                <p className="mt-4 rounded-xl bg-rosa/60 px-4 py-3 text-sm text-tinta">
                  Primero seleccioná un tratamiento para ver la agenda.
                </p>
              )}

              <div className="mt-6">
                <Calendario
                  fecha={fecha}
                  hora={hora}
                  onCambio={manejarCambio}
                  deshabilitado={!tratamiento}
                />
              </div>
            </div>
          </div>

          {/* ---------- Columna derecha: resumen + CTA ---------- */}
          <aside className="rounded-suave border border-borde bg-rosa/50 p-6 sm:p-8 lg:sticky lg:top-24">
            <Paso numero={3} titulo="Confirmá por WhatsApp" />

            <dl className="mt-6 space-y-4 text-sm">
              <Fila
                rotulo="Tratamiento"
                valor={tratamiento?.nombre ?? "A elegir"}
                atenuado={!tratamiento}
              />
              <Fila
                rotulo="Fecha"
                valor={fecha ? formatearFechaLarga(fecha) : "A elegir"}
                atenuado={!fecha}
              />
              <Fila
                rotulo="Horario"
                valor={hora ? `${hora} hs` : "A elegir"}
                atenuado={!hora}
              />
              <Fila
                rotulo="Duración"
                valor={tratamiento?.duracion ?? "1.5 a 2 hs"}
                atenuado={!tratamiento}
              />
            </dl>

            <div className="mt-6 flex items-baseline justify-between border-t border-vino/15 pt-5">
              <span className="text-sm text-tinta-suave">Total</span>
              <span className="font-display text-3xl text-vino">
                {tratamiento ? formatearPrecio(tratamiento.precio) : "—"}
              </span>
            </div>

            <label className="mt-6 block">
              <span className="text-xs uppercase tracking-[0.18em] text-tinta-suave">
                Tu nombre (opcional)
              </span>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Sofía"
                autoComplete="given-name"
                className="mt-2 w-full rounded-xl border border-borde bg-crema px-4 py-3 text-sm text-tinta outline-none transition-colors placeholder:text-tinta-suave/50 focus:border-vino"
              />
            </label>

            {completo ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-vino px-6 py-4 text-base font-medium text-crema shadow-lg shadow-vino/25 transition-all hover:bg-vino-oscuro active:scale-[0.98]"
              >
                <IconoWhatsApp className="h-5 w-5" />
                Confirmar por WhatsApp
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-full bg-vino/25 px-6 py-4 text-base font-medium text-crema"
              >
                <IconoWhatsApp className="h-5 w-5" />
                Completá los pasos 1 y 2
              </button>
            )}

            <p className="mt-4 text-center text-xs leading-relaxed text-tinta-suave">
              El turno queda reservado cuando Valen te responde el mensaje.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Paso({ numero, titulo }: { numero: number; titulo: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-vino text-xs font-medium text-crema">
        {numero}
      </span>
      <h3 className="font-display text-xl text-tinta">{titulo}</h3>
    </div>
  );
}

function Fila({
  rotulo,
  valor,
  atenuado,
}: {
  rotulo: string;
  valor: string;
  atenuado?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-tinta-suave">{rotulo}</dt>
      <dd
        className={`text-right ${
          atenuado ? "text-tinta-suave/50" : "font-medium text-tinta"
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}
