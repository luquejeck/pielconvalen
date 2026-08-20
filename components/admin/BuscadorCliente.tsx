"use client";

import { useEffect, useRef, useState } from "react";

type Cliente = { id: string; nombre: string; telefono?: string };

type Props = {
  onSeleccionar: (c: Cliente | null) => void;
  valorInicial?: string;
  placeholder?: string;
};

export default function BuscadorCliente({
  onSeleccionar,
  valorInicial = "",
  placeholder = "Buscar clienta…",
}: Props) {
  const [texto, setTexto] = useState(valorInicial);
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [seleccionada, setSeleccionada] = useState<Cliente | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    if (seleccionada || texto.length < 2) {
      setResultados([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(texto)}`);
      if (res.ok) {
        setResultados(await res.json());
        setAbierto(true);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [texto, seleccionada]);

  const elegir = (c: Cliente) => {
    setSeleccionada(c);
    setTexto(c.nombre);
    setResultados([]);
    setAbierto(false);
    onSeleccionar(c);
  };

  const limpiar = () => {
    setSeleccionada(null);
    setTexto("");
    setResultados([]);
    onSeleccionar(null);
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            if (seleccionada) { setSeleccionada(null); onSeleccionar(null); }
          }}
          placeholder={placeholder}
          className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
        />
        {seleccionada && (
          <button type="button" onClick={limpiar} className="mt-1 shrink-0 rounded-full p-2 text-tinta-suave hover:text-vino">
            ✕
          </button>
        )}
      </div>

      {seleccionada && (
        <p className="mt-1 text-sm text-vino">✓ {seleccionada.nombre}{seleccionada.telefono ? ` · ${seleccionada.telefono}` : ""}</p>
      )}

      {abierto && resultados.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-xl border border-borde bg-white shadow-suave">
          {resultados.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => elegir(c)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-crema-oscuro"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-vino/10 text-sm font-semibold text-vino">
                  {c.nombre.charAt(0).toUpperCase()}
                </span>
                <span>
                  <p className="text-base font-medium text-tinta">{c.nombre}</p>
                  {c.telefono && <p className="text-sm text-tinta-suave">{c.telefono}</p>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {abierto && resultados.length === 0 && texto.length >= 2 && !seleccionada && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-borde bg-white px-4 py-3 text-sm text-tinta-suave shadow-suave">
          Sin resultados. Podés cargarla desde la sección Clientas.
        </div>
      )}
    </div>
  );
}
