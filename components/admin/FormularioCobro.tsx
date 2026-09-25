"use client";

import { useEffect, useState } from "react";
import {
  CODIGO_GIFTCARD,
  estaVencida,
  fechaConAnio,
  MEDIO_GIFTCARD,
  queRegala,
  type Giftcard,
} from "@/lib/giftcards";
import { hoyEnArgentina } from "@/lib/fechas";
import { esConsulta, formatearPrecio, type Tratamiento } from "@/lib/tratamientos";
import AvisoDuplicado from "./AvisoDuplicado";

export const MEDIOS_DE_PAGO = ["Efectivo", "Transferencia", "Mercado Pago"];

/* Un tratamiento tambien se paga con giftcard. Los productos no: por
   eso no esta en la lista de arriba, que usan las ventas. */
const MEDIOS_DEL_TURNO = [...MEDIOS_DE_PAGO, MEDIO_GIFTCARD];

/** Lo que se sabe de la giftcard que se esta escribiendo. */
type Chequeo =
  | { estado: "buscando" }
  | { estado: "encontrada"; g: Giftcard }
  | { estado: "error"; mensaje: string }
  | null;

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
  clienteId,
  fecha,
  hayClienta,
  onListo,
  onCancelar,
}: {
  precioSugerido: number | null;
  /** El catalogo, para elegir que se hizo. */
  tratamientos: Tratamiento[];
  /** Lo que dice hoy el turno, para dejarlo preseleccionado si coincide. */
  tratamientoActual: string | null;
  /** Los dos datos que necesita el aviso de duplicado. */
  clienteId: string | null;
  fecha: string;
  /** Si el turno no tiene clienta vinculada, no se puede crear la sesion. */
  hayClienta: boolean;
  onListo: (datos: {
    monto: number;
    medioPago: string;
    notas: string;
    tratamientoId: string;
    /** El codigo, cuando se paga con giftcard. */
    giftcard?: string;
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
  /* Cuantas cosas ya cargadas hay cerca de esta fecha para esta clienta. */
  const [duplicados, setDuplicados] = useState(0);
  const [giftcard, setGiftcard] = useState("");
  const [chequeo, setChequeo] = useState<Chequeo>(null);

  const conGiftcard = medioPago === MEDIO_GIFTCARD;
  const codigo = giftcard.trim().toUpperCase();

  /*
    LA GIFTCARD SE MIRA MIENTRAS SE ESCRIBE: que regala, para quien y
    hasta cuando vale. Valen la tiene enfrente y decide con eso; el
    servidor igual vuelve a controlar todo al confirmar.

    Y el monto pasa a ser el de la giftcard. Es la plata que entro
    cuando se vendio y que recien ahora llega a la Caja: si ademas le
    pagaron una diferencia, se suma a mano.
  */
  useEffect(() => {
    if (!conGiftcard || !CODIGO_GIFTCARD.test(codigo)) {
      setChequeo(null);
      return;
    }
    let vigente = true;
    setChequeo({ estado: "buscando" });
    fetch(`/api/giftcards?codigo=${codigo}`)
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!vigente) return;
        if (!r.ok) {
          setChequeo({ estado: "error", mensaje: data?.error ?? "No se pudo buscar la giftcard." });
          return;
        }
        setChequeo({ estado: "encontrada", g: data });
        if (data.estado === "vigente") setMonto(String(data.monto));
      })
      .catch(() => vigente && setChequeo({ estado: "error", mensaje: "No se pudo buscar la giftcard." }));
    return () => {
      vigente = false;
    };
  }, [conGiftcard, codigo]);

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

    if (conGiftcard && !CODIGO_GIFTCARD.test(codigo)) {
      setError("Poné el código de la giftcard, como G-4K7M9P.");
      return;
    }

    setGuardando(true);
    setError(null);

    const fallo = await onListo({
      monto: Number(monto),
      medioPago,
      notas,
      tratamientoId,
      giftcard: conGiftcard ? codigo : undefined,
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
          <span className="text-sm opacity-80">
            {conGiftcard ? "Cuánto suma a la Caja" : "Cuánto cobraste"}
          </span>
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
            {MEDIOS_DEL_TURNO.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      {conGiftcard && (
        <div className="mt-3">
          <label className="block">
            <span className="text-sm opacity-80">Código de la giftcard</span>
            <input
              type="text"
              value={giftcard}
              onChange={(e) => setGiftcard(e.target.value.toUpperCase())}
              placeholder="G-4K7M9P"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={10}
              className="mt-1 min-h-12 w-full rounded-2xl border border-borde bg-white px-4 text-base tracking-[0.08em] text-tinta outline-none focus:border-vino"
            />
          </label>
          <EstadoGiftcard chequeo={chequeo} />
        </div>
      )}

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

      {/* Lo que esta clienta ya tiene cargado por estos dias */}
      <AvisoDuplicado
        clienteId={clienteId}
        fecha={fecha}
        onCambio={setDuplicados}
      />

      {error && (
        <p className="mt-3 rounded-chico bg-negativo-suave px-4 py-2.5 text-base text-negativo">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {/* El boton cambia de texto cuando hay algo parecido cargado: es
            el clic que confirma que lo leyo. */}
        <button
          type="submit"
          disabled={guardando}
          className="min-h-12 rounded-full bg-vino px-7 text-base font-semibold text-crema disabled:opacity-60"
        >
          {guardando
            ? "Guardando…"
            : duplicados > 0
              ? "Cobrar igual"
              : "Confirmar cobro"}
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

/**
 * Lo que dice la giftcard escrita, en un renglon: si sirve, que regala
 * y hasta cuando; si no, por que.
 */
function EstadoGiftcard({ chequeo }: { chequeo: Chequeo }) {
  if (!chequeo) {
    return (
      <p className="mt-1 text-sm opacity-80">
        La giftcard ya se cobró cuando se vendió: ahora entra en la Caja y queda usada.
      </p>
    );
  }
  if (chequeo.estado === "buscando") {
    return <p className="mt-1 text-sm opacity-80">Buscando…</p>;
  }
  if (chequeo.estado === "error") {
    return <p className="mt-1 text-sm font-semibold text-negativo">{chequeo.mensaje}</p>;
  }

  const { g } = chequeo;
  const detalle = `${queRegala(g)}${g.tratamiento ? ` · ${formatearPrecio(g.monto)}` : ""} · para ${g.para}`;

  if (g.estado !== "vigente") {
    return (
      <p className="mt-1 text-sm font-semibold text-negativo">
        {g.estado === "nueva"
          ? "Todavía no está cobrada. Marcala como cobrada en Giftcards."
          : g.estado === "usada"
            ? `Ya se usó${g.usada_el ? ` el ${fechaConAnio(g.usada_el)}` : ""}.`
            : "Está anulada."}
      </p>
    );
  }

  /* Una vencida se puede tomar igual: lo decide Valen. */
  return estaVencida(g, hoyEnArgentina()) ? (
    <p className="mt-1 text-sm font-semibold text-negativo">
      {detalle}. Venció el {fechaConAnio(g.vence_el!)}: si la tomás igual, confirmá el cobro.
    </p>
  ) : (
    <p className="mt-1 text-sm font-semibold text-positivo">
      ✓ {detalle}. Si te pagó una diferencia aparte, sumala al monto.
    </p>
  );
}
