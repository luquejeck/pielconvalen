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
    <section id="reservar" className="relative isolate py-20 md:py-24">
      <FondoImagen
        imagen="/imagenes/reservas.jpg"
        intensidad={55}
        velo="bg-linear-to-b from-crema/85 via-crema/80 to-crema"
      />

      <div className="contenedor max-w-2xl">
        <h2 className="text-center text-3xl font-semibold text-tinta sm:text-4xl">
          Reservá tu turno
        </h2>
        <p className="mt-4 text-center text-lg text-tinta-suave">
          Son tres pasos. Al final se abre WhatsApp con el mensaje ya escrito.
        </p>

        {/* ---------- Paso 1 ---------- */}
        <Paso numero={1} titulo="Elegí el tratamiento" />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {TRATAMIENTOS.map((t) => {
            const activo = t.id === tratamientoId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTratamientoId(activo ? null : t.id)}
                aria-pressed={activo}
                className={`min-h-16 rounded-2xl px-5 py-3 text-left text-lg transition-colors ${
                  activo
                    ? "bg-vino text-crema"
                    : "border border-borde bg-white hover:border-vino"
                }`}
              >
                <span className="block font-medium">{t.nombreCorto}</span>
                <span
                  className={activo ? "text-crema/80" : "text-tinta-suave"}
                >
                  {formatearPrecio(t.precio)}
                </span>
              </button>
            );
          })}
        </div>

        {/* ---------- Paso 2 ---------- */}
        <Paso numero={2} titulo="Elegí el día y la hora" />

        {!tratamiento ? (
          <p className="mt-5 rounded-2xl bg-crema-oscuro px-6 py-5 text-lg text-tinta">
            Primero elegí un tratamiento arriba.
          </p>
        ) : (
          <div className="mt-5 rounded-suave border border-borde bg-white p-5 sm:p-7">
            <Calendario fecha={fecha} hora={hora} onCambio={manejarCambio} />
          </div>
        )}

        {/* ---------- Paso 3 ---------- */}
        <Paso numero={3} titulo="Confirmá por WhatsApp" />

        <div className="mt-5 rounded-suave bg-rosa/60 p-6 sm:p-8">
          <dl className="space-y-3 text-lg">
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

          <label className="mt-6 block">
            <span className="text-lg text-tinta">Tu nombre</span>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Opcional"
              autoComplete="given-name"
              className="mt-2 min-h-14 w-full rounded-2xl border border-borde bg-white px-5 text-lg text-tinta outline-none transition-colors placeholder:text-tinta-suave/60 focus:border-vino"
            />
          </label>

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
              className="boton-principal mt-6 w-full"
            >
              <IconoWhatsApp className="h-6 w-6" />
              Confirmar por WhatsApp
            </a>
          ) : (
            <p className="mt-6 min-h-14 w-full rounded-full bg-vino/20 px-8 py-4 text-center text-lg text-tinta-suave">
              Completá los pasos 1 y 2
            </p>
          )}

          <p className="mt-4 text-center text-base text-tinta-suave">
            El turno queda confirmado cuando Valen te responde.
          </p>
        </div>
      </div>
    </section>
  );
}

function Paso({ numero, titulo }: { numero: number; titulo: string }) {
  return (
    <div className="mt-12 flex items-center gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vino text-lg font-medium text-crema">
        {numero}
      </span>
      <h3 className="text-2xl font-semibold text-tinta">{titulo}</h3>
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
