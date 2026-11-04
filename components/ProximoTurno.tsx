"use client";

import { useEffect, useState } from "react";
import { obtenerDisponibilidad, turnoReservable } from "@/lib/disponibilidad";
import { desdeClave, formatearFechaLarga, inicioDelDia } from "@/lib/fechas";
import { useReserva } from "./ReservaContext";

/**
 * "Próximo turno libre: jueves 6 de noviembre, 10:00" — en el hero.
 *
 * Es el dato que mas empuja a reservar y hasta ahora solo se veia
 * bajando hasta el calendario. Lee la misma agenda que el calendario
 * (/api/disponibilidad), asi que nunca promete un horario que no esta.
 *
 * Mientras carga ocupa su lugar vacio (min-h): no empuja los botones
 * cuando aparece. Si no hay ningun lugar en la ventana, no dice nada:
 * "sin turnos" en la primera pantalla espanta mas de lo que informa.
 */
export default function ProximoTurno() {
  const { agenda } = useReserva();
  const [proximo, setProximo] = useState<{ fecha: string; hora: string } | null>(null);

  useEffect(() => {
    let vigente = true;
    const ahora = new Date();
    obtenerDisponibilidad(inicioDelDia(ahora)).then((mapa) => {
      if (!vigente) return;
      for (const fecha of Object.keys(mapa).sort()) {
        const turno = mapa[fecha].find((t) =>
          turnoReservable(fecha, t, ahora, agenda.anticipacionMinimaHs),
        );
        if (turno) {
          setProximo({ fecha, hora: turno.hora });
          return;
        }
      }
    });
    return () => {
      vigente = false;
    };
  }, [agenda.anticipacionMinimaHs]);

  return (
    <div className="flex min-h-11 justify-center">
      {proximo && (
        <a
          href="#reservar"
          className="proximo-turno inline-flex items-center gap-2.5 rounded-full border border-borde bg-papel/80 px-4 py-2 text-[0.9375rem] whitespace-nowrap sm:text-base text-tinta shadow-suave backdrop-blur-sm transition-colors hover:border-vino"
        >
          <span aria-hidden className="punto-vivo" />
          <span>
            Próximo turno libre:{" "}
            {/* En el celular la fecha corta, para que entre en un renglon. */}
            <b className="font-semibold">
              <span className="sm:hidden">{fechaCorta(proximo.fecha)}</span>
              <span className="hidden sm:inline">{formatearFechaLarga(proximo.fecha)}</span>
              , {proximo.hora}
            </b>
          </span>
        </a>
      )}
    </div>
  );
}

/** "viernes 6/11" */
function fechaCorta(clave: string): string {
  const d = desdeClave(clave);
  const dia = d.toLocaleDateString("es-AR", { weekday: "long" });
  return `${dia} ${d.getDate()}/${d.getMonth() + 1}`;
}
