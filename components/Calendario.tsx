"use client";

import { useEffect, useMemo, useState } from "react";
import type { Agenda } from "@/lib/config";
import {
  obtenerDisponibilidad,
  tieneLugar,
  turnoReservable,
  type MapaDisponibilidad,
} from "@/lib/disponibilidad";
import {
  claveFecha,
  DIAS_SEMANA,
  formatearFechaLarga,
  grillaDelMes,
  inicioDelDia,
  MESES,
  sumarDias,
} from "@/lib/fechas";

type Props = {
  agenda: Agenda;
  fecha: string | null;
  hora: string | null;
  onCambio: (fecha: string | null, hora: string | null) => void;
  /** Si esta deshabilitado (ej: falta elegir tratamiento) se ve atenuado. */
  deshabilitado?: boolean;
};

export default function Calendario({
  agenda,
  fecha,
  hora,
  onCambio,
  deshabilitado = false,
}: Props) {
  /** `ahora` se setea recien en el cliente para no romper la hidratacion. */
  const [ahora, setAhora] = useState<Date | null>(null);
  const [mesVisible, setMesVisible] = useState<Date | null>(null);
  const [disponibilidad, setDisponibilidad] = useState<MapaDisponibilidad>({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const hoy = new Date();
    setAhora(hoy);
    setMesVisible(new Date(hoy.getFullYear(), hoy.getMonth(), 1));

    let vigente = true;
    obtenerDisponibilidad(inicioDelDia(hoy))
      .then((datos) => {
        if (vigente) setDisponibilidad(datos);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  const limite = useMemo(
    () => (ahora ? inicioDelDia(sumarDias(ahora, agenda.ventanaDias)) : null),
    [ahora, agenda.ventanaDias]
  );

  const celdas = useMemo(
    () =>
      mesVisible
        ? grillaDelMes(mesVisible.getFullYear(), mesVisible.getMonth())
        : [],
    [mesVisible]
  );

  const turnosDelDia = fecha ? disponibilidad[fecha] ?? [] : [];

  const moverMes = (delta: number) => {
    setMesVisible((m) =>
      m ? new Date(m.getFullYear(), m.getMonth() + delta, 1) : m
    );
  };

  const puedeRetroceder =
    !!mesVisible &&
    !!ahora &&
    (mesVisible.getFullYear() > ahora.getFullYear() ||
      (mesVisible.getFullYear() === ahora.getFullYear() &&
        mesVisible.getMonth() > ahora.getMonth()));

  const puedeAvanzar =
    !!mesVisible &&
    !!limite &&
    new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 1) <= limite;

  const diaDisponible = (dia: Date): boolean => {
    if (!ahora || !limite) return false;
    const d = inicioDelDia(dia);
    if (d < inicioDelDia(ahora) || d > limite) return false;
    const clave = claveFecha(dia);
    return tieneLugar(disponibilidad[clave], clave, ahora, agenda.anticipacionMinimaHs);
  };

  if (!mesVisible || !ahora) return <EsqueletoCalendario />;

  return (
    <div
      className={
        deshabilitado ? "pointer-events-none opacity-40" : undefined
      }
      aria-disabled={deshabilitado}
    >
      {/* Mes */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => moverMes(-1)}
          disabled={!puedeRetroceder}
          aria-label="Mes anterior"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-borde text-2xl text-vino transition-colors hover:bg-vino-suave disabled:opacity-25"
        >
          &#8249;
        </button>

        <p className="text-xl font-semibold text-tinta">
          {MESES[mesVisible.getMonth()]} {mesVisible.getFullYear()}
        </p>

        <button
          type="button"
          onClick={() => moverMes(1)}
          disabled={!puedeAvanzar}
          aria-label="Mes siguiente"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-borde text-2xl text-vino transition-colors hover:bg-vino-suave disabled:opacity-25"
        >
          &#8250;
        </button>
      </div>

      {/* Dias de la semana */}
      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-lg font-medium text-tinta-suave">
        {DIAS_SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {/* Grilla */}
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {celdas.map((dia, i) => {
          if (!dia) return <span key={`vacio-${i}`} />;

          const clave = claveFecha(dia);
          const disponible = !cargando && diaDisponible(dia);
          const seleccionado = clave === fecha;

          return (
            <button
              key={clave}
              type="button"
              disabled={!disponible}
              onClick={() => onCambio(clave, null)}
              aria-pressed={seleccionado}
              aria-label={`${dia.getDate()} de ${MESES[dia.getMonth()]}${
                disponible ? "" : ", sin turnos"
              }`}
              /*
                El dia sin turnos iba en tinta-suave al 45%: 2:1 de
                contraste, que a los sesenta y con el brillo a la mitad
                es un renglon en blanco. No se distinguia de una celda
                vacia del mes, asi que se tocaba a ciegas.

                Ahora el numero se lee, y la diferencia la hace la forma
                antes que el color: el dia con lugar tiene recuadro y
                fondo blanco, el que no tiene queda hundido contra la
                tarjeta.
              */
              className={[
                "flex aspect-square items-center justify-center rounded-chico text-lg transition-colors",
                seleccionado
                  ? "bg-vino font-semibold text-crema"
                  : disponible
                    ? "border-2 border-vino/55 bg-white font-medium text-tinta hover:bg-vino-suave"
                    : "bg-crema-oscuro/60 text-tinta-suave",
              ].join(" ")}
            >
              {dia.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-lg leading-snug text-tinta-suave">
        {cargando
          ? "Buscando turnos disponibles…"
          : "Tocá un día con recuadro para ver los horarios de ese día."}
      </p>

      {/* Horarios */}
      {fecha && (
        <div className="animar-entrada mt-5 border-t border-borde pt-4">
          <p className="text-lg font-medium text-tinta">
            Tocá el horario que quieras · {formatearFechaLarga(fecha)}
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {turnosDelDia.map((turno) => {
              const libre = turnoReservable(fecha, turno, ahora, agenda.anticipacionMinimaHs);
              const activo = turno.hora === hora;

              return (
                <button
                  key={turno.hora}
                  type="button"
                  disabled={!libre}
                  onClick={() => onCambio(fecha, turno.hora)}
                  aria-pressed={activo}
                  className={[
                    "min-h-14 rounded-chico text-lg transition-colors",
                    activo
                      ? "bg-vino font-semibold text-crema"
                      : libre
                        ? "border-2 border-vino/55 bg-white font-medium text-tinta hover:bg-vino-suave"
                        /* Mismo motivo que en la grilla de dias: al 60%
                           la palabra "ocupado" no se leia, y con ella se
                           perdia el unico dato que explica por que ese
                           horario esta apagado. */
                        : "bg-crema-oscuro text-tinta-suave",
                  ].join(" ")}
                >
                  {turno.hora}
                  {!libre && (
                    <span className="mt-0.5 block text-sm">ocupado</span>
                  )}
                </button>
              );
            })}
          </div>

          {turnosDelDia.every((t) => !turnoReservable(fecha, t, ahora, agenda.anticipacionMinimaHs)) && (
            <p className="mt-4 text-lg text-tinta-suave">
              Ese día ya no tiene lugar. Probá con otro.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function EsqueletoCalendario() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="h-8 w-44 rounded-full bg-crema-oscuro" />
      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-crema-oscuro" />
        ))}
      </div>
    </div>
  );
}
