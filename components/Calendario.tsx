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
import { IconoFlecha } from "./iconos";

/*
  El dia y el horario son dos pasos, y por eso dos componentes.

  Antes los horarios vivian adentro del calendario, en la misma tarjeta,
  bajo un renglon que decia "Tocá el horario que quieras". Para quien
  no esta acostumbrada a reservar por internet eso no era un paso: era
  letra chica al pie del calendario, y el paso 2 que se veia era
  "Confirmá por WhatsApp". Tocaba el dia, bajaba al paso 2 y se quedaba
  esperando un horario que nunca habia elegido.

  Los dos leen la misma agenda, asi que la agenda se pide UNA vez, aca
  arriba, y se les pasa a los dos.
*/

type Disponibilidad = {
  /** Se setea recien en el cliente para no romper la hidratacion. */
  ahora: Date | null;
  disponibilidad: MapaDisponibilidad;
  cargando: boolean;
};

/** Cambiar `version` vuelve a pedir la agenda: los horarios que se ven
    pasan a ser los de ahora. */
export function useDisponibilidad(version: number): Disponibilidad {
  const [estado, setEstado] = useState<Disponibilidad>({
    ahora: null,
    disponibilidad: {},
    cargando: true,
  });

  useEffect(() => {
    const hoy = new Date();
    setEstado((e) => ({ ...e, ahora: hoy, cargando: true }));

    let vigente = true;
    obtenerDisponibilidad(inicioDelDia(hoy))
      .then((datos) => {
        if (vigente) setEstado((e) => ({ ...e, disponibilidad: datos }));
      })
      .finally(() => {
        if (vigente) setEstado((e) => ({ ...e, cargando: false }));
      });

    return () => {
      vigente = false;
    };
  }, [version]);

  return estado;
}

type PropsCalendario = Disponibilidad & {
  agenda: Agenda;
  fecha: string | null;
  onElegirDia: (fecha: string) => void;
};

export default function Calendario({
  agenda,
  fecha,
  ahora,
  disponibilidad,
  cargando,
  onElegirDia,
}: PropsCalendario) {
  const [mesVisible, setMesVisible] = useState<Date | null>(null);

  /* Arranca en el mes de hoy, apenas se sabe cual es. */
  useEffect(() => {
    if (ahora && !mesVisible) {
      setMesVisible(new Date(ahora.getFullYear(), ahora.getMonth(), 1));
    }
  }, [ahora, mesVisible]);

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
    <div>
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
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-lg font-medium text-tinta-suave sm:gap-1.5">
        {DIAS_SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {/* Grilla */}
      <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-1.5">
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
              onClick={() => onElegirDia(clave)}
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
              /*
                48px de alto minimo en celular.

                Con `aspect-square` la celda medida en un telefono de 375
                daba 38px de lado: por debajo del minimo que se toca sin
                apuntar, y este es justo el gesto que decide si hay turno
                o no. La altura se fija primero y el cuadrado queda para
                pantalla ancha, donde sobra lugar.
              */
              className={[
                "flex min-h-12 items-center justify-center rounded-chico text-xl transition-colors sm:aspect-square sm:text-lg",
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
          : "Los días con recuadro tienen turnos libres."}
      </p>
    </div>
  );
}

type PropsHorarios = Disponibilidad & {
  agenda: Agenda;
  fecha: string | null;
  hora: string | null;
  onElegirHora: (hora: string) => void;
};

/**
 * El paso 2. Existe desde el principio, aunque todavia no haya dia.
 *
 * Si apareciera recien al elegir el dia, quien mira la pagina antes de
 * tocar nada ve "1 · Elegí el día" y "3 · Confirmá": no sabe que en el
 * medio hay que elegir la hora. Vacio, dice donde va a estar y que hace
 * falta para que aparezca.
 */
export function Horarios({
  agenda,
  fecha,
  hora,
  ahora,
  disponibilidad,
  onElegirHora,
}: PropsHorarios) {
  if (!fecha || !ahora) {
    return (
      <div className="mt-3 flex items-center gap-4 rounded-suave border-2 border-dashed border-borde bg-white/60 px-5 py-5">
        {/* La flecha apunta al calendario, que esta arriba. */}
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-crema-oscuro text-tinta-suave">
          <IconoFlecha className="h-5 w-5 -rotate-90" />
        </span>
        <p className="text-lg leading-snug text-tinta-suave">
          Primero tocá un día en el calendario. Acá van a aparecer sus
          horarios.
        </p>
      </div>
    );
  }

  const turnos = disponibilidad[fecha] ?? [];
  const sinLugar = turnos.every(
    (t) => !turnoReservable(fecha, t, ahora, agenda.anticipacionMinimaHs)
  );

  return (
    /*
      Con contorno vino mientras falta elegir: es lo que hay que tocar
      ahora, y tiene que verse de lejos. Elegida la hora, el contorno se
      va y la hora elegida queda en vino, como el dia arriba.

      `key` por fecha: al cambiar de dia la tarjeta vuelve a entrar con
      la animacion, y se nota que los horarios son otros.
    */
    <div
      key={fecha}
      className={`tarjeta animar-entrada mt-3 p-4 sm:p-5 ${
        hora ? "" : "outline-2 outline-vino"
      }`}
    >
      <p className="text-lg leading-snug text-tinta">
        Horarios para el{" "}
        <span className="font-semibold">{formatearFechaLarga(fecha)}</span>
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6">
        {turnos.map((turno) => {
          const libre = turnoReservable(fecha, turno, ahora, agenda.anticipacionMinimaHs);
          const activo = turno.hora === hora;

          return (
            <button
              key={turno.hora}
              type="button"
              disabled={!libre}
              onClick={() => onElegirHora(turno.hora)}
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
              {!libre && <span className="mt-0.5 block text-sm">ocupado</span>}
            </button>
          );
        })}
      </div>

      {sinLugar && (
        <p className="mt-4 text-lg text-tinta-suave">
          Ese día ya no tiene lugar. Tocá otro día en el calendario.
        </p>
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
