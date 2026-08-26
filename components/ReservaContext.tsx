"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
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
  tratamientoId: string | null;
  setTratamientoId: (id: string | null) => void;
  /** Elige el tratamiento y hace scroll al modulo de reservas. */
  elegirYReservar: (id: string) => void;
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
  const [tratamientoId, setTratamientoId] = useState<string | null>(null);

  const elegirYReservar = useCallback((id: string) => {
    setTratamientoId(id);
    document
      .getElementById("reservar")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const valor = useMemo(
    () => ({
      tratamientos,
      agenda,
      consultorio,
      tratamientoId,
      setTratamientoId,
      elegirYReservar,
    }),
    [tratamientos, agenda, consultorio, tratamientoId, elegirYReservar]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useReserva(): ContextoReserva {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useReserva debe usarse dentro de <ReservaProvider>");
  return ctx;
}
