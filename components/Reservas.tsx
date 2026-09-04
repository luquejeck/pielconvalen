"use client";

import { useRef, useState } from "react";
import TituloSeccion from "./TituloSeccion";
import Calendario from "./Calendario";
import FondoImagen from "./FondoImagen";
import GestionTurno from "./GestionTurno";
import { useReserva } from "./ReservaContext";
import { IconoCheck, IconoWhatsApp } from "./iconos";
import { formatearFechaLarga } from "@/lib/fechas";
import { bajarA } from "@/lib/scroll";
import { CONSULTA, esConsulta } from "@/lib/tratamientos";
import { linkWhatsApp } from "@/lib/whatsapp";

export default function Reservas() {
  const { tratamientos, agenda, consultorio } = useReserva();
  const [fecha, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [resultado, setResultado] = useState<Resultado>(null);
  /** Cambiar este numero fuerza al calendario a releer la agenda. */
  const [version, setVersion] = useState(0);

  /**
   * Todos los turnos entran como consulta.
   *
   * Antes el primer paso era elegir el tratamiento. Es una decision que
   * la clienta no esta en condiciones de tomar —cual corresponde se sabe
   * con la piel a la vista— y ademas dejaba anotado en la agenda un
   * tratamiento que despues casi nunca era el que terminaba haciendose.
   * Ahora reserva el turno y el tratamiento lo asigna Valen cuando la
   * atiende, desde el panel.
   */
  const tratamiento = tratamientos.find(esConsulta) ?? CONSULTA;

  const pasoDos = useRef<HTMLDivElement>(null);

  /* El nombre entra en la cuenta: sin el, el turno llega a la agenda
     sin decir de quien es. */
  const completo = Boolean(fecha && hora && nombre.trim());

  const manejarCambio = (nuevaFecha: string | null, nuevaHora: string | null) => {
    setFecha(nuevaFecha);
    setHora(nuevaHora);
  };

  const enlace = completo
    ? linkWhatsApp(
        {
          tratamiento,
          fecha: fecha!,
          hora: hora!,
          nombre,
        },
        consultorio.whatsapp
      )
    : "";

  /**
   * Bloquea el horario en la agenda apenas la clienta toca el boton.
   *
   * WhatsApp se abre igual y en el acto: el boton es un <a target=_blank>
   * y eso no se toca, porque abrirlo despues de esperar al servidor lo
   * comeria el bloqueador de ventanas emergentes.
   *
   * Lo que SI se espera es la respuesta, y eso es el arreglo de fondo:
   * antes se mostraba "tu horario quedo reservado, ya nadie mas puede
   * tomarlo" sin mirar si el servidor habia dicho que si. Si otra clienta
   * habia tomado ese horario treinta segundos antes, la respuesta venia
   * 409, nadie la leia, y la clienta se enteraba el dia del turno,
   * plantada en la puerta.
   *
   * `keepalive` hace que el pedido llegue aunque ella se vaya a WhatsApp.
   */
  const reservarHorario = async () => {
    const detalle = `${fecha ? formatearFechaLarga(fecha) : ""} · ${hora} hs`;

    setResultado({ estado: "guardando", detalle });

    try {
      const res = await fetch("/api/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, hora, nombre }),
        keepalive: true,
      });

      if (res.ok) {
        setResultado({ estado: "reservado", detalle });
        return;
      }

      if (res.status === 409) {
        // Se lo ganaron por unos segundos. El calendario vuelve a pedir
        // la agenda para que los horarios que ve sean los de ahora.
        setResultado({ estado: "tomado", detalle });
        setHora(null);
        setVersion((v) => v + 1);
        return;
      }

      setResultado({ estado: "sin-guardar", detalle });
    } catch {
      setResultado({ estado: "sin-guardar", detalle });
    }
  };

  const empezarDeNuevo = () => {
    setResultado(null);
    setFecha(null);
    setHora(null);
    setVersion((v) => v + 1); // el calendario vuelve a pedir la agenda
  };

  /** Vuelve al formulario sin perder el nombre ya escrito. */
  const elegirOtroHorario = () => {
    setResultado(null);
    setHora(null);
  };

  return (
    <section
      id="reservar"
      className="relative isolate border-t border-borde py-14 md:py-16 xl:py-20"
    >
      <FondoImagen
        imagen="/imagenes/reservas.jpg"
        intensidad={30}
        filtro="saturate(0.72) contrast(0.95)"
        velo="bg-linear-to-b from-crema/88 via-crema/82 to-crema"
      />

      <div className="contenedor">
        <TituloSeccion
          titulo="Reservá tu turno"
          bajada="Dos pasos. Al final se abre WhatsApp con el mensaje ya escrito."
        />

        {/*
          En celular es una sola columna, primero el calendario y despues el resumen.
          En PC el resumen queda fijo al costado, siempre a la vista.

          Sin `items-start` a proposito: con esa clase cada celda se
          encogia al alto de su contenido, y entonces la columna del
          resumen no tenia por donde viajar. El `sticky` no se pegaba
          nada —se iba para arriba junto con el resto— asi que al elegir
          el horario el boton de confirmar quedaba fuera de pantalla,
          que es justo el momento en que hace falta.
        */}
        <div className="mx-auto mt-8 grid max-w-5xl gap-5 lg:grid-cols-[1.15fr_0.85fr] xl:max-w-none">
          <div>
            {/* ---------- Paso 1 ---------- */}
            <Paso numero={1} titulo="Elegí el día y la hora" />

            {/*
              Lo primero que se aclara es que no hay que elegir nada mas.
              El paso de elegir tratamiento no esta, y sin una linea que
              lo diga la clienta lo busca: el precio lo vio arriba.
            */}
            <p className="mt-2 text-lg leading-snug text-tinta-suave">
              El turno se saca como consulta. Valen te mira la piel al llegar
              y ahí definen el tratamiento y el precio.
            </p>

            <div className="tarjeta mt-3 p-4 sm:p-5">
              <Calendario
                key={version}
                agenda={agenda}
                fecha={fecha}
                hora={hora}
                onCambio={manejarCambio}
                /* Elegida la hora ya no queda nada que tocar arriba:
                   lo que sigue es confirmar. */
                onHoraElegida={() => bajarA(pasoDos.current, 150, true)}
              />
            </div>
          </div>

          {/* ---------- Paso 2 ---------- */}
          {/*
            Dos divs y no uno: el de afuera es la celda del grid y se
            estira a lo alto de la fila; el de adentro es el que se pega.

            Con `sticky` puesto sobre la celda misma no funcionaba: al
            estirarse quedaba tan alta como su propia caja, y algo que
            mide lo mismo que su contenedor no tiene por donde
            desplazarse. Se iba para arriba con el resto de la pagina y
            el boton de confirmar desaparecia justo al elegir el horario.
          */}
          <div>
            <div ref={pasoDos} className="scroll-mt-24 lg:sticky lg:top-22">
            <Paso numero={2} titulo="Confirmá por WhatsApp" />

            {resultado ? (
              <TurnoEnviado
                resultado={resultado}
                enlace={enlace}
                /* Para que le quede el turno anotado en el telefono, con
                   alarma el dia antes. Hasta ahora lo unico que le
                   quedaba era el mensaje que ella misma habia mandado. */
                calendario={
                  fecha && hora
                    ? `/api/turnos/calendario?fecha=${fecha}&hora=${hora}&tratamiento=${encodeURIComponent(
                        tratamiento.nombre
                      )}`
                    : null
                }
                onEmpezarDeNuevo={empezarDeNuevo}
                onElegirOtroHorario={elegirOtroHorario}
              />
            ) : (
              <div className="mt-3 rounded-suave border border-borde bg-vino-suave px-5 py-5 shadow-suave">
                <dl className="space-y-2 text-lg">
                  <Fila rotulo="Turno" valor={tratamiento.nombre} />
                  <Fila
                    rotulo="Día"
                    valor={fecha ? formatearFechaLarga(fecha) : null}
                  />
                  <Fila rotulo="Hora" valor={hora ? `${hora} hs` : null} />
                  {/* Sin precio de lista: el tratamiento se define en el
                      momento, asi que poner un numero seria inventarlo. */}
                  <Fila rotulo="Precio" valor="Se define en el momento" />
                </dl>

                {/*
                  El nombre pasa a ser obligatorio. Sin el, en la agenda
                  quedaba un turno anonimo: Valen no sabia a quien
                  esperaba ni a quien escribirle si tenia que mover el
                  horario. Va con etiqueta visible y no solo con
                  placeholder, que desaparece apenas se empieza a
                  escribir y deja el campo sin decir que es.
                */}
                <label className="mt-4 block">
                  <span className="text-lg text-tinta">Tu nombre</span>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Como te llamás"
                    autoComplete="given-name"
                    required
                    aria-required="true"
                    className="mt-1.5 min-h-13 w-full rounded-chico border border-borde bg-white px-4 text-lg text-tinta outline-none transition-colors placeholder:text-tinta-suave focus:border-vino"
                  />
                </label>

                {completo ? (
                  <>
                    {/*
                      El salto de app asusta si no se avisa: la clienta toca
                      un boton y de golpe esta en otro lado. Se le cuenta
                      antes, y se aclara que el mensaje no se manda solo.
                    */}
                    <p
                      id="aviso-whatsapp"
                      className="mt-4 flex items-start gap-2.5 rounded-chico bg-white px-4 py-3 text-lg leading-snug text-tinta"
                    >
                      <IconoWhatsApp className="mt-1 h-5 w-5 shrink-0 text-vino" />
                      <span>
                        Al tocar se abre <b>WhatsApp</b> con el mensaje ya
                        escrito. Lo enviás vos. Esta página queda abierta.
                      </span>
                    </p>

                    <a
                      href={enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={reservarHorario}
                      aria-describedby="aviso-whatsapp"
                      className="boton-principal mt-3 w-full"
                    >
                      <IconoWhatsApp className="h-5 w-5" />
                      Abrir WhatsApp y confirmar
                    </a>
                  </>
                ) : (
                  /* Antes decia siempre "completa los pasos 1 y 2",
                     tambien cuando lo unico que faltaba era el nombre.
                     Quien lee eso vuelve a mirar arriba y no encuentra
                     nada mal. */
                  <p className="mt-3 rounded-full bg-vino/12 px-6 py-3.5 text-center text-lg text-tinta-suave">
                    {fecha && hora
                      ? "Escribí tu nombre para confirmar"
                      : "Elegí el día y la hora"}
                  </p>
                )}

                <p className="mt-3 text-center text-lg leading-snug text-tinta-suave">
                  Queda confirmado cuando Valen te responde.
                </p>

                <p className="mt-4 border-t border-vino/15 pt-4 text-lg leading-snug text-tinta-suave">
                  {consultorio.comoVenir}
                </p>
              </div>
            )}
            </div>
          </div>
        </div>

        <GestionTurno />
      </div>
    </section>
  );
}

/**
 * Que paso con el horario, segun lo que contesto el servidor.
 *
 * Son cuatro finales distintos y cada uno dice la verdad. El unico que
 * existia antes era el primero, y se mostraba siempre: tambien cuando el
 * horario ya estaba tomado y cuando la base ni se habia enterado.
 */
type Resultado = {
  estado: "guardando" | "reservado" | "tomado" | "sin-guardar";
  detalle: string;
} | null;

function TurnoEnviado({
  resultado,
  enlace,
  calendario,
  onEmpezarDeNuevo,
  onElegirOtroHorario,
}: {
  resultado: NonNullable<Resultado>;
  enlace: string;
  calendario: string | null;
  onEmpezarDeNuevo: () => void;
  onElegirOtroHorario: () => void;
}) {
  const { estado, detalle } = resultado;

  /* El horario se lo ganaron por unos segundos. WhatsApp ya se abrio con
     el mensaje viejo, asi que hay que decirselo: si no, manda un pedido
     por un horario que no existe y se queda esperando. */
  if (estado === "tomado") {
    return (
      <div className="animar-entrada mt-3 rounded-suave border-2 border-vino bg-white px-5 py-6 shadow-suave">
        <h4 className="text-xl font-semibold text-tinta">
          Ese horario lo acaban de tomar
        </h4>

        <p className="mt-2 text-lg leading-snug text-tinta">{detalle}</p>

        <p className="mt-3 text-lg leading-snug text-tinta-suave">
          Otra persona lo reservó unos segundos antes. Elegí otro horario acá
          abajo: la lista ya está actualizada.
        </p>

        <p className="mt-3 text-lg leading-snug text-tinta-suave">
          Si ya se te abrió WhatsApp, no mandes ese mensaje o avisale a Valen
          que vas a elegir otro día.
        </p>

        <button
          type="button"
          onClick={onElegirOtroHorario}
          className="boton-principal mt-5 w-full"
        >
          Elegir otro horario
        </button>
      </div>
    );
  }

  /* Guardado a medias: el mensaje de WhatsApp es lo unico que quedo. No
     se le promete un lugar que la agenda no tiene anotado. */
  if (estado === "sin-guardar") {
    return (
      <div className="animar-entrada mt-3 rounded-suave border-2 border-vino bg-white px-5 py-6 shadow-suave">
        <h4 className="text-xl font-semibold text-tinta">
          Mandá el mensaje para asegurar el turno
        </h4>

        <p className="mt-2 text-lg leading-snug text-tinta">{detalle}</p>

        <p className="mt-3 text-lg leading-snug text-tinta-suave">
          No pudimos anotar el horario en la agenda. El mensaje de WhatsApp ya
          está escrito: enviálo y Valen te lo confirma por ahí.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <a
            href={enlace}
            target="_blank"
            rel="noopener noreferrer"
            className="boton-principal w-full"
          >
            <IconoWhatsApp className="h-5 w-5" />
            Abrir WhatsApp de nuevo
          </a>

          <button
            type="button"
            onClick={onEmpezarDeNuevo}
            className="min-h-12 rounded-full border border-borde bg-white px-6 text-lg text-tinta-suave transition-colors hover:border-vino hover:text-vino"
          >
            Empezar de nuevo
          </button>
        </div>
      </div>
    );
  }

  const guardando = estado === "guardando";

  return (
    <div className="animar-entrada mt-3 rounded-suave border border-vino/25 bg-vino-suave px-5 py-6 shadow-suave">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full text-white ${
          guardando ? "bg-vino/50" : "bg-vino"
        }`}
      >
        <IconoCheck className="h-5 w-5" />
      </span>

      <h4 className="mt-4 text-xl font-semibold text-tinta">
        {guardando ? "Guardando tu horario…" : "Tu horario quedó reservado"}
      </h4>

      <p className="mt-2 text-lg leading-snug text-tinta">{detalle}</p>

      <p className="mt-3 text-lg leading-snug text-tinta-suave">
        {guardando
          ? "Un segundo, lo estamos anotando en la agenda."
          : "Ya nadie más puede tomarlo. Queda confirmado cuando Valen te responda el mensaje de WhatsApp."}
      </p>

      {!guardando && (
        <div className="mt-5 flex flex-col gap-2">
          {calendario && (
            <a href={calendario} download className="boton-principal w-full">
              Agendar en mi celular
            </a>
          )}

          <a
            href={enlace}
            target="_blank"
            rel="noopener noreferrer"
            className="boton-suave w-full"
          >
            <IconoWhatsApp className="h-5 w-5" />
            Abrir WhatsApp de nuevo
          </a>

          <button
            type="button"
            onClick={onEmpezarDeNuevo}
            className="min-h-12 rounded-full border border-borde bg-white px-6 text-lg text-tinta-suave transition-colors hover:border-vino hover:text-vino"
          >
            Reservar otro turno
          </button>
        </div>
      )}
    </div>
  );
}

function Paso({ numero, titulo }: { numero: number; titulo: string }) {
  return (
    <div className="mt-6 flex items-center gap-3 first:mt-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-vino text-lg font-medium text-white">
        {numero}
      </span>
      <h3 className="text-xl font-semibold text-tinta">{titulo}</h3>
    </div>
  );
}

function Fila({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-tinta-suave">{rotulo}</dt>
      <dd
        className={
          valor ? "text-right font-medium text-tinta" : "text-tinta-suave"
        }
      >
        {valor ?? "—"}
      </dd>
    </div>
  );
}
