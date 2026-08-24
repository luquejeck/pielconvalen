"use client";

import { useState } from "react";
import TituloSeccion from "./TituloSeccion";
import Calendario from "./Calendario";
import FondoImagen from "./FondoImagen";
import GestionTurno from "./GestionTurno";
import { useReserva } from "./ReservaContext";
import { IconoCheck, IconoWhatsApp } from "./iconos";
import { CONSULTORIO } from "@/lib/config";
import { formatearFechaLarga } from "@/lib/fechas";
import { CONSULTA, buscarTratamiento, esConsulta, formatearPrecio } from "@/lib/tratamientos";
import { linkWhatsApp } from "@/lib/whatsapp";

export default function Reservas() {
  const { tratamientos, agenda, tratamientoId, setTratamientoId } = useReserva();
  const [fecha, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [enviado, setEnviado] = useState(false);
  /** Cambiar este numero fuerza al calendario a releer la agenda. */
  const [version, setVersion] = useState(0);

  const tratamiento = buscarTratamiento(tratamientos, tratamientoId);
  const consulta = tratamientos.find(esConsulta);
  const completo = Boolean(tratamiento && fecha && hora);

  const manejarCambio = (nuevaFecha: string | null, nuevaHora: string | null) => {
    setFecha(nuevaFecha);
    setHora(nuevaHora);
  };

  const enlace = completo
    ? linkWhatsApp({
        tratamiento: tratamiento!,
        fecha: fecha!,
        hora: hora!,
        nombre,
      })
    : "";

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
    setEnviado(true);
  };

  const empezarDeNuevo = () => {
    setEnviado(false);
    setFecha(null);
    setHora(null);
    setVersion((v) => v + 1); // el calendario vuelve a pedir la agenda
  };

  return (
    <section
      id="reservar"
      className="relative isolate border-t border-borde py-16 md:py-20 xl:py-24"
    >
      <FondoImagen
        imagen="/imagenes/reservas.jpg"
        intensidad={30}
        filtro="saturate(0.72) contrast(0.95)"
        velo="bg-linear-to-b from-crema/88 via-crema/82 to-crema"
      />

      <div className="contenedor">
        <TituloSeccion
          titulo="Reservá tu turno"
          bajada="Tres pasos. Al final se abre WhatsApp con el mensaje ya escrito."
        />

        {/* En celular es una sola columna en orden 1-2-3.
            En PC el resumen queda fijo al costado, siempre a la vista. */}
        <div className="mx-auto mt-14 grid max-w-5xl items-start gap-6 lg:grid-cols-[1.15fr_0.85fr] xl:max-w-none">
          <div>
            {/* ---------- Paso 1 ---------- */}
            <Paso numero={1} titulo="Elegí el tratamiento" />

            <p className="mt-2 text-lg text-tinta-suave">
              Tocá una opción para elegirla.
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {tratamientos.filter((t) => !esConsulta(t)).map((t) => {
                const activo = t.id === tratamientoId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTratamientoId(activo ? null : t.id)}
                    aria-pressed={activo}
                    className={`flex min-h-14 items-center gap-3 rounded-chico border-2 px-4 py-2.5 text-left text-lg transition-colors ${
                      activo
                        ? "border-vino bg-vino text-white"
                        : "border-borde bg-white hover:border-vino hover:bg-vino-suave"
                    }`}
                  >
                    {/*
                      El circulito dice "esto se elige". Sin el, un recuadro
                      con texto no se lee como algo que haya que tocar.
                    */}
                    <span
                      aria-hidden
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        activo ? "border-white bg-white" : "border-vino/45"
                      }`}
                    >
                      {activo && (
                        <IconoCheck className="h-3.5 w-3.5 text-vino" />
                      )}
                    </span>

                    <span className="font-medium">{t.nombreCorto}</span>
                    <span
                      className={`ml-auto ${
                        activo ? "text-white/85" : "text-tinta-suave"
                      }`}
                    >
                      {formatearPrecio(t.precio)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/*
              La consulta no es una opcion mas de la lista: es la salida
              para quien se abruma con los nombres tecnicos. Va a lo ancho
              y con peso propio, no como un chip mas entre seis.
            */}
            {consulta && (
              <button
                type="button"
                onClick={() => setTratamientoId(consulta.id)}
                aria-pressed={tratamientoId === consulta.id}
                className={`mt-3 flex min-h-14 w-full items-center justify-center gap-3 rounded-chico border-2 px-5 py-3 text-lg font-semibold transition-colors ${
                  tratamientoId === consulta.id
                    ? "border-vino bg-vino text-white"
                    : "border-vino bg-vino-suave text-vino hover:bg-vino hover:text-white"
                }`}
              >
                {tratamientoId === consulta.id
                  ? "Elegido: que Valen me recomiende ✓"
                  : "No sé cuál elegir · que Valen me recomiende"}
              </button>
            )}

            {/* ---------- Paso 2 ---------- */}
            <Paso numero={2} titulo="Elegí el día y la hora" />

            {!tratamiento ? (
              <div className="mt-3 rounded-chico bg-crema-oscuro px-5 py-4">
                <p className="text-lg text-tinta">
                  Primero elegí un tratamiento arriba.
                </p>
              </div>
            ) : (
              <div className="tarjeta mt-3 p-4 sm:p-5">
                <Calendario
                  key={version}
                  agenda={agenda}
                  fecha={fecha}
                  hora={hora}
                  onCambio={manejarCambio}
                />
              </div>
            )}
          </div>

          {/* ---------- Paso 3 ---------- */}
          <div className="lg:sticky lg:top-22">
            <Paso numero={3} titulo="Confirmá por WhatsApp" />

            {enviado ? (
              <TurnoEnviado
                enlace={enlace}
                detalle={`${tratamiento?.nombre} · ${
                  fecha ? formatearFechaLarga(fecha) : ""
                } · ${hora} hs`}
                onEmpezarDeNuevo={empezarDeNuevo}
              />
            ) : (
              <div className="mt-3 rounded-suave border border-borde bg-vino-suave px-5 py-5 shadow-suave">
                <dl className="space-y-2 text-lg">
                  <Fila rotulo="Tratamiento" valor={tratamiento?.nombre} />
                  <Fila
                    rotulo="Día"
                    valor={fecha ? formatearFechaLarga(fecha) : null}
                  />
                  <Fila rotulo="Hora" valor={hora ? `${hora} hs` : null} />
                  <Fila
                    rotulo="Precio"
                    valor={
                      tratamiento
                        ? esConsulta(tratamiento)
                          ? "Se define en el momento"
                          : formatearPrecio(tratamiento.precio)
                        : null
                    }
                  />
                </dl>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre (opcional)"
                  autoComplete="given-name"
                  aria-label="Tu nombre"
                  className="mt-4 min-h-13 w-full rounded-chico border border-borde bg-white px-4 text-lg text-tinta outline-none transition-colors placeholder:text-tinta-suave/60 focus:border-vino"
                />

                {completo ? (
                  <>
                    {/*
                      El salto de app asusta si no se avisa: la clienta toca
                      un boton y de golpe esta en otro lado. Se le cuenta
                      antes, y se aclara que el mensaje no se manda solo.
                    */}
                    <p
                      id="aviso-whatsapp"
                      className="mt-4 flex items-start gap-2.5 rounded-chico bg-white px-4 py-3 text-lg leading-snug text-tinta"
                    >
                      <IconoWhatsApp className="mt-1 h-5 w-5 shrink-0 text-vino" />
                      <span>
                        Al tocar se abre <b>WhatsApp</b> con el mensaje ya
                        escrito. Lo enviás vos. Esta página queda abierta.
                      </span>
                    </p>

                    <a
                      href={enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={reservarHorario}
                      aria-describedby="aviso-whatsapp"
                      className="boton-principal mt-3 w-full"
                    >
                      <IconoWhatsApp className="h-5 w-5" />
                      Abrir WhatsApp y confirmar
                    </a>
                  </>
                ) : (
                  <p className="mt-3 rounded-full bg-vino/12 px-6 py-3.5 text-center text-lg text-tinta-suave">
                    Completá los pasos 1 y 2
                  </p>
                )}

                <p className="mt-3 text-center text-lg leading-snug text-tinta-suave">
                  Queda confirmado cuando Valen te responde.
                </p>

                <p className="mt-4 border-t border-vino/15 pt-4 text-lg leading-snug text-tinta-suave">
                  {CONSULTORIO.comoVenir}
                </p>
              </div>
            )}
          </div>
        </div>

        <GestionTurno />
      </div>
    </section>
  );
}

/** Estado posterior a tocar "Confirmar": que pasa ahora y como salir de acá. */
function TurnoEnviado({
  enlace,
  detalle,
  onEmpezarDeNuevo,
}: {
  enlace: string;
  detalle: string;
  onEmpezarDeNuevo: () => void;
}) {
  return (
    <div className="animar-entrada mt-3 rounded-suave border border-vino/25 bg-vino-suave px-5 py-6 shadow-suave">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-vino text-white">
        <IconoCheck className="h-5 w-5" />
      </span>

      <h4 className="mt-4 text-xl font-semibold text-tinta">
        Tu horario quedó reservado
      </h4>

      <p className="mt-2 text-lg leading-snug text-tinta">{detalle}</p>

      <p className="mt-3 text-lg leading-snug text-tinta-suave">
        Ya nadie más puede tomarlo. Queda confirmado cuando Valen te responda el
        mensaje de WhatsApp.
      </p>

      <div className="mt-5 flex flex-col gap-2">
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          className="boton-suave w-full"
        >
          <IconoWhatsApp className="h-5 w-5" />
          Abrir WhatsApp de nuevo
        </a>

        <button
          type="button"
          onClick={onEmpezarDeNuevo}
          className="min-h-12 rounded-full border border-borde bg-white px-6 text-lg text-tinta-suave transition-colors hover:border-vino hover:text-vino"
        >
          Reservar otro turno
        </button>
      </div>
    </div>
  );
}

function Paso({ numero, titulo }: { numero: number; titulo: string }) {
  return (
    <div className="mt-6 flex items-center gap-3 first:mt-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-vino text-lg font-medium text-white">
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
