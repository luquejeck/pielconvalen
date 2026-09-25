"use client";

import { useCallback, useEffect, useState } from "react";
import {
  estaVencida,
  fechaConAnio,
  GIFTCARD,
  queRegala,
  type Giftcard,
} from "@/lib/giftcards";
import type { Agenda } from "@/lib/config";
import { construirMapa } from "@/lib/disponibilidad";
import {
  claveFecha,
  DIAS_SEMANA,
  desdeClave,
  formatearFechaLarga,
  hoyEnArgentina,
  sumarDias,
} from "@/lib/fechas";
import { clienteNavegador } from "@/lib/supabase";
import { formatearPrecio, type Tratamiento } from "@/lib/tratamientos";
import { linkGiftcardLista } from "@/lib/whatsapp";
import { IconoCheck, IconoWhatsApp } from "../iconos";
import { MEDIOS_DE_PAGO } from "./FormularioCobro";

type Accion = "cobrar" | "usar" | "anular" | "deshacer" | "cancelar-turno";
type Extra = { medioPago?: string };

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
export default function PanelGiftcards({
  tratamientos,
  agenda,
}: {
  tratamientos: Tratamiento[];
  /** Los dias y horarios de atencion, para darle turno en uno libre. */
  agenda: Agenda;
}) {
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

  /* Darle turno (o moverlo). Devuelve el error, si hubo, para mostrarlo
     al lado del horario elegido: un "ya esta tomado" arriba de todo de
     la pagina no se ve. */
  const agendar = async (id: string, fecha: string, hora: string, telefono: string) => {
    setTrabajando(id);
    setError(null);
    const res = await fetch(`/api/giftcards?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "agendar", fecha, hora, telefono }),
    });
    setTrabajando(null);
    const data = await res.json().catch(() => null);
    if (!res.ok) return (data?.error as string) ?? "No se pudo. Probá de nuevo.";
    setGiftcards((antes) => (antes ?? []).map((g) => (g.id === id ? data : g)));
    return null;
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
  const props = { hoy, trabajando, linkDe, agenda, onActuar: actuar, onAgendar: agendar, onBorrar: borrar };

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
  agenda,
  onActuar,
  onAgendar,
  onBorrar,
  destacada = false,
}: {
  g: Giftcard;
  hoy: string;
  trabajando: string | null;
  linkDe: (g: Giftcard) => string;
  agenda: Agenda;
  onActuar: (id: string, accion: Accion, extra?: Extra) => void;
  onAgendar: (id: string, fecha: string, hora: string, telefono: string) => Promise<string | null>;
  onBorrar: (id: string) => void;
  destacada?: boolean;
}) {
  /* Cobrar, anular y borrar piden un segundo toque: son plata, o no
     tienen vuelta atras. */
  const [paso, setPaso] = useState<
    "cobrar" | "anular" | "borrar" | "agendar" | "cancelar-turno" | null
  >(null);
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
        EL TURNO DE QUIEN LA RECIBE. Dos caminos, y ninguno suma trabajo:

        - Reserva sola desde su tarjeta: el turno se asocia solo (ver
          lib/giftcards-turno.ts). Aca aparece ya con su turno.
        - Le escribe a Valen por WhatsApp: "Darle turno", dia, hora, listo.

        En Turnos se ve la giftcard y al cobrarlo ya viene puesta.
      */}
      {g.estado === "vigente" &&
        (paso === "agendar" ? (
          <AgendarTurno
            agenda={agenda}
            para={g.para}
            moviendo={Boolean(g.turno)}
            onElegir={async (fecha, hora, telefono) => {
              const fallo = await onAgendar(g.id, fecha, hora, telefono);
              if (!fallo) setPaso(null);
              return fallo;
            }}
            onCancelar={() => setPaso(null)}
          />
        ) : paso === "cancelar-turno" ? (
          <Confirmar
            texto="¿Cancelar el turno? Se borra de la agenda y el horario queda libre."
            si="Sí, cancelar"
            ocupada={ocupada}
            onSi={() => {
              onActuar(g.id, "cancelar-turno");
              setPaso(null);
            }}
            onNo={() => setPaso(null)}
          />
        ) : g.turno ? (
          <div className="mt-3 rounded-chico bg-vino-suave px-3.5 py-2.5">
            <p className="text-base text-tinta">
              <span className="font-semibold">Turno:</span> {formatearFechaLarga(g.turno.fecha)} ·{" "}
              {g.turno.hora} hs
              {g.turno.estado === "pendiente" && <span className="text-tinta-suave"> · a confirmar</span>}
              {g.turno.estado === "no_vino" && <span className="text-negativo"> · no vino</span>}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-4 text-sm">
              <button
                type="button"
                onClick={() => setPaso("agendar")}
                className="min-h-9 text-tinta-suave underline"
              >
                Cambiar día u hora
              </button>
              <button
                type="button"
                onClick={() => setPaso("cancelar-turno")}
                className="min-h-9 text-tinta-suave underline"
              >
                Cancelar turno
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPaso("agendar")}
            className="mt-3 min-h-11 rounded-full border border-vino bg-white px-5 text-base font-semibold text-vino hover:bg-vino-suave"
          >
            Darle turno
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
        paso !== "agendar" &&
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

/**
 * Darle turno a quien recibio la giftcard: los dias con lugar y, al
 * elegir uno, sus horarios libres. Es la misma cuenta que hace la web
 * para la clienta —la agenda de cada dia, menos lo ocupado y los dias
 * cerrados—, pero sin la anticipacion minima: Valen puede dar un turno
 * para dentro de una hora si quiere.
 *
 * Si ya tiene turno, esto lo mueve: la persona cambio de dia.
 */
function AgendarTurno({
  agenda,
  para,
  moviendo,
  onElegir,
  onCancelar,
}: {
  agenda: Agenda;
  para: string;
  moviendo: boolean;
  onElegir: (fecha: string, hora: string, telefono: string) => Promise<string | null>;
  onCancelar: () => void;
}) {
  const hoy = hoyEnArgentina();
  const hasta = claveFecha(sumarDias(desdeClave(hoy), agenda.ventanaDias));
  const [ocupado, setOcupado] = useState<{ turnos: Set<string>; cerrados: Set<string> } | null>(null);
  const [dia, setDia] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [telefono, setTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = clienteNavegador();
    Promise.all([
      sb.from("turnos").select("fecha, hora").gte("fecha", hoy).lte("fecha", hasta),
      sb.from("dias_cerrados").select("fecha").gte("fecha", hoy).lte("fecha", hasta),
    ]).then(([t, c]) =>
      setOcupado({
        turnos: new Set(((t.data as { fecha: string; hora: string }[]) ?? []).map((x) => `${x.fecha}|${x.hora}`)),
        cerrados: new Set(((c.data as { fecha: string }[]) ?? []).map((x) => x.fecha)),
      })
    );
  }, [hoy, hasta]);

  /* La hora de ahora en Argentina: hoy no se ofrece lo que ya paso. */
  const ahora = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  const dias = ocupado
    ? Object.entries(
        construirMapa(
          desdeClave(hoy),
          agenda.ventanaDias,
          agenda,
          (clave, h) => ocupado.turnos.has(`${clave}|${h}`) || (clave === hoy && h <= ahora),
          (clave) => ocupado.cerrados.has(clave)
        )
      )
        .map(([clave, horas]) => ({
          clave,
          libres: horas.filter((h) => h.estado === "libre").map((h) => h.hora),
        }))
        .filter((d) => d.libres.length > 0)
    : [];

  const elegido = dias.find((d) => d.clave === dia);
  const corto = (clave: string) => {
    const d = desdeClave(clave);
    return `${DIAS_SEMANA[(d.getDay() + 6) % 7]} ${d.getDate()}/${d.getMonth() + 1}`;
  };

  const confirmar = async () => {
    if (!dia || !hora) return;
    setGuardando(true);
    setError(null);
    const fallo = await onElegir(dia, hora, telefono);
    setGuardando(false);
    if (fallo) {
      setError(fallo);
      /* Si se lo ganaron, ese horario deja de ofrecerse. */
      if (/tomado/i.test(fallo) && ocupado) {
        setOcupado({ ...ocupado, turnos: new Set(ocupado.turnos).add(`${dia}|${hora}`) });
        setHora(null);
      }
    }
  };

  return (
    <div className="mt-3 rounded-chico border border-borde bg-crema p-3">
      <p className="text-sm font-semibold text-tinta">
        {moviendo ? `¿A qué día y hora pasamos a ${para}?` : `¿Qué día y hora le das a ${para}?`}
      </p>

      {ocupado === null ? (
        <p className="mt-2 text-sm text-tinta-suave">Buscando horarios libres…</p>
      ) : dias.length === 0 ? (
        <p className="mt-2 text-sm text-tinta-suave">No quedan horarios libres en tu agenda.</p>
      ) : (
        <>
          {/* Los dias con lugar, en una fila que se desliza. */}
          <div className="-mx-3 mt-2 flex gap-2 overflow-x-auto px-3 pb-1">
            {dias.map((d) => (
              <button
                key={d.clave}
                type="button"
                onClick={() => {
                  setDia(d.clave);
                  setHora(null);
                  setError(null);
                }}
                aria-pressed={dia === d.clave}
                className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-1.5 transition-colors ${
                  dia === d.clave ? "border-vino bg-vino text-white" : "border-borde bg-papel text-tinta hover:border-vino"
                }`}
              >
                <span className="text-sm font-semibold whitespace-nowrap">{corto(d.clave)}</span>
                <span className={`text-xs ${dia === d.clave ? "text-white/80" : "text-tinta-suave"}`}>
                  {d.libres.length} {d.libres.length === 1 ? "libre" : "libres"}
                </span>
              </button>
            ))}
          </div>

          {elegido && (
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Horarios libres">
              {elegido.libres.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setHora(h);
                    setError(null);
                  }}
                  aria-pressed={hora === h}
                  className={`min-h-10 rounded-full border px-4 text-base tabular-nums transition-colors ${
                    hora === h ? "border-vino bg-vino text-white" : "border-borde bg-papel text-tinta hover:border-vino"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          )}

          {dia && hora && (
            <>
              <label className="mt-3 block">
                <span className="text-sm text-tinta-suave">Su teléfono, si lo tenés (opcional)</span>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="11 2294-3672"
                  className="mt-1 w-full rounded-xl border border-borde px-3 py-2 text-base outline-none focus:border-vino"
                />
              </label>
              <button
                type="button"
                disabled={guardando}
                onClick={confirmar}
                className="mt-3 min-h-11 w-full rounded-full bg-vino px-5 text-base font-semibold text-crema disabled:opacity-60"
              >
                {guardando
                  ? "Guardando…"
                  : `${moviendo ? "Moverlo a" : "Darle turno ·"} ${corto(dia)} · ${hora}`}
              </button>
            </>
          )}
        </>
      )}

      {error && <p className="mt-2 text-sm font-semibold text-negativo">{error}</p>}

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
