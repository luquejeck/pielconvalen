"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { Agenda } from "@/lib/config";
import type { ConfiguracionWeb } from "@/lib/consultorio";
import type { Tratamiento } from "@/lib/tratamientos";

type ContextoReserva = {
  /** Catalogo vivo, leido de la base en el servidor */
  tratamientos: Tratamiento[];
  agenda: Agenda;
  /**
   * Datos del consultorio, tambien vivos.
   *
   * Los componentes de servidor los leen directo con
   * `obtenerConfiguracion()`. Los del navegador —Tratamientos, Reservas,
   * el boton flotante— no pueden, asi que viajan por aca: es el mismo
   * camino que ya usaban el catalogo y la agenda.
   */
  consultorio: ConfiguracionWeb;
  /**
   * Baja al modulo de reservas.
   *
   * Antes esto ademas elegia un tratamiento: la clienta tocaba una
   * tarjeta y ese tratamiento quedaba cargado en el turno. Ya no se
   * elige de antemano —todos los turnos entran como consulta y el
   * tratamiento lo define Valen despues de mirarle la piel—, asi que lo
   * unico que queda es el scroll.
   */
  irAReservar: () => void;
};

const Contexto = createContext<ContextoReserva | null>(null);

export function ReservaProvider({
  tratamientos,
  agenda,
  consultorio,
  children,
}: {
  tratamientos: Tratamiento[];
  agenda: Agenda;
  consultorio: ConfiguracionWeb;
  children: React.ReactNode;
}) {
  const irAReservar = useCallback(() => {
    document
      .getElementById("reservar")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const valor = useMemo(
    () => ({
      tratamientos,
      agenda,
      consultorio,
      irAReservar,
    }),
    [tratamientos, agenda, consultorio, irAReservar]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useReserva(): ContextoReserva {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useReserva debe usarse dentro de <ReservaProvider>");
  return ctx;
}
