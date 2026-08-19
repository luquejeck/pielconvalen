"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ContextoReserva = {
  tratamientoId: string | null;
  setTratamientoId: (id: string | null) => void;
  /** Elige el tratamiento y hace scroll al modulo de reservas. */
  elegirYReservar: (id: string) => void;
};

const Contexto = createContext<ContextoReserva | null>(null);

export function ReservaProvider({ children }: { children: React.ReactNode }) {
  const [tratamientoId, setTratamientoId] = useState<string | null>(null);

  const elegirYReservar = useCallback((id: string) => {
    setTratamientoId(id);
    document
      .getElementById("reservar")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const valor = useMemo(
    () => ({ tratamientoId, setTratamientoId, elegirYReservar }),
    [tratamientoId, elegirYReservar]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useReserva(): ContextoReserva {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useReserva debe usarse dentro de <ReservaProvider>");
  return ctx;
}
