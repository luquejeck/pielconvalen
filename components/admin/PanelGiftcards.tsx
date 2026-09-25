"use client";

import { useCallback, useEffect, useState } from "react";
import {
  estaVencida,
  fechaConAnio,
  GIFTCARD,
  queRegala,
  type Giftcard,
} from "@/lib/giftcards";
import { formatearFechaLarga, hoyEnArgentina } from "@/lib/fechas";
import { clienteNavegador } from "@/lib/supabase";
import { formatearPrecio, type Tratamiento } from "@/lib/tratamientos";
import { linkGiftcardLista } from "@/lib/whatsapp";
import { IconoCheck, IconoWhatsApp } from "../iconos";
import { MEDIOS_DE_PAGO } from "./FormularioCobro";

type Accion = "cobrar" | "usar" | "anular" | "deshacer" | "asociar" | "desasociar";
type Extra = { medioPago?: string; turnoId?: string };

const campo =
  "mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino";

/**
 * Las giftcards, para Valen.
 *
 * TRES LISTAS, EN EL ORDEN EN QUE SE TRABAJAN:
 *
 *   Para cobrar   las que pidieron por la web. Se cruzan con el
 *                 WhatsApp por el codigo, como los pedidos, y se marcan
 *                 cobradas eligiendo como pagaron.
 *   Vigentes      cobradas y sin usar. Desde aca se manda el link de la
 *                 tarjeta a quien la compro.
 *   Historial     usadas y anuladas, plegado: se mira poco.
 *
 * SE USAN DESDE EL COBRO DEL TURNO, no desde aca: al cerrar el turno,
 * "Cómo pagó" -> Giftcard, y el codigo. Asi la sesion entra a la Caja y
 * la giftcard queda usada en el mismo paso. "Marcar usada" es para
 * cuando se uso por fuera de un turno.
 *
 * LA PLATA ENTRA EN LA CAJA CUANDO SE USA (ver schema-22). Por eso
 * arriba de todo esta lo cobrado y sin usar: es plata que ya tiene y
 * que todavia no aparece en la Caja.
 */
export default function PanelGiftcards({ tratamientos }: { tratamientos: Tratamiento[] }) {
  const [giftcards, setGiftcards] = useState<Giftcard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [buscar, setBuscar] = useState("");
  /* El link de la tarjeta lleva el dominio, y en el servidor no hay
     `window`: se completa al montar. */
  const [origen, setOrigen] = useState("");
  /* La recien creada a mano queda arriba, con el boton para mandarla. */
  const [recien, setRecien] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetch("/api/giftcards");
    if (!res.ok) {
      setError(
        res.status === 500
          ? "No se pudieron traer las giftcards. Si es la primera vez, falta correr schema-22-giftcards.sql en Supabase."
          : "No se pudieron traer las giftcards."
      );
      setGiftcards([]);
      return;
    }
    const data = await res.json();
    setGiftcards(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    setOrigen(window.location.origin);
    void cargar();
  }, [cargar]);

  const actuar = async (id: string, accion: Accion, extra: Extra = {}) => {
    setTrabajando(id);
    setError(null);
    const res = await fetch(`/api/giftcards?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion, ...extra }),
    });
    setTrabajando(null);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "No se pudo. Probá de nuevo.");
      return;
    }
    setGiftcards((antes) => (antes ?? []).map((g) => (g.id === id ? data : g)));
  };

  /* Para siempre: solo las de prueba o las que nunca se pagaron. */
  const borrar = async (id: string) => {
    setTrabajando(id);
    setError(null);
    const res = await fetch(`/api/giftcards?id=${id}`, { method: "DELETE" });
    setTrabajando(null);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo borrar. Probá de nuevo.");
      return;
    }
    setGiftcards((antes) => (antes ?? []).filter((g) => g.id !== id));
  };

  if (giftcards === null) {
    return <p className="py-10 text-center text-base text-tinta-suave">Cargando…</p>;
  }

  const hoy = hoyEnArgentina();
  const q = buscar.trim().toLowerCase();
  const filtradas = q
    ? giftcards.filter((g) =>
        [g.codigo, g.para, g.de, g.tratamiento ?? ""].some((x) => x.toLowerCase().includes(q))
      )
    : giftcards;

  const nuevas = filtradas.filter((g) => g.estado === "nueva");
  const vigentes = filtradas.filter((g) => g.estado === "vigente");
  const historial = filtradas.filter((g) => g.estado === "usada" || g.estado === "anulada");

  const sinUsar = giftcards.filter((g) => g.estado === "vigente" && !estaVencida(g, hoy));
  const plataSinUsar = sinUsar.reduce((n, g) => n + g.monto, 0);

  const linkDe = (g: Giftcard) => `${origen}/giftcard/${g.codigo}`;
  const props = { hoy, trabajando, linkDe, onActuar: actuar, onBorrar: borrar };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Giftcards</h2>
          <p className="mt-1 text-base text-tinta-suave">
            {sinUsar.length === 0
              ? "No hay ninguna cobrada sin usar."
              : `${sinUsar.length} ${sinUsar.length === 1 ? "cobrada" : "cobradas"} sin usar · ${formatearPrecio(plataSinUsar)}. Entra en la Caja cuando la usen.`}
          </p>
        </div>
        {!cargando && (
          <button
            type="button"
            onClick={() => setCargando(true)}
            className="min-h-11 rounded-full bg-vino px-5 text-base font-semibold text-crema"
          >
            + Cargar una a mano
          </button>
        )}
      </div>

      {cargando && (
        <CargarAMano
          tratamientos={tratamientos}
          onListo={(g) => {
            setGiftcards((antes) => [g, ...(antes ?? [])]);
            setRecien(g.id);
            setCargando(false);
          }}
          onCancelar={() => setCargando(false)}
        />
      )}

      {error && (
        <p className="mt-4 rounded-chico bg-negativo-suave px-4 py-2.5 text-base text-negativo">
          {error}
        </p>
      )}

      {giftcards.length > 0 && (
        <input
          type="search"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar por código o nombre"
          aria-label="Buscar giftcard"
          className="mt-5 min-h-12 w-full rounded-2xl px-4 text-base"
        />
      )}

      {giftcards.length === 0 && !error && (
        <div className="mt-6 rounded-2xl border border-borde bg-white px-6 py-10 text-center">
          <p className="text-lg font-semibold text-tinta">Todavía no hay giftcards</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-tinta-suave">
            Las que pidan desde la web aparecen acá para cobrar. Las que vendas en el consultorio
            o por Instagram, cargalas con el botón de arriba.
          </p>
        </div>
      )}

      {nuevas.length > 0 && (
        <section className="mt-6 rounded-suave border-2 border-vino bg-white p-5">
          <h3 className="text-lg font-semibold text-tinta">
            {nuevas.length === 1 ? "1 para cobrar" : `${nuevas.length} para cobrar`}
          </h3>
          <p className="mt-1 text-base text-tinta-suave">
            Buscá el mismo código en el WhatsApp de quien la pidió.
          </p>
          <ul className="mt-4 space-y-2.5">
            {nuevas.map((g) => (
              <Fila key={g.id} g={g} {...props} />
            ))}
          </ul>
        </section>
      )}

      {vigentes.length > 0 && (
        <section className="mt-6">
          <h3 className="text-lg font-semibold text-tinta">Vigentes</h3>
          <ul className="mt-3 space-y-2.5">
            {vigentes.map((g) => (
              <Fila key={g.id} g={g} destacada={g.id === recien} {...props} />
            ))}
          </ul>
        </section>
      )}

      {historial.length > 0 && (
        <details className="mt-6" open={Boolean(q)}>
          <summary className="min-h-11 cursor-pointer py-2 text-base font-semibold text-tinta-suave">
            Usadas y anuladas ({historial.length})
          </summary>
          <ul className="mt-2 space-y-2.5">
            {historial.map((g) => (
              <Fila key={g.id} g={g} {...props} />
            ))}
          </ul>
        </details>
      )}

      {q && filtradas.length === 0 && (
        <p className="mt-6 text-center text-base text-tinta-suave">
          Ninguna giftcard coincide con “{buscar.trim()}”.
        </p>
      )}
    </div>
  );
}

/** Una giftcard, con los botones de su estado. */
function Fila({
  g,
  hoy,
  trabajando,
  linkDe,
  onActuar,
  onBorrar,
  destacada = false,
}: {
  g: Giftcard;
  hoy: string;
  trabajando: string | null;
  linkDe: (g: Giftcard) => string;
  onActuar: (id: string, accion: Accion, extra?: Extra) => void;
  onBorrar: (id: string) => void;
  destacada?: boolean;
}) {
  /* Cobrar, anular y borrar piden un segundo toque: son plata, o no
     tienen vuelta atras. */
  const [paso, setPaso] = useState<"cobrar" | "anular" | "borrar" | "turno" | null>(null);
  const [copiado, setCopiado] = useState(false);
  const ocupada = trabajando === g.id;
  const vencida = estaVencida(g, hoy);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(linkDe(g));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* Sin permiso de portapapeles queda "Ver tarjeta" para copiarlo. */
    }
  };

  const estado =
    g.estado === "usada"
      ? `Usada${g.usada_el ? ` el ${fechaConAnio(g.usada_el)}` : ""}`
      : g.estado === "anulada"
        ? "Anulada"
        : g.estado === "nueva"
          ? "Sin cobrar"
          : vencida
            ? `Venció el ${fechaConAnio(g.vence_el!)}`
            : g.vence_el
              ? `Vence el ${fechaConAnio(g.vence_el)}`
              : "Vigente";

  return (
    <li
      className={`rounded-chico border p-4 ${
        destacada
          ? "border-positivo/40 bg-positivo-suave"
          : g.estado === "nueva"
            ? "border-vino/30 bg-vino-suave"
            : "border-borde bg-white"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-lg font-semibold tracking-[0.06em] text-tinta">{g.codigo}</span>
        <span className={`text-sm ${vencida ? "font-semibold text-negativo" : "text-tinta-suave"}`}>
          {estado}
        </span>
      </div>

      <p className="mt-1 text-base font-semibold text-tinta">
        {queRegala(g)}
        {g.tratamiento && (
          <span className="font-normal text-tinta-suave"> · {formatearPrecio(g.monto)}</span>
        )}
      </p>
      <p className="text-base text-tinta">
        Para {g.para} · de {g.de}
      </p>
      {g.mensaje && <p className="mt-1 text-sm text-tinta-suave italic">“{g.mensaje}”</p>}
      {g.medio_pago && g.cobrada_el && (
        <p className="mt-1 text-sm text-tinta-suave">
          Cobrada el {fechaConAnio(g.cobrada_el)} · {g.medio_pago}
        </p>
      )}

      {destacada && (
        <p className="mt-2 text-sm font-semibold text-positivo">
          Lista. Mandale la tarjeta a quien te la compró.
        </p>
      )}

      {/*
        EL TURNO DE QUIEN LA RECIBE.

        Cuando confirma dia y hora, Valen se lo asocia. Asi la giftcard
        figura en ese turno en Turnos, y al cobrarlo ya viene puesta como
        medio de pago con su codigo.
      */}
      {g.estado === "vigente" &&
        (paso === "turno" ? (
          <ElegirTurno
            para={g.para}
            actual={g.turno_id}
            ocupada={ocupada}
            onElegir={(turnoId) => {
              onActuar(g.id, "asociar", { turnoId });
              setPaso(null);
            }}
            onCancelar={() => setPaso(null)}
          />
        ) : g.turno ? (
          <div className="mt-3 rounded-chico bg-vino-suave px-3.5 py-2.5">
            <p className="text-base text-tinta">
              <span className="font-semibold">Turno:</span> {formatearFechaLarga(g.turno.fecha)} ·{" "}
              {g.turno.hora} hs
              {g.turno.estado === "pendiente" && <span className="text-tinta-suave"> · a confirmar</span>}
              {g.turno.estado === "no_vino" && <span className="text-negativo"> · no vino</span>}
            </p>
            <div className="mt-1 flex gap-4 text-sm">
              <button
                type="button"
                onClick={() => setPaso("turno")}
                className="min-h-9 text-tinta-suave underline"
              >
                Cambiar
              </button>
              <button
                type="button"
                disabled={ocupada}
                onClick={() => onActuar(g.id, "desasociar")}
                className="min-h-9 text-tinta-suave underline disabled:opacity-50"
              >
                Quitar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPaso("turno")}
            className="mt-3 min-h-11 rounded-full border border-vino bg-white px-5 text-base font-semibold text-vino hover:bg-vino-suave"
          >
            Asociar turno
          </button>
        ))}

      {/* ---- Para cobrar ---- */}
      {g.estado === "nueva" &&
        (paso === "cobrar" ? (
          <div className="mt-3">
            <p className="text-sm text-tinta-suave">¿Cómo te la pagaron?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {MEDIOS_DE_PAGO.map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={ocupada}
                  onClick={() => onActuar(g.id, "cobrar", { medioPago: m })}
                  className="min-h-11 rounded-full border border-vino bg-white px-4 text-base font-semibold text-vino hover:bg-vino hover:text-white disabled:opacity-50"
                >
                  {m}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPaso(null)}
                className="min-h-11 px-3 text-base text-tinta-suave underline"
              >
                Volver
              </button>
            </div>
          </div>
        ) : paso === "anular" ? (
          <Confirmar
            texto="¿No la pagó? Se anula."
            si="Sí, anular"
            ocupada={ocupada}
            onSi={() => onActuar(g.id, "anular")}
            onNo={() => setPaso(null)}
          />
        ) : paso === "borrar" ? (
          <Confirmar
            texto="¿Borrarla para siempre? No se puede deshacer."
            si="Sí, borrar"
            ocupada={ocupada}
            onSi={() => onBorrar(g.id)}
            onNo={() => setPaso(null)}
          />
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPaso("cobrar")}
              className="flex min-h-11 items-center gap-2 rounded-full bg-vino px-6 text-base font-semibold text-crema"
            >
              <IconoCheck className="h-4 w-4" />
              Me la pagaron
            </button>
            <button
              type="button"
              onClick={() => setPaso("anular")}
              className="min-h-11 rounded-full px-4 text-base text-tinta-suave underline"
            >
              No la pagó
            </button>
            <button
              type="button"
              onClick={() => setPaso("borrar")}
              className="min-h-11 rounded-full px-2 text-base text-tinta-suave underline"
            >
              Borrar
            </button>
          </div>
        ))}

      {/* ---- Vigente ---- */}
      {g.estado === "vigente" &&
        paso !== "turno" &&
        (paso === "anular" ? (
          <Confirmar
            texto="¿Anular esta giftcard? Ya no se va a poder usar."
            si="Sí, anular"
            ocupada={ocupada}
            onSi={() => onActuar(g.id, "anular")}
            onNo={() => setPaso(null)}
          />
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={linkGiftcardLista(g, linkDe(g))}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-2 rounded-full bg-vino px-5 text-base font-semibold text-crema"
              >
                <IconoWhatsApp className="h-4 w-4" />
                Mandar la tarjeta
              </a>
              <button
                type="button"
                onClick={copiar}
                className="min-h-11 rounded-full border border-borde bg-white px-4 text-base text-tinta"
              >
                {copiado ? "¡Copiado!" : "Copiar link"}
              </button>
              <a
                href={linkDe(g)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center rounded-full border border-borde bg-white px-4 text-base text-tinta"
              >
                Ver tarjeta
              </a>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 text-sm">
              <button
                type="button"
                disabled={ocupada}
                onClick={() => onActuar(g.id, "usar")}
                className="min-h-10 text-tinta-suave underline disabled:opacity-50"
              >
                Marcar usada
              </button>
              <button
                type="button"
                disabled={ocupada}
                onClick={() => onActuar(g.id, "deshacer")}
                className="min-h-10 text-tinta-suave underline disabled:opacity-50"
              >
                No estaba cobrada
              </button>
              <button
                type="button"
                onClick={() => setPaso("anular")}
                className="min-h-10 text-tinta-suave underline"
              >
                Anular
              </button>
            </div>
          </>
        ))}

      {/* ---- Usada o anulada: solo deshacer ---- */}
      {g.estado === "usada" && g.turno_id ? (
        /* La uso el cobro de un turno: se devuelve deshaciendo ese cobro,
           si no el ingreso seguiria diciendo que se pago con ella. */
        <p className="mt-2 text-sm text-tinta-suave">
          Se usó al cobrar un turno. Si hay que devolverla, deshacé ese cobro en Turnos.
        </p>
      ) : paso === "borrar" && g.estado === "anulada" ? (
        <Confirmar
          texto="¿Borrarla para siempre? No se puede deshacer."
          si="Sí, borrar"
          ocupada={ocupada}
          onSi={() => onBorrar(g.id)}
          onNo={() => setPaso(null)}
        />
      ) : (g.estado === "usada" || g.estado === "anulada") && (
        <div className="mt-2 flex gap-4 text-sm">
          <button
            type="button"
            disabled={ocupada}
            onClick={() => onActuar(g.id, "deshacer")}
            className="min-h-10 text-tinta-suave underline disabled:opacity-50"
          >
            {g.estado === "usada" ? "No se usó" : "Volver a activarla"}
          </button>
          {/* Una anulada ya no vale nada: se puede borrar. Sirve para las
              de prueba. */}
          {g.estado === "anulada" && (
            <button
              type="button"
              onClick={() => setPaso("borrar")}
              className="min-h-10 text-tinta-suave underline"
            >
              Borrar
            </button>
          )}
        </div>
      )}
    </li>
  );
}

type TurnoLibre = { id: string; fecha: string; hora: string; cliente: string | null; estado: string };

/** "María José" -> "maria jose": para comparar nombres sin tildes. */
const normal = (t: string) =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/**
 * Elegir el turno que saco quien recibe la giftcard.
 *
 * Los reservados de hoy en adelante. Primero los que coinciden con el
 * nombre de la tarjeta: casi siempre es uno de esos, y Valen no tiene
 * que buscar entre todos.
 */
function ElegirTurno({
  para,
  actual,
  ocupada,
  onElegir,
  onCancelar,
}: {
  para: string;
  actual: string | null;
  ocupada: boolean;
  onElegir: (turnoId: string) => void;
  onCancelar: () => void;
}) {
  const [turnos, setTurnos] = useState<TurnoLibre[] | null>(null);

  useEffect(() => {
    clienteNavegador()
      .from("turnos")
      .select("id, fecha, hora, cliente, estado")
      .gte("fecha", hoyEnArgentina())
      .in("estado", ["pendiente", "confirmado"])
      .order("fecha")
      .order("hora")
      .limit(60)
      .then(({ data }) => setTurnos((data as TurnoLibre[]) ?? []));
  }, []);

  const nombre = normal(para).split(/\s+/)[0] ?? "";
  const coincide = (t: TurnoLibre) => Boolean(nombre && t.cliente && normal(t.cliente).includes(nombre));
  const ordenados = (turnos ?? []).slice().sort((a, b) => Number(coincide(b)) - Number(coincide(a)));

  return (
    <div className="mt-3 rounded-chico border border-borde bg-crema p-3">
      <p className="text-sm font-semibold text-tinta">¿Qué turno sacó {para}?</p>
      {turnos === null ? (
        <p className="mt-2 text-sm text-tinta-suave">Buscando turnos…</p>
      ) : turnos.length === 0 ? (
        <p className="mt-2 text-sm text-tinta-suave">
          No hay turnos reservados de hoy en adelante. Cuando reserve, volvé acá.
        </p>
      ) : (
        <ul className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
          {ordenados.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                disabled={ocupada || t.id === actual}
                onClick={() => onElegir(t.id)}
                className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-base transition-colors disabled:opacity-50 ${
                  coincide(t) ? "border-vino/40 bg-white" : "border-borde bg-papel"
                } hover:border-vino`}
              >
                <span className="min-w-0">
                  <span className="text-tinta">
                    {formatearFechaLarga(t.fecha)} · {t.hora}
                  </span>
                  <span className="block text-sm text-tinta-suave">
                    {t.cliente || "Sin nombre"}
                    {t.estado === "pendiente" && " · a confirmar"}
                  </span>
                </span>
                {coincide(t) && (
                  <span className="shrink-0 text-xs font-semibold text-vino">Mismo nombre</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onCancelar} className="mt-2 min-h-10 text-sm text-tinta-suave underline">
        Volver
      </button>
    </div>
  );
}

function Confirmar({
  texto,
  si,
  ocupada,
  onSi,
  onNo,
}: {
  texto: string;
  si: string;
  ocupada: boolean;
  onSi: () => void;
  onNo: () => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-chico bg-negativo-suave px-4 py-2.5">
      <p className="text-base font-semibold text-tinta">{texto}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onNo}
          className="min-h-11 rounded-full border border-borde bg-papel px-4 text-base font-semibold text-tinta"
        >
          No
        </button>
        <button
          type="button"
          disabled={ocupada}
          onClick={onSi}
          className="min-h-11 rounded-full bg-negativo px-4 text-base font-semibold text-white disabled:opacity-50"
        >
          {si}
        </button>
      </div>
    </div>
  );
}

/**
 * Una giftcard vendida por fuera de la web: en el consultorio, por
 * Instagram. Casi siempre ya esta cobrada, asi que el medio de pago
 * viene elegido; "Todavia no" la deja para cobrar.
 */
function CargarAMano({
  tratamientos,
  onListo,
  onCancelar,
}: {
  tratamientos: Tratamiento[];
  onListo: (g: Giftcard) => void;
  onCancelar: () => void;
}) {
  const conPrecio = tratamientos.filter((t) => t.precio > 0).sort((a, b) => a.precio - b.precio);
  const [regalo, setRegalo] = useState("");
  const [monto, setMonto] = useState("");
  const [para, setPara] = useState("");
  const [de, setDe] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [medio, setMedio] = useState<string>(MEDIOS_DE_PAGO[0]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const res = await fetch("/api/giftcards/a-mano", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        para,
        de,
        mensaje,
        medioPago: medio || null,
        ...(regalo === "monto" ? { monto: Number(monto) } : { tratamientoId: regalo }),
      }),
    });
    setGuardando(false);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "No se pudo crear. Probá de nuevo.");
      return;
    }
    onListo(data);
  };

  return (
    <form onSubmit={guardar} className="mt-5 rounded-suave border border-borde bg-white p-5">
      <p className="text-lg font-semibold text-tinta">Cargar una giftcard</p>

      <label className="mt-3 block">
        <span className="text-sm text-tinta-suave">Qué regala</span>
        <select value={regalo} onChange={(e) => setRegalo(e.target.value)} required className={campo}>
          <option value="">Elegí…</option>
          {conPrecio.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} · {formatearPrecio(t.precio)}
            </option>
          ))}
          <option value="monto">Un monto</option>
        </select>
      </label>

      {regalo === "monto" && (
        <label className="mt-3 block">
          <span className="text-sm text-tinta-suave">Monto</span>
          <input
            type="number"
            min={GIFTCARD.montoMinimo}
            max={GIFTCARD.montoMaximo}
            step={1}
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className={campo}
          />
        </label>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-tinta-suave">Para</span>
          <input
            required
            maxLength={GIFTCARD.largoNombre}
            value={para}
            onChange={(e) => setPara(e.target.value)}
            className={campo}
          />
        </label>
        <label className="block">
          <span className="text-sm text-tinta-suave">De parte de</span>
          <input
            required
            maxLength={GIFTCARD.largoNombre}
            value={de}
            onChange={(e) => setDe(e.target.value)}
            className={campo}
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="text-sm text-tinta-suave">Mensaje (opcional)</span>
        <textarea
          rows={2}
          maxLength={GIFTCARD.largoMensaje}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className={campo}
        />
      </label>

      <p className="mt-3 text-sm text-tinta-suave">¿Ya te la pagaron?</p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Cómo la pagaron">
        {[...MEDIOS_DE_PAGO, ""].map((m) => (
          <button
            key={m || "no"}
            type="button"
            onClick={() => setMedio(m)}
            aria-pressed={medio === m}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              medio === m ? "border-vino bg-vino text-white" : "border-borde bg-papel text-tinta hover:border-vino"
            }`}
          >
            {m || "Todavía no"}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-negativo">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={guardando}
          className="min-h-12 rounded-full bg-vino px-7 text-base font-semibold text-crema disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Crear giftcard"}
        </button>
        <button type="button" onClick={onCancelar} className="min-h-12 rounded-full px-5 text-base underline">
          Volver
        </button>
      </div>
    </form>
  );
}
