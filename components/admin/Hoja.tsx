"use client";

import { useEffect } from "react";

/**
 * El panel que sube desde abajo para una accion del turno.
 *
 * Cobrar, mover, vincular una clienta y cancelar abrian cada uno su
 * formulario ADENTRO de la fila del turno. Cuatro formularios distintos
 * metidos en una lista: al abrir uno, todo lo que venia despues se iba
 * media pantalla para abajo, y con dos turnos seguidos ya no se sabia a
 * cual pertenecia lo que estabas mirando.
 *
 * Aca sube una sola cosa por vez, tapa la lista y no mueve nada de
 * lugar. Es el gesto que ya conoce cualquiera que use un celular.
 *
 * Se cierra de tres formas —el boton, el fondo y la tecla Escape—
 * porque la unica manera de salir no puede ser adivinar cual de los
 * botones de adentro era el de volver.
 */
export default function Hoja({
  titulo,
  onCerrar,
  children,
}: {
  titulo: string;
  onCerrar: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclado);

    /* El fondo no se mueve mientras la hoja esta abierta: si no, se
       arrastra la lista de atras creyendo que se arrastra el panel. */
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", alTeclado);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* El fondo tambien cierra. Es un boton de verdad para que el
          teclado pueda llegar a el. */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="absolute inset-0 bg-tinta/45"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        /* Pegada abajo en celular y flotando en pantalla ancha. El alto
           se limita para que un formulario largo scrollee adentro en vez
           de empujar el boton de guardar fuera de la pantalla. */
        className="animar-entrada relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-suave bg-crema px-5 pb-8 pt-5 shadow-suave sm:mb-8 sm:rounded-suave"
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold text-tinta">{titulo}</h3>
          <button
            type="button"
            onClick={onCerrar}
            className="-mr-1 -mt-1 flex min-h-11 shrink-0 items-center rounded-full px-4 text-base text-tinta-suave hover:text-vino"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
