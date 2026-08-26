"use client";

import { linkCancelarTurno, linkMoverTurno } from "@/lib/whatsapp";
import { useReserva } from "./ReservaContext";

/**
 * Para quien YA tiene turno. Va debajo del modulo de reservas porque
 * es justo donde vuelve a entrar la persona que quiere cambiar algo:
 * si no encuentra como hacerlo, o no avisa o reserva otro turno encima.
 */
export default function GestionTurno() {
  const { agenda, consultorio } = useReserva();

  return (
    <div className="mx-auto mt-10 max-w-5xl xl:max-w-none rounded-suave border border-borde bg-crema-oscuro px-5 py-5 sm:px-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-tinta">
            ¿Ya tenés un turno?
          </h3>
          <p className="mt-1 text-lg leading-snug text-tinta-suave">
            Avisá con al menos {agenda.anticipacionMinimaHs} horas para que el
            lugar lo pueda tomar otra persona. Los dos botones abren WhatsApp
            con el mensaje escrito.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <a
            href={linkMoverTurno(consultorio.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="boton-suave"
          >
            Cambiar de día
          </a>

          <a
            href={linkCancelarTurno(consultorio.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center rounded-full border border-borde bg-white px-6 text-lg text-tinta-suave transition-colors hover:border-vino hover:text-vino"
          >
            Cancelar turno
          </a>
        </div>
      </div>
    </div>
  );
}
