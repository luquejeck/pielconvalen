"use client";

import { useEffect, useMemo, useState } from "react";
import { AGENDA } from "@/lib/config";
import {
  obtenerDisponibilidad,
  tieneLugar,
  turnoReservable,
  type MapaDisponibilidad,
} from "@/lib/disponibilidad";
import {
  claveFecha,
  DIAS_SEMANA,
  grillaDelMes,
  inicioDelDia,
  MESES,
  sumarDias,
} from "@/lib/fechas";

type Props = {
  fecha: string | null;
  hora: string | null;
  onCambio: (fecha: string | null, hora: string | null) => void;
  /** Si esta deshabilitado (ej: falta elegir tratamiento) se ve atenuado. */
  deshabilitado?: boolean;
};

export default function Calendario({
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
    () => (ahora ? inicioDelDia(sumarDias(ahora, AGENDA.ventanaDias)) : null),
    [ahora]
  );

  const celdas = useMemo(
    () =>
      mesVisible
        ? grillaDelMes(mesVisible.getFullYear(), mesVisible.getMonth())
        : [],
    [mesVisible]
  );

  const turnosDelDia = fecha ? disponibilidad[fecha] ?? [] : [];

  /* ----- Navegacion de meses ----- */
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

  /* ----- Estado de cada dia ----- */
  const diaDisponible = (dia: Date): boolean => {
    if (!ahora || !limite) return false;
    const d = inicioDelDia(dia);
    if (d < inicioDelDia(ahora) || d > limite) return false;
    const clave = claveFecha(dia);
    return tieneLugar(disponibilidad[clave], clave, ahora);
  };

  if (!mesVisible || !ahora) return <EsqueletoCalendario />;

  return (
    <div
      className={`transition-opacity ${
        deshabilitado ? "pointer-events-none opacity-40" : "opacity-100"
      }`}
      aria-disabled={deshabilitado}
    >
      {/* Encabezado del mes */}
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => moverMes(-1)}
          disabled={!puedeRetroceder}
          aria-label="Mes anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-borde text-lg text-vino transition-colors hover:bg-vino-suave disabled:cursor-not-allowed disabled:opacity-30"
        >
          &#8249;
        </button>

        <p className="font-display text-xl text-tinta">
          {MESES[mesVisible.getMonth()]}{" "}
          <span className="text-tinta-suave">{mesVisible.getFullYear()}</span>
        </p>

        <button
          type="button"
          onClick={() => moverMes(1)}
          disabled={!puedeAvanzar}
          aria-label="Mes siguiente"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-borde text-lg text-vino transition-colors hover:bg-vino-suave disabled:cursor-not-allowed disabled:opacity-30"
        >
          &#8250;
        </button>
      </div>

      {/* Dias de la semana */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-tinta-suave">
        {DIAS_SEMANA.map((d) => (
          <span key={d} className="py-2">
            {d}
          </span>
        ))}
      </div>

      {/* Grilla del mes */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {celdas.map((dia, i) => {
          if (!dia) return <span key={`vacio-${i}`} />;

          const clave = claveFecha(dia);
          const disponible = !cargando && diaDisponible(dia);
          const seleccionado = clave === fecha;
          const esHoy = clave === claveFecha(ahora);

          return (
            <button
              key={clave}
              type="button"
              disabled={!disponible}
              onClick={() => onCambio(clave, null)}
              aria-pressed={seleccionado}
              aria-label={`${dia.getDate()} de ${MESES[dia.getMonth()]} — ${
                disponible ? "con turnos" : "sin disponibilidad"
              }`}
              className={[
                "relative aspect-square rounded-xl text-sm transition-all",
                seleccionado
                  ? "bg-vino font-medium text-crema shadow-md shadow-vino/25"
                  : disponible
                    ? "bg-white text-tinta ring-1 ring-borde hover:ring-2 hover:ring-vino"
                    : "text-tinta-suave/35",
                esHoy && !seleccionado ? "ring-2 ring-vino/40" : "",
              ].join(" ")}
            >
              {dia.getDate()}
              {disponible && !seleccionado && (
                <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-vino/60" />
              )}
            </button>
          );
        })}
      </div>

      {cargando && (
        <p className="mt-4 text-center text-xs text-tinta-suave">
          Cargando disponibilidad...
        </p>
      )}

      {/* Referencias */}
      <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-tinta-suave">
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white ring-1 ring-borde" />
          Con turnos
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-vino" />
          Seleccionado
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-borde" />
          Sin disponibilidad
        </li>
      </ul>

      {/* Horarios del dia elegido */}
      {fecha && (
        <div className="animar-entrada mt-8 border-t border-borde pt-6">
          <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-vino/70">
            Horarios
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {turnosDelDia.map((turno) => {
              const libre = turnoReservable(fecha, turno, ahora);
              const activo = turno.hora === hora;

              return (
                <button
                  key={turno.hora}
                  type="button"
                  disabled={!libre}
                  onClick={() => onCambio(fecha, turno.hora)}
                  aria-pressed={activo}
                  title={libre ? "Disponible" : "Ocupado"}
                  className={[
                    "rounded-xl px-3 py-3 text-sm transition-all",
                    activo
                      ? "bg-vino font-medium text-crema shadow-md shadow-vino/25"
                      : libre
                        ? "bg-white text-tinta ring-1 ring-borde hover:ring-2 hover:ring-vino"
                        : "cursor-not-allowed bg-crema-oscuro text-tinta-suave/45 line-through",
                  ].join(" ")}
                >
                  {turno.hora}
                </button>
              );
            })}
          </div>

          {turnosDelDia.every((t) => !turnoReservable(fecha, t, ahora)) && (
            <p className="mt-4 text-sm text-tinta-suave">
              No quedan horarios libres ese dia. Probá con otra fecha.
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
      <div className="mb-5 h-7 w-40 rounded-full bg-crema-oscuro" />
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-crema-oscuro" />
        ))}
      </div>
    </div>
  );
}
