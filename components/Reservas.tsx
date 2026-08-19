"use client";

import { useState } from "react";
import Calendario from "./Calendario";
import FondoImagen from "./FondoImagen";
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

  const manejarCambio = (nuevaFecha: string | null, nuevaHora: string | null) => {
    setFecha(nuevaFecha);
    setHora(nuevaHora);
  };

  /**
   * Bloquea el horario en la agenda apenas la clienta toca el boton,
   * sin frenar la apertura de WhatsApp: se dispara y sigue de largo.
   * `keepalive` hace que el pedido llegue aunque cambie de pestaña.
   */
  const reservarHorario = () => {
    void fetch("/api/turnos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha, hora, tratamientoId, nombre }),
      keepalive: true,
    }).catch(() => {
      // Si falla, el turno igual se coordina por WhatsApp.
    });
  };

  return (
    <section id="reservar" className="relative isolate py-12 md:py-16">
      <FondoImagen
        imagen="/imagenes/reservas.jpg"
        intensidad={55}
        velo="bg-linear-to-b from-crema/88 via-crema/82 to-crema"
      />

      <div className="contenedor">
        <h2 className="text-center text-3xl font-semibold text-tinta sm:text-4xl">
          Reservá tu turno
        </h2>
        <p className="mt-2 text-center text-lg text-tinta-suave">
          Tres pasos. Al final se abre WhatsApp con el mensaje ya escrito.
        </p>

        {/* En celular es una sola columna en orden 1-2-3.
            En PC el resumen queda fijo al costado, siempre a la vista. */}
        <div className="mx-auto mt-8 grid max-w-5xl items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            {/* ---------- Paso 1 ---------- */}
            <Paso numero={1} titulo="Elegí el tratamiento" />

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {TRATAMIENTOS.map((t) => {
                const activo = t.id === tratamientoId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTratamientoId(activo ? null : t.id)}
                    aria-pressed={activo}
                    className={`flex min-h-13 items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left text-base transition-colors ${
                      activo
                        ? "bg-vino text-crema"
                        : "border border-borde bg-white hover:border-vino"
                    }`}
                  >
                    <span className="font-medium">{t.nombreCorto}</span>
                    <span className={activo ? "text-crema/80" : "text-tinta-suave"}>
                      {formatearPrecio(t.precio)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ---------- Paso 2 ---------- */}
            <Paso numero={2} titulo="Elegí el día y la hora" />

            {!tratamiento ? (
              <p className="mt-3 rounded-2xl bg-crema-oscuro px-5 py-4 text-lg text-tinta">
                Primero elegí un tratamiento arriba.
              </p>
            ) : (
              <div className="tarjeta mt-3 p-4 sm:p-5">
                <Calendario fecha={fecha} hora={hora} onCambio={manejarCambio} />
              </div>
            )}
          </div>

          {/* ---------- Paso 3 ---------- */}
          <div className="lg:sticky lg:top-22">
            <Paso numero={3} titulo="Confirmá por WhatsApp" />

            <div className="mt-3 rounded-suave border border-rosa-medio/60 bg-rosa px-5 py-5 shadow-suave">
              <dl className="space-y-2 text-base">
                <Fila rotulo="Tratamiento" valor={tratamiento?.nombre} />
                <Fila
                  rotulo="Día"
                  valor={fecha ? formatearFechaLarga(fecha) : null}
                />
                <Fila rotulo="Hora" valor={hora ? `${hora} hs` : null} />
                <Fila
                  rotulo="Precio"
                  valor={tratamiento ? formatearPrecio(tratamiento.precio) : null}
                />
              </dl>

              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre (opcional)"
                autoComplete="given-name"
                aria-label="Tu nombre"
                className="mt-4 min-h-13 w-full rounded-2xl border border-borde bg-white px-4 text-base text-tinta outline-none transition-colors placeholder:text-tinta-suave/60 focus:border-vino"
              />

              {completo ? (
                <a
                  href={linkWhatsApp({
                    tratamiento: tratamiento!,
                    fecha: fecha!,
                    hora: hora!,
                    nombre,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={reservarHorario}
                  className="boton-principal mt-3 w-full"
                >
                  <IconoWhatsApp className="h-5 w-5" />
                  Confirmar turno
                </a>
              ) : (
                <p className="mt-3 rounded-full bg-vino/15 px-6 py-3.5 text-center text-base text-tinta-suave">
                  Completá los pasos 1 y 2
                </p>
              )}

              <p className="mt-2.5 text-center text-sm text-tinta-suave">
                Queda confirmado cuando Valen te responde.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Paso({ numero, titulo }: { numero: number; titulo: string }) {
  return (
    <div className="mt-6 flex items-center gap-3 first:mt-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-vino text-base font-medium text-crema">
        {numero}
      </span>
      <h3 className="text-xl font-semibold text-tinta">{titulo}</h3>
    </div>
  );
}

function Fila({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-tinta-suave">{rotulo}</dt>
      <dd
        className={
          valor ? "text-right font-medium text-tinta" : "text-tinta-suave/60"
        }
      >
        {valor ?? "—"}
      </dd>
    </div>
  );
}
