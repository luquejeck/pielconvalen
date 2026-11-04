import type { ConfiguracionWeb } from "@/lib/consultorio";
import { IconoBrillo } from "./iconos";

/**
 * Una cinta que corre despacio debajo del hero con las garantias.
 *
 * Son los mismos datos que ya estaban en la pagina (credencial,
 * protocolo, barrio), dichos de corrido justo debajo de la primera
 * pantalla: le da movimiento al corte entre el hero y el resto, y quien
 * no baja igual se lleva "UBA · esterilizado · cabina privada".
 *
 * La lista va dos veces para que el loop no tenga salto; la copia es
 * aria-hidden, asi un lector de pantalla la lee una sola vez. Con
 * "reducir movimiento" queda quieta y centrada. Se pausa al pasar el
 * mouse.
 */
export default function FranjaConfianza({
  consultorio: CONSULTORIO,
}: {
  consultorio: ConfiguracionWeb;
}) {
  const barrio = CONSULTORIO.direccion.split(",")[1]?.trim();
  const items = [
    CONSULTORIO.titulo,
    ...CONSULTORIO.protocolo,
    "Productos originales de Corea",
    barrio && `Consultorio en ${barrio}`,
  ].filter(Boolean) as string[];

  const lista = (copia: boolean) => (
    <ul aria-hidden={copia || undefined} className="franja-lista">
      {items.map((texto) => (
        <li key={texto} className="flex shrink-0 items-center gap-6">
          <span className="whitespace-nowrap">{texto}</span>
          <IconoBrillo className="h-4 w-4 text-vino/60" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="franja border-y border-borde bg-papel py-3.5 font-display text-sm font-medium tracking-[0.12em] text-tinta-suave uppercase sm:text-base">
      <div className="franja-pista">
        {lista(false)}
        {lista(true)}
      </div>
    </div>
  );
}
