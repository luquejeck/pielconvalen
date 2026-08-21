"use client";

import { useState } from "react";
import TituloSeccion from "./TituloSeccion";
import { IconoCheck, IconoWhatsApp } from "./iconos";
import {
  PREGUNTAS,
  calcularResultado,
  type Respuestas,
} from "@/lib/test-piel";
import { esConsulta, formatearPrecio, type Tratamiento } from "@/lib/tratamientos";
import { linkWhatsAppSimple } from "@/lib/whatsapp";

/**
 * Autoevaluacion (BETA). Una pregunta por pantalla: la clienta ve una
 * sola cosa a la vez y no tiene que decidir por donde empezar.
 */
export default function TestDePiel({
  tratamientos,
}: {
  tratamientos: Tratamiento[];
}) {
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuestas>({});

  const total = PREGUNTAS.length;
  const terminado = paso >= total;
  const pregunta = PREGUNTAS[paso];

  const responder = (opcionId: string) => {
    setRespuestas((r) => ({ ...r, [pregunta.id]: opcionId }));
    setPaso((p) => p + 1);
  };

  const volver = () => setPaso((p) => Math.max(0, p - 1));

  const empezarDeNuevo = () => {
    setRespuestas({});
    setPaso(0);
  };

  return (
    <section className="border-t border-borde bg-crema py-16 md:py-20 xl:py-24">
      <div className="contenedor">
        <TituloSeccion
          como="h1"
          titulo="¿Cuál me conviene?"
          bajada="Cinco preguntas cortas y te decimos por cuál empezar. No reemplaza que Valen te vea la piel."
        />

        <div className="tarjeta mx-auto mt-14 max-w-2xl px-6 py-8 sm:px-10">
          {terminado ? (
            <Resultado
              respuestas={respuestas}
              tratamientos={tratamientos}
              onEmpezarDeNuevo={empezarDeNuevo}
            />
          ) : (
            <>
              {/* Cuanto falta: sin esto no se sabe si son 5 o 50 preguntas */}
              <div className="flex items-center gap-3">
                <span className="shrink-0 text-base font-medium text-vino">
                  Pregunta {paso + 1} de {total}
                </span>
                <span className="h-1.5 grow overflow-hidden rounded-full bg-vino/12">
                  <span
                    className="block h-full rounded-full bg-vino transition-all duration-300"
                    style={{ width: `${(paso / total) * 100}%` }}
                  />
                </span>
              </div>

              <h2 className="mt-6 text-2xl font-semibold leading-tight text-tinta">
                {pregunta.texto}
              </h2>
              {pregunta.ayuda && (
                <p className="mt-2 text-base text-tinta-suave">
                  {pregunta.ayuda}
                </p>
              )}

              <ul className="mt-6 grid gap-2.5">
                {pregunta.opciones.map((opcion) => (
                  <li key={opcion.id}>
                    <button
                      type="button"
                      onClick={() => responder(opcion.id)}
                      className="flex min-h-14 w-full items-center rounded-2xl border border-borde bg-white px-5 py-3 text-left text-lg text-tinta transition-colors hover:border-vino hover:bg-vino-suave"
                    >
                      {opcion.texto}
                    </button>
                  </li>
                ))}
              </ul>

              {paso > 0 && (
                <button
                  type="button"
                  onClick={volver}
                  className="mt-5 text-base text-tinta-suave underline underline-offset-4 transition-colors hover:text-vino"
                >
                  Volver a la anterior
                </button>
              )}
            </>
          )}
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-tinta-suave">
          Versión de prueba. Todavía no está publicada en la web.
        </p>
      </div>
    </section>
  );
}

function Resultado({
  respuestas,
  tratamientos,
  onEmpezarDeNuevo,
}: {
  respuestas: Respuestas;
  tratamientos: Tratamiento[];
  onEmpezarDeNuevo: () => void;
}) {
  const { tratamiento, motivo } = calcularResultado(respuestas, tratamientos);

  const mensaje = esConsulta(tratamiento)
    ? "Hola Valen! Hice el test en la web y me dio que lo mejor es una consulta para que me veas la piel. ¿Cuándo tenés lugar?"
    : `Hola Valen! Hice el test en la web y me recomendó ${tratamiento.nombre}. ¿Cuándo tenés lugar?`;

  return (
    <div className="animar-entrada text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-vino text-white">
        <IconoCheck className="h-5 w-5" />
      </span>

      <p className="mt-5 text-base text-tinta-suave">
        Por lo que contaste, te conviene:
      </p>
      <h2 className="mt-1 text-2xl font-semibold text-tinta sm:text-3xl">
        {tratamiento.nombre}
      </h2>
      <p className="mt-1 text-xl font-semibold text-vino">
        {formatearPrecio(tratamiento.precio)}
      </p>

      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-tinta-suave">
        {motivo}
      </p>

      <div className="mt-7 flex flex-col gap-2.5">
        <a
          href={linkWhatsAppSimple(mensaje)}
          target="_blank"
          rel="noopener noreferrer"
          className="boton-principal w-full"
        >
          <IconoWhatsApp className="h-5 w-5" />
          Escribirle a Valen
        </a>

        <a
          href="/#reservar"
          className="boton-suave w-full"
        >
          Reservar día y hora
        </a>

        <button
          type="button"
          onClick={onEmpezarDeNuevo}
          className="min-h-12 rounded-full border border-borde bg-white px-6 text-base text-tinta-suave transition-colors hover:border-vino hover:text-vino"
        >
          Hacer el test de nuevo
        </button>
      </div>
    </div>
  );
}
