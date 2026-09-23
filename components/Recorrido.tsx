"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Si la clienta ya venia navegando por esta web o si acaba de llegar.
 *
 * Lo necesita el "Volver" de la ficha de producto. Llegando desde el
 * catalogo, volver tiene que ser volver de verdad —al mismo lugar, con
 * el scroll y los filtros como estaban—, y eso solo lo hace el historial
 * del navegador. Pero si entro directo por un link que le pasaron por
 * WhatsApp, "atras" la sacaria de la web: ahi tiene que ir al catalogo.
 *
 * El navegador no deja preguntar a donde lleva "atras", asi que se
 * cuenta aca: cada cambio de pagina adentro de la web suma uno. Vive en
 * el modulo y no en un estado porque tiene que sobrevivir al cambio de
 * pagina, y se reinicia solo con una carga completa, que es justo cuando
 * deja de valer.
 */
let navegaciones = 0;

export const vieneDeEstaWeb = () => navegaciones > 0;

export default function Recorrido() {
  const ruta = usePathname();
  /* Se compara contra la ruta anterior y no se cuenta "cada vez que
     corre": en desarrollo React corre los efectos dos veces al montar, y
     eso contaba una navegacion que nunca paso. */
  const anterior = useRef(ruta);

  useEffect(() => {
    if (anterior.current !== ruta) {
      navegaciones++;
      anterior.current = ruta;
    }
  }, [ruta]);

  return null;
}
