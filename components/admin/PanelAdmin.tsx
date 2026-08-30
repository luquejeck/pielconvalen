"use client";

import { useCallback, useEffect, useState } from "react";
import { horariosDelDia, todosLosHorarios, type Agenda } from "@/lib/config";
import {
  claveFecha,
  desdeClave,
  formatearFechaLarga,
  sumarDias,
} from "@/lib/fechas";
import { clienteNavegador } from "@/lib/supabase";
import { formatearPrecio, type Tratamiento } from "@/lib/tratamientos";
import {
  linkWhatsAppA,
  mensajeTurnoAceptado,
  mensajeTurnoRechazado,
  normalizarTelefono,
} from "@/lib/whatsapp";
import BuscadorCliente from "./BuscadorCliente";
import BandejaPendientes from "./BandejaPendientes";
import Recordatorios from "./Recordatorios";
import FormularioCobro from "./FormularioCobro";
import { IconoCheck } from "../iconos";

type EstadoTurno =
  | "pendiente"
  | "confirmado"
  | "bloqueado"
  /* Atendida y cobrada: el ingreso y la sesion ya se generaron solos. */
  | "realizado"
  /* Confirmo y no aparecio. Sin este estado no habia forma de medir
     ausentismo ni de distinguir a la que aviso de la que no vino. */
  | "no_vino";

type TurnoDB = {
  id: string;
  fecha: string;
  hora: string;
  estado: EstadoTurno;
  cliente: string | null;
  telefono: string | null;
  tratamiento: string | null;
  precio: number | null;
  cliente_id: string | null;
  /* Que movimiento genero este turno al cobrarse. Sirve para no cobrar
     dos veces y para poder deshacerlo. */
  movimiento_id: string | null;
};

/**
 * Tres niveles con un solo color: el pendiente pide accion y va en vino
 * pleno, el confirmado ya esta resuelto y va en vino diluido, el bloqueado
 * no es un turno y se apaga contra el fondo.
 */
const ETIQUETAS: Record<EstadoTurno, { texto: string; clase: string }> = {
  pendiente: {
    texto: "A confirmar",
    clase: "bg-vino text-crema border-vino",
  },
  confirmado: {
    texto: "Confirmado",
    clase: "bg-vino-suave text-vino border-vino/30",
  },
  bloqueado: {
    texto: "Bloqueado",
    clase: "bg-crema-oscuro text-tinta-suave border-borde",
  },
  /* Ya paso y ya se cobro: no pide nada, va en verde apagado, el mismo
     que usa Economia para lo que suma. */
  realizado: {
    texto: "Atendida y cobrada",
    clase: "bg-positivo-suave text-positivo border-positivo/30",
  },
  no_vino: {
    texto: "No vino",
    clase: "bg-negativo-suave text-negativo border-negativo/30",
  },
};

type Props = {
  tratamientos: Tratamiento[];
  agenda: Agenda;
  /** Sale de la configuracion: va en el mensaje de recordatorio. */
  direccion: string;
};

export default function PanelAdmin({ tratamientos, agenda, direccion }: Props) {
  const supabase = clienteNavegador();

  const [fecha, setFecha] = useState(() => claveFecha(new Date()));
  const [turnos, setTurnos] = useState<TurnoDB[]>([]);
  const [diaCerrado, setDiaCerrado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [moviendo, setMoviendo] = useState<string | null>(null);
  const [vinculando, setVinculando] = useState<string | null>(null);
  const [rechazando, setRechazando] = useState<string | null>(null);
  const [cobrando, setCobrando] = useState<string | null>(null);
  /** Lo ultimo que salio mal. Antes las escrituras fallaban en silencio. */
  const [error, setError] = useState<string | null>(null);

  /**
   * Dia o semana. La vista de dia es la de trabajar; la de semana es la
   * de mirar como viene. Antes solo existia la primera, asi que para
   * saber como venia la semana habia que tocar la flecha siete veces.
   */
  const [vista, setVista] = useState<"dia" | "semana">("dia");
  const [semana, setSemana] = useState<TurnoDB[]>([]);

  /** Lunes de la semana que contiene a `fecha`. */
  const lunes = (() => {
    const d = desdeClave(fecha);
    return sumarDias(d, -((d.getDay() + 6) % 7));
  })();
  const diasDeLaSemana = Array.from({ length: 7 }, (_, i) =>
    claveFecha(sumarDias(lunes, i))
  );

  const cargar = useCallback(async () => {
    setCargando(true);

    const [{ data: filas }, { data: cerrado }] = await Promise.all([
      supabase.from("turnos").select("*").eq("fecha", fecha).order("hora"),
      supabase.from("dias_cerrados").select("fecha").eq("fecha", fecha).maybeSingle(),
    ]);

    setTurnos((filas as TurnoDB[]) ?? []);
    setDiaCerrado(Boolean(cerrado));
    setCargando(false);
  }, [fecha, supabase]);

  const cargarSemana = useCallback(async () => {
    const { data } = await supabase
      .from("turnos")
      .select("*")
      .gte("fecha", diasDeLaSemana[0])
      .lte("fecha", diasDeLaSemana[6])
      .order("fecha")
      .order("hora");

    setSemana((data as TurnoDB[]) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, diasDeLaSemana[0], diasDeLaSemana[6]]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (vista === "semana") void cargarSemana();
  }, [vista, cargarSemana]);

  /* ----------------------------- acciones ----------------------------- */

  /**
   * Envoltorio de toda escritura: si la base rechaza, se muestra. Antes
   * el panel recargaba igual y la accion parecia no haber pasado nada,
   * que es la peor forma de fallar.
   */
  const ejecutar = async (
    accion: () => PromiseLike<{ error: { message: string } | null }>,
    queHacia: string
  ) => {
    setError(null);
    const { error: fallo } = await accion();
    if (fallo) {
      setError(`No se pudo ${queHacia}. ${fallo.message}`);
      return false;
    }
    await cargar();
    return true;
  };

  const bloquear = (hora: string) =>
    ejecutar(
      () =>
        supabase.from("turnos").insert({ fecha, hora, estado: "bloqueado" }),
      "bloquear el horario"
    );

  const borrar = (id: string) =>
    ejecutar(
      () => supabase.from("turnos").delete().eq("id", id),
      "borrar el turno"
    );

  const aceptar = (id: string) =>
    ejecutar(
      () => supabase.from("turnos").update({ estado: "confirmado" }).eq("id", id),
      "aceptar el turno"
    );

  const vincularCliente = async (
    turnoId: string,
    c: { id: string; nombre: string; telefono?: string } | null
  ) => {
    const ok = await ejecutar(
      () =>
        supabase
          .from("turnos")
          .update({
            cliente_id: c?.id ?? null,
            cliente: c?.nombre ?? null,
            telefono: c?.telefono ?? null,
          })
          .eq("id", turnoId),
      "vincular la clienta"
    );
    if (ok) setVinculando(null);
  };

  /**
   * Atendida y cobrada, de una sola vez.
   *
   * El trabajo lo hace una funcion de la base, para que el turno, el
   * ingreso y la sesion entren juntos o no entre ninguno. Devuelve el
   * mensaje de error para que lo muestre el propio formulario, que es
   * donde Valen esta mirando.
   */
  const registrarCobro = async (
    turnoId: string,
    datos: {
      monto: number;
      medioPago: string;
      notas: string;
      /* Que se le hizo de verdad. El turno entro como consulta y esto es
         lo que queda escrito en Economia y en su ficha. */
      tratamientoId: string;
    }
  ): Promise<string | null> => {
    const res = await fetch("/api/turnos/realizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turnoId, ...datos }),
    });

    if (!res.ok) {
      const { error: mensaje } = await res.json().catch(() => ({ error: null }));
      return mensaje ?? "No se pudo registrar el cobro.";
    }

    setCobrando(null);
    await cargar();
    return null;
  };

  /** Borra el ingreso y la sesion que genero el turno y lo vuelve atras. */
  const anularCobro = async (turnoId: string) => {
    setError(null);
    const res = await fetch(`/api/turnos/realizar?turnoId=${turnoId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("No se pudo deshacer el cobro.");
      return;
    }
    await cargar();
  };

  const marcarNoVino = (id: string) =>
    ejecutar(
      () => supabase.from("turnos").update({ estado: "no_vino" }).eq("id", id),
      "marcar que no vino"
    );

  const alternarDia = () =>
    ejecutar(
      () =>
        diaCerrado
          ? supabase.from("dias_cerrados").delete().eq("fecha", fecha)
          : supabase.from("dias_cerrados").insert({ fecha }),
      diaCerrado ? "abrir el día" : "cerrar el día"
    );

  const moverDia = (dias: number) =>
    setFecha(claveFecha(sumarDias(desdeClave(fecha), dias)));

  const turnoDe = (hora: string) => turnos.find((t) => t.hora === hora);

  /**
   * La grilla del dia: los horarios de la agenda MAS los de los turnos
   * que ya existen.
   *
   * Antes se listaban solo los de la agenda, asi que un turno reservado
   * a las 09:00 desaparecia del panel si despues Valen cambiaba su
   * horario a 10:00-20:00. La clienta se presentaba y el turno no
   * figuraba en ningun lado.
   */
  const horasDeLaAgenda = horariosDelDia(agenda, desdeClave(fecha).getDay());

  const horasDelDia = [
    ...new Set([...horasDeLaAgenda, ...turnos.map((t) => t.hora)]),
  ].sort();

  const horasLibres = horasDeLaAgenda.filter((h) => !turnoDe(h));
  const fueraDeAgenda = (hora: string) => !horasDeLaAgenda.includes(hora);

  return (
    <section>
      {/* Primero lo que tiene a alguien esperando, despues lo de mañana. */}
      <Recordatorios direccion={direccion} />

      {/* Los pedidos sin responder, de cualquier fecha. */}
      <BandejaPendientes
        onCambio={() => {
          void cargar();
          if (vista === "semana") void cargarSemana();
        }}
      />

      {/* Dia o semana */}
      <div className="mb-4 flex justify-center">
        <div className="segmentado">
          {/* Sin clases propias: el aspecto lo pone `.segmentado`, igual
              que en la barra de arriba. Ponerlas aca hacia que las dos
              pastillas midieran distinto que las de la navegacion. */}
          {(["dia", "semana"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVista(v)}
              data-activo={vista === v}
              aria-pressed={vista === v}
            >
              {v === "dia" ? "Día" : "Semana"}
            </button>
          ))}
        </div>
      </div>

      {vista === "semana" && (
        <VistaSemana
          dias={diasDeLaSemana}
          turnos={semana}
          agenda={agenda}
          onElegirDia={(d) => {
            setFecha(d);
            setVista("dia");
          }}
          onMoverSemana={(delta) => moverDia(delta * 7)}
        />
      )}

      {vista === "dia" && (
      <>
      {/* Navegacion por dia */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => moverDia(-1)}
          aria-label="Día anterior"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-borde text-2xl text-vino hover:bg-vino-suave"
        >
          &#8249;
        </button>

        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="min-h-12 grow rounded-2xl border border-borde px-4 text-center text-lg outline-none focus:border-vino"
        />

        <button
          type="button"
          onClick={() => moverDia(1)}
          aria-label="Día siguiente"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-borde text-2xl text-vino hover:bg-vino-suave"
        >
          &#8250;
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-chico bg-vino-suave px-5 py-4 text-base text-vino">
          {error}
        </p>
      )}

      <p className="mt-4 text-lg text-tinta-suave">
        {formatearFechaLarga(fecha)}
        {fecha === claveFecha(new Date()) && " · hoy"}
      </p>

      {diaCerrado && (
        <p className="mt-5 rounded-2xl bg-crema-oscuro px-5 py-4 text-lg text-tinta">
          Este día está cerrado. No aparece en la web.
        </p>
      )}

      {/* Horarios */}
      <ul className="mt-6 space-y-3">
        {cargando ? (
          <li className="text-lg text-tinta-suave">Cargando…</li>
        ) : (
          horasDelDia.map((hora) => {
            const turno = turnoDe(hora);

            /*
              La tarjeta del turno pendiente tiene fondo vino pleno, asi
              que los botones se invierten: el principal va en claro sobre
              oscuro. Con el mismo vino de siempre, "Aceptar" desaparecia
              dentro de la tarjeta.
            */
            const enOscuro = turno?.estado === "pendiente";
            const btnPrincipal = enOscuro
              ? "bg-crema text-vino"
              : "bg-vino text-crema";
            const btnSecundario = enOscuro
              ? "border border-crema/45 text-crema hover:bg-crema/15"
              : "border border-borde bg-white/60 hover:border-vino hover:text-vino";

            return (
              <li
                key={hora}
                className={`rounded-2xl border p-5 ${
                  turno ? ETIQUETAS[turno.estado].clase : "border-borde bg-white"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-xl font-semibold">
                    {hora}
                    {fueraDeAgenda(hora) && (
                      <span className="ml-2 text-base font-normal opacity-80">
                        fuera de tu horario
                      </span>
                    )}
                  </span>
                  <span className="text-base">
                    {turno ? ETIQUETAS[turno.estado].texto : "Libre"}
                  </span>
                </div>

                {turno?.cliente && (
                  <p className="mt-2 text-lg">{turno.cliente}</p>
                )}
                {turno?.tratamiento && (
                  <p className="text-base opacity-80">
                    {turno.tratamiento}
                    {turno.precio ? ` · ${formatearPrecio(turno.precio)}` : ""}
                  </p>
                )}
                {turno?.telefono && (
                  <a
                    href={`https://wa.me/${normalizarTelefono(turno.telefono)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base underline"
                  >
                    {turno.telefono}
                  </a>
                )}

                {turno?.estado === "confirmado" && turno.telefono && (
                  <a
                    href={linkWhatsAppA(
                      turno.telefono,
                      mensajeTurnoAceptado({
                        fecha: turno.fecha,
                        hora: turno.hora,
                        cliente: turno.cliente,
                        tratamiento: turno.tratamiento,
                      })
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-base font-medium underline"
                  >
                    Avisarle que quedó confirmado →
                  </a>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {!turno && (
                    <button
                      type="button"
                      onClick={() => bloquear(hora)}
                      className={`rounded-full px-5 py-2.5 text-base ${btnSecundario}`}
                    >
                      Bloquear
                    </button>
                  )}

                  {turno?.estado === "pendiente" && (
                    <button
                      type="button"
                      onClick={() => aceptar(turno.id)}
                      className={`flex min-h-12 items-center gap-2 rounded-full px-7 text-lg font-semibold shadow-sm ${btnPrincipal}`}
                    >
                      <IconoCheck className="h-4 w-4" />
                      Aceptar
                    </button>
                  )}

                  {/*
                    El boton que cierra el circuito. Antes, despues de
                    atender habia que ir a Economia a cargar el ingreso y
                    a la ficha de la clienta a cargar la sesion,
                    escribiendo de nuevo datos que ya estaban en este
                    turno. Va primero y en el estilo principal porque es
                    la accion mas frecuente del dia.
                  */}
                  {turno?.estado === "confirmado" && (
                    <button
                      type="button"
                      onClick={() =>
                        setCobrando(cobrando === turno.id ? null : turno.id)
                      }
                      className={`flex min-h-12 items-center gap-2 rounded-full px-7 text-lg font-semibold shadow-sm ${btnPrincipal}`}
                    >
                      <IconoCheck className="h-4 w-4" />
                      {cobrando === turno.id ? "Cerrar" : "Atendida y cobrada"}
                    </button>
                  )}

                  {turno?.estado === "confirmado" && (
                    <button
                      type="button"
                      onClick={() => marcarNoVino(turno.id)}
                      className={`rounded-full px-5 py-2.5 text-base ${btnSecundario}`}
                    >
                      No vino
                    </button>
                  )}

                  {/*
                    Salida para el "No vino" puesto de mas: la clienta
                    llego tarde, o aviso y se marco igual. Sin esto, el
                    unico camino de vuelta era moverle el turno.
                  */}
                  {turno?.estado === "no_vino" && (
                    <button
                      type="button"
                      onClick={() =>
                        ejecutar(
                          () =>
                            supabase
                              .from("turnos")
                              .update({ estado: "confirmado" })
                              .eq("id", turno.id),
                          "volver a confirmar el turno"
                        )
                      }
                      className={`rounded-full px-5 py-2.5 text-base ${btnSecundario}`}
                    >
                      Sí vino, confirmar
                    </button>
                  )}

                  {turno?.estado === "realizado" && (
                    <button
                      type="button"
                      onClick={() => anularCobro(turno.id)}
                      className={`rounded-full px-5 py-2.5 text-base ${btnSecundario}`}
                    >
                      Deshacer el cobro
                    </button>
                  )}

                  {turno && turno.estado !== "bloqueado" && turno.estado !== "realizado" && (
                    <button
                      type="button"
                      onClick={() =>
                        setMoviendo(moviendo === turno.id ? null : turno.id)
                      }
                      className={`rounded-full px-5 py-2.5 text-base ${btnSecundario}`}
                    >
                      {moviendo === turno.id
                        ? "Cerrar"
                        : turno.estado === "pendiente"
                          ? "Cambiar"
                          : "Mover"}
                    </button>
                  )}

                  {turno && turno.estado !== "bloqueado" && (
                    <button
                      type="button"
                      onClick={() =>
                        setVinculando(vinculando === turno.id ? null : turno.id)
                      }
                      className={`rounded-full px-5 py-2.5 text-base ${btnSecundario}`}
                    >
                      {turno.cliente_id ? "Cambiar clienta" : "Vincular clienta"}
                    </button>
                  )}

                  {turno && turno.estado === "bloqueado" && (
                    <button
                      type="button"
                      onClick={() => borrar(turno.id)}
                      className={`rounded-full px-5 py-2.5 text-base ${btnSecundario}`}
                    >
                      Liberar
                    </button>
                  )}

                  {turno && turno.estado !== "bloqueado" && (
                    <button
                      type="button"
                      onClick={() =>
                        setRechazando(rechazando === turno.id ? null : turno.id)
                      }
                      className={`rounded-full px-5 py-2.5 text-base ${btnSecundario}`}
                    >
                      {turno.estado === "pendiente" ? "Rechazar" : "Cancelar"}
                    </button>
                  )}
                </div>

                {/*
                  Rechazar libera el horario y no se puede deshacer, asi que
                  pregunta antes. Y ofrece avisarle a la clienta: sin eso,
                  ella se queda esperando una respuesta que no llega.
                */}
                {turno && rechazando === turno.id && (
                  <div className="mt-4 border-t border-current/15 pt-4">
                    <p className="text-base">
                      {turno.estado === "pendiente"
                        ? "Se rechaza el pedido y el horario queda libre."
                        : "Se cancela el turno y el horario queda libre."}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {turno.telefono && (
                        <a
                          href={linkWhatsAppA(
                            turno.telefono,
                            mensajeTurnoRechazado({
                              fecha: turno.fecha,
                              hora: turno.hora,
                              cliente: turno.cliente,
                            })
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            void borrar(turno.id);
                            setRechazando(null);
                          }}
                          className={`rounded-full px-5 py-2.5 text-base font-medium ${btnPrincipal}`}
                        >
                          Avisar y liberar
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          await borrar(turno.id);
                          setRechazando(null);
                        }}
                        className={`rounded-full px-5 py-2.5 text-base ${btnSecundario}`}
                      >
                        {turno.telefono ? "Liberar sin avisar" : "Sí, liberar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setRechazando(null)}
                        className="rounded-full px-5 py-2.5 text-base underline"
                      >
                        Volver
                      </button>
                    </div>
                  </div>
                )}

                {turno && vinculando === turno.id && (
                  <div className="mt-4 border-t border-current/15 pt-4">
                    <p className="mb-2 text-sm text-tinta-suave">Vincular a una clienta (opcional)</p>
                    <BuscadorCliente
                      valorInicial={turno.cliente ?? ""}
                      onSeleccionar={(c) => vincularCliente(turno.id, c)}
                    />
                    {turno.cliente_id && (
                      <button
                        type="button"
                        onClick={() => vincularCliente(turno.id, null)}
                        className="mt-2 text-sm text-tinta-suave underline hover:text-vino"
                      >
                        Desvincular
                      </button>
                    )}
                  </div>
                )}

                {turno && cobrando === turno.id && (
                  <FormularioCobro
                    precioSugerido={turno.precio}
                    tratamientos={tratamientos}
                    tratamientoActual={turno.tratamiento}
                    hayClienta={Boolean(turno.cliente_id)}
                    onListo={(datos) => registrarCobro(turno.id, datos)}
                    onCancelar={() => setCobrando(null)}
                  />
                )}

                {turno && moviendo === turno.id && (
                  <FormularioMover
                    turno={turno}
                    agenda={agenda}
                    onListo={async () => {
                      setMoviendo(null);
                      await cargar();
                    }}
                  />
                )}
              </li>
            );
          })
        )}
      </ul>

      {/* Acciones del dia */}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setMostrarFormulario((v) => !v)}
          disabled={horasLibres.length === 0}
          className="rounded-full bg-vino px-6 py-3 text-base text-crema disabled:opacity-40"
        >
          {mostrarFormulario ? "Cerrar formulario" : "Cargar turno a mano"}
        </button>

        <button
          type="button"
          onClick={alternarDia}
          className="rounded-full border border-borde px-6 py-3 text-base text-tinta-suave hover:border-vino hover:text-vino"
        >
          {diaCerrado ? "Reabrir el día" : "Cerrar el día"}
        </button>
      </div>

      {mostrarFormulario && horasLibres.length > 0 && (
        <FormularioTurno
          fecha={fecha}
          horasLibres={horasLibres}
          tratamientos={tratamientos}
          onGuardado={async () => {
            setMostrarFormulario(false);
            await cargar();
          }}
        />
      )}
      </>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------------- */

/**
 * Como viene la semana, de un vistazo.
 *
 * El panel mostraba un dia por vez, asi que para saber como venia la
 * semana habia que tocar la flecha siete veces y acordarse de lo que
 * decia cada pantalla. Esto no reemplaza la vista de dia —ahi es donde
 * se trabaja— sino que contesta otra pregunta: donde hay lugar y donde
 * esta el lio.
 */
function VistaSemana({
  dias,
  turnos,
  agenda,
  onElegirDia,
  onMoverSemana,
}: {
  dias: string[];
  turnos: TurnoDB[];
  agenda: Agenda;
  onElegirDia: (fecha: string) => void;
  onMoverSemana: (delta: number) => void;
}) {
  const hoy = claveFecha(new Date());

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onMoverSemana(-1)}
          aria-label="Semana anterior"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-borde text-2xl text-vino hover:bg-vino-suave"
        >
          &#8249;
        </button>
        <p className="grow text-center text-lg text-tinta">
          Semana del {formatearFechaLarga(dias[0])}
        </p>
        <button
          type="button"
          onClick={() => onMoverSemana(1)}
          aria-label="Semana siguiente"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-borde text-2xl text-vino hover:bg-vino-suave"
        >
          &#8250;
        </button>
      </div>

      <ul className="mt-5 space-y-2.5">
        {dias.map((dia) => {
          const delDia = turnos.filter((t) => t.fecha === dia);
          const ocupados = delDia.filter((t) => t.estado !== "bloqueado").length;
          const pendientes = delDia.filter((t) => t.estado === "pendiente").length;
          const horasDeEseDia = horariosDelDia(agenda, desdeClave(dia).getDay());
          const libres = horasDeEseDia.filter(
            (h) => !delDia.some((t) => t.hora === h)
          ).length;
          const esHoy = dia === hoy;
          const atiende = horasDeEseDia.length > 0;

          return (
            <li key={dia}>
              <button
                type="button"
                onClick={() => onElegirDia(dia)}
                className={`flex w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-chico border px-4 py-3.5 text-left transition-colors hover:border-vino ${
                  esHoy ? "border-vino bg-vino-suave" : "border-borde bg-white"
                }`}
              >
                <span className="min-w-40 text-lg font-medium text-tinta">
                  {formatearFechaLarga(dia)}
                  {esHoy && " · hoy"}
                </span>

                {!atiende ? (
                  <span className="text-base text-tinta-suave">No atendés</span>
                ) : (
                  <span className="flex flex-wrap items-center gap-2 text-base">
                    {pendientes > 0 && (
                      <span className="rounded-full bg-vino px-3 py-0.5 font-medium text-crema">
                        {pendientes} a confirmar
                      </span>
                    )}
                    <span className="text-tinta-suave">
                      {ocupados === 0
                        ? "Sin turnos"
                        : ocupados === 1
                          ? "1 turno"
                          : `${ocupados} turnos`}
                      {libres > 0 && ` · ${libres} libre${libres > 1 ? "s" : ""}`}
                    </span>
                  </span>
                )}

                <span className="ml-auto text-tinta-suave">&rsaquo;</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------------- */

function FormularioTurno({
  fecha,
  horasLibres,
  tratamientos,
  onGuardado,
}: {
  fecha: string;
  horasLibres: string[];
  tratamientos: Tratamiento[];
  onGuardado: () => void;
}) {
  const supabase = clienteNavegador();
  // Sin horarios libres no hay nada que elegir: `horasLibres[0]` era
  // undefined y el alta se mandaba con la hora vacia.
  const [hora, setHora] = useState(horasLibres[0] ?? "");
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [tratamientoId, setTratamientoId] = useState(tratamientos[0]?.id ?? "");
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hora) {
      setError("Ese día no tiene horarios libres.");
      return;
    }

    setGuardando(true);
    setError(null);

    const tratamiento = tratamientos.find((t) => t.id === tratamientoId);

    const { error: fallo } = await supabase.from("turnos").insert({
      fecha,
      hora,
      estado: "confirmado",
      cliente: cliente.trim() || null,
      telefono: telefono.trim() || null,
      cliente_id: clienteId,
      tratamiento: tratamiento?.nombre ?? null,
      precio: tratamiento?.precio ?? null,
    });

    setGuardando(false);

    if (fallo) {
      setError(
        fallo.code === "23505"
          ? "Ese horario ya está tomado."
          : `No se pudo guardar. ${fallo.message}`
      );
      return;
    }

    onGuardado();
  };

  return (
    <form
      onSubmit={guardar}
      className="mt-5 rounded-suave border border-borde bg-white p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-base text-tinta-suave">Horario</span>
          <select
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-borde px-4 text-lg outline-none focus:border-vino"
          >
            {horasLibres.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-base text-tinta-suave">Tratamiento</span>
          <select
            value={tratamientoId}
            onChange={(e) => setTratamientoId(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-borde px-4 text-lg outline-none focus:border-vino"
          >
            {tratamientos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombreCorto}
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="text-base text-tinta-suave">Clienta (opcional)</span>
          <BuscadorCliente
            onSeleccionar={(c) => {
              setClienteId(c?.id ?? null);
              setCliente(c?.nombre ?? "");
              setTelefono(c?.telefono ?? "");
            }}
          />
        </label>

        <label className="block">
          <span className="text-base text-tinta-suave">Nombre (si no está en el listado)</span>
          <input
            type="text"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-borde px-4 text-lg outline-none focus:border-vino"
          />
        </label>

        <label className="block">
          <span className="text-base text-tinta-suave">WhatsApp</span>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="5491122943672"
            className="mt-2 min-h-12 w-full rounded-2xl border border-borde px-4 text-lg outline-none focus:border-vino"
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-chico bg-vino-suave px-4 py-3 text-base text-vino">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando || !hora}
        className="boton-principal mt-6 w-full disabled:opacity-60"
      >
        {guardando ? "Guardando…" : "Guardar turno"}
      </button>
    </form>
  );
}

/* ---------------------------------------------------------------------- */

/**
 * Reprograma un turno conservando los datos de la clienta.
 * Antes habia que cancelarlo y volver a cargarlo a mano, con el riesgo
 * de perder el nombre y el telefono en el medio.
 */
function FormularioMover({
  turno,
  agenda,
  onListo,
}: {
  turno: TurnoDB;
  agenda: Agenda;
  onListo: () => void;
}) {
  const supabase = clienteNavegador();
  const [fecha, setFecha] = useState(turno.fecha);
  const [hora, setHora] = useState(turno.hora);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  /*
    Mover una que no vino la deja confirmada en el horario nuevo.

    Antes el mover solo cambiaba fecha y hora y no tocaba el estado, asi
    que un turno marcado "No vino" seguia marcado igual en la fecha
    nueva: en rojo, como si estuviera cancelado, cuando en realidad la
    clienta reprogramo y va a venir.

    Reprogramar ES aceptarla de nuevo. Los demas estados no se tocan: una
    pendiente movida sigue pendiente, porque que Valen le corra el
    horario no significa que la clienta ya lo haya aceptado.
  */
  const vuelveAConfirmarse = turno.estado === "no_vino";

  /*
    Las horas que ofrece el selector son las del dia al que se mueve, que
    cambian con la fecha elegida. Si ese dia no se atiende, se ofrecen
    todas las de la semana: desde el panel Valen puede poner un turno
    fuera de agenda, y quedarse sin ninguna opcion seria peor.
  */
  const horasDelDestino = horariosDelDia(agenda, desdeClave(fecha).getDay());
  const horasDestino = [
    ...new Set([
      ...(horasDelDestino.length ? horasDelDestino : todosLosHorarios(agenda)),
      /* La hora que el turno ya tiene, siempre: sin esto el selector
         mostraba la primera de la lista y guardaba otra distinta. */
      hora,
    ]),
  ].sort();

  const mover = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const { error } = await supabase
      .from("turnos")
      .update(
        vuelveAConfirmarse
          ? { fecha, hora, estado: "confirmado" }
          : { fecha, hora }
      )
      .eq("id", turno.id);

    setGuardando(false);

    if (error) {
      // 23505 = ya existe un turno en esa fecha y hora
      setError(
        error.code === "23505"
          ? "Ese horario ya está ocupado. Probá con otro."
          : "No se pudo mover el turno."
      );
      return;
    }

    onListo();
  };

  return (
    <form onSubmit={mover} className="mt-4 border-t border-current/15 pt-4">
      <p className="text-base">Mover a:</p>

      <div className="mt-2 flex flex-wrap gap-2">
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
          className="min-h-12 grow rounded-2xl border border-borde bg-white px-4 text-base text-tinta outline-none focus:border-vino"
        />

        <select
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          className="min-h-12 rounded-2xl border border-borde bg-white px-4 text-base text-tinta outline-none focus:border-vino"
        >
          {horasDestino.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>

      {/* Se avisa lo que va a pasar con el estado, para que no sea una
          sorpresa despues de guardar. */}
      {vuelveAConfirmarse && (
        <p className="mt-2 text-base opacity-90">
          Al moverla vuelve a quedar <b>confirmada</b> en el horario nuevo.
        </p>
      )}

      {error && <p className="mt-2 text-base text-vino">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="mt-3 min-h-12 w-full rounded-full bg-vino px-6 text-base text-white disabled:opacity-60"
      >
        {guardando ? "Moviendo…" : "Confirmar cambio"}
      </button>
    </form>
  );
}
