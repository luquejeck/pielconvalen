"use client";

import { useState } from "react";
import { esConsulta, formatearPrecio, type Tratamiento } from "@/lib/tratamientos";

export const MEDIOS_DE_PAGO = ["Efectivo", "Transferencia", "Mercado Pago"];

/**
 * "Atendida y cobrada": el paso que cierra el circuito.
 *
 * Con esto, un turno atendido deja de ser tres cargas a mano. Marca el
 * turno como realizado, carga el ingreso en Economia y le agrega la
 * sesion a la ficha de la clienta, todo de una.
 *
 * Aca tambien se dice QUE tratamiento se hizo. Los turnos de la web
 * entran todos como consulta —la clienta ya no elige— asi que si esto no
 * se preguntara, en Economia y en la ficha quedaria "Consulta y
 * Evaluación Facial" para siempre, sin registro de lo que realmente pasó
 * sobre la camilla.
 *
 * El monto viene prellenado con el precio de lista del tratamiento
 * elegido pero se puede tocar: en la vida real se hacen descuentos, se
 * agrega algo sobre la camilla, o la clienta paga distinto.
 */
export default function FormularioCobro({
  precioSugerido,
  tratamientos,
  tratamientoActual,
  hayClienta,
  onListo,
  onCancelar,
}: {
  precioSugerido: number | null;
  /** El catalogo, para elegir que se hizo. */
  tratamientos: Tratamiento[];
  /** Lo que dice hoy el turno, para dejarlo preseleccionado si coincide. */
  tratamientoActual: string | null;
  /** Si el turno no tiene clienta vinculada, no se puede crear la sesion. */
  hayClienta: boolean;
  onListo: (datos: {
    monto: number;
    medioPago: string;
    notas: string;
    tratamientoId: string;
  }) => Promise<string | null>;
  onCancelar: () => void;
}) {
  /* Solo los del catalogo: "consulta" es como entra el turno, no algo
     que se pueda cobrar. */
  const opciones = tratamientos.filter((t) => !esConsulta(t));

  const [tratamientoId, setTratamientoId] = useState(
    opciones.find((t) => t.nombre === tratamientoActual)?.id ?? ""
  );
  const [monto, setMonto] = useState(String(precioSugerido || ""));
  const [medioPago, setMedioPago] = useState(MEDIOS_DE_PAGO[0]);
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Elegir el tratamiento trae su precio de lista al monto: es el numero
     que se cobra casi siempre, y si no, se corrige al lado. */
  const elegirTratamiento = (id: string) => {
    setTratamientoId(id);
    const elegido = opciones.find((t) => t.id === id);
    if (elegido) setMonto(String(elegido.precio));
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tratamientoId) {
      setError("Elegí qué tratamiento le hiciste.");
      return;
    }

    setGuardando(true);
    setError(null);

    const fallo = await onListo({
      monto: Number(monto),
      medioPago,
      notas,
      tratamientoId,
    });

    setGuardando(false);
    if (fallo) setError(fallo);
  };

  return (
    <form onSubmit={enviar} className="mt-4 border-t border-current/15 pt-4">
      <p className="text-base font-medium">Cobrar y cerrar el turno</p>

      <label className="mt-3 block">
        <span className="text-sm opacity-80">Qué tratamiento le hiciste</span>
        <select
          value={tratamientoId}
          onChange={(e) => elegirTratamiento(e.target.value)}
          required
          className="mt-1 min-h-12 w-full rounded-2xl border border-borde bg-white px-4 text-base text-tinta outline-none focus:border-vino"
        >
          <option value="">Elegí el tratamiento…</option>
          {opciones.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} · {formatearPrecio(t.precio)}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-sm opacity-80">
          Queda en Economía y en la ficha de la clienta.
        </span>
      </label>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm opacity-80">Cuánto cobraste</span>
          <input
            type="number"
            min="0"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="mt-1 min-h-12 w-full rounded-2xl border border-borde bg-white px-4 text-base text-tinta outline-none focus:border-vino"
          />
        </label>

        <label className="block">
          <span className="text-sm opacity-80">Cómo pagó</span>
          <select
            value={medioPago}
            onChange={(e) => setMedioPago(e.target.value)}
            className="mt-1 min-h-12 w-full rounded-2xl border border-borde bg-white px-4 text-base text-tinta outline-none focus:border-vino"
          >
            {MEDIOS_DE_PAGO.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      {hayClienta ? (
        <label className="mt-3 block">
          <span className="text-sm opacity-80">
            Cómo salió (queda en la ficha de la clienta)
          </span>
          <textarea
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Reacción de la piel, productos usados, qué mirar la próxima…"
            className="mt-1 w-full rounded-2xl border border-borde bg-white px-4 py-2.5 text-base text-tinta outline-none focus:border-vino"
          />
        </label>
      ) : (
        /* Sin clienta vinculada el ingreso se carga igual, pero la sesion
           no tiene a donde ir. Mejor decirlo que perder la observacion. */
        <p className="mt-3 rounded-chico bg-white/70 px-4 py-2.5 text-sm text-tinta">
          Este turno no está vinculado a una clienta, así que la sesión no se
          va a guardar en ninguna ficha. El ingreso se registra igual.
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-chico bg-negativo-suave px-4 py-2.5 text-base text-negativo">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={guardando}
          className="min-h-12 rounded-full bg-vino px-7 text-base font-semibold text-crema disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Confirmar cobro"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="min-h-12 rounded-full px-5 text-base underline"
        >
          Volver
        </button>
      </div>
    </form>
  );
}
