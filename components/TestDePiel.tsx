"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  NECESIDADES,
  fotoDe,
  hayStock,
  precioDe,
  sirvePara,
  slugDe,
  type Producto,
} from "@/lib/productos";
import { formatearPrecio, type Tratamiento } from "@/lib/tratamientos";
import { linkWhatsAppSimple } from "@/lib/whatsapp";
import { IconoWhatsApp } from "./iconos";
import { useReserva } from "./ReservaContext";
import TituloSeccion from "./TituloSeccion";

/**
 * "Conocé tu piel": un test de cuatro preguntas que termina en una
 * recomendacion.
 *
 * NO DIAGNOSTICA. Todos los turnos entran como consulta y el tratamiento
 * lo define Valen mirando la piel; esto es para quien todavia no sabe
 * por donde empezar. Le da un nombre a lo que siente, le muestra con que
 * tratamiento se suele arrancar y que productos lo acompañan, y la deja
 * a un toque del calendario o del WhatsApp con el resultado ya escrito.
 *
 * Arranca cerrado, como una tarjeta con un boton: abierto desde el
 * principio empujaba el calendario una pantalla mas abajo para todas,
 * y lo usan solo las que dudan.
 *
 * Todo pasa en el navegador: no se guarda ni se manda nada hasta que la
 * clienta toca el WhatsApp.
 */

type Opcion = { texto: string; valor: string };
type Pregunta = { id: string; titulo: string; ayuda?: string; opciones: Opcion[] };

const PREGUNTAS: Pregunta[] = [
  {
    id: "tipo",
    titulo: "¿Cómo sentís tu piel a media tarde?",
    ayuda: "Sin crema ni maquillaje, unas horas después de lavarte la cara.",
    opciones: [
      { texto: "Brilla en toda la cara", valor: "grasa" },
      { texto: "Brilla en frente y nariz, el resto bien", valor: "mixta" },
      { texto: "Tirante o áspera", valor: "seca" },
      { texto: "Cómoda, sin brillo ni tirantez", valor: "normal" },
    ],
  },
  {
    id: "reaccion",
    titulo: "¿Se te pone roja o te pica con productos nuevos?",
    opciones: [
      { texto: "Sí, me pasa seguido", valor: "mucho" },
      { texto: "A veces", valor: "aveces" },
      { texto: "Casi nunca", valor: "nunca" },
    ],
  },
  {
    id: "objetivo",
    titulo: "¿Qué te gustaría mejorar primero?",
    opciones: [
      { texto: "Poros abiertos y puntos negros", valor: "poros" },
      { texto: "Granitos o brotes", valor: "brotes" },
      { texto: "Manchas o piel apagada", valor: "luminosidad" },
      { texto: "Líneas finas o falta de firmeza", valor: "antiedad" },
      { texto: "Sequedad", valor: "hidratacion" },
      { texto: "Rojeces o ardor", valor: "sensible" },
    ],
  },
  {
    id: "experiencia",
    titulo: "¿Te hiciste alguna vez una limpieza facial?",
    opciones: [
      { texto: "Nunca", valor: "nunca" },
      { texto: "Sí, hace bastante", valor: "hace-tiempo" },
      { texto: "Sí, me hago seguido", valor: "seguido" },
    ],
  },
];

type Respuestas = Record<string, string>;

const TIPOS: Record<string, { nombre: string; texto: string }> = {
  grasa: {
    nombre: "Piel grasa",
    texto: "Produce más sebo del que necesita: brilla, marca los poros y se tapa con facilidad.",
  },
  mixta: {
    nombre: "Piel mixta",
    texto: "La zona T (frente, nariz y mentón) es grasa y las mejillas, normales o secas. Es la más común.",
  },
  seca: {
    nombre: "Piel seca",
    texto: "Le falta grasa propia para retener el agua: tira, se descama y las líneas se notan más.",
  },
  normal: {
    nombre: "Piel normal",
    texto: "Está equilibrada. El trabajo es mantenerla así y atender lo puntual.",
  },
};

/** Que necesidad de la tienda (lib/productos.ts) responde a cada objetivo. */
const NECESIDAD_DE: Record<string, string> = {
  poros: "poros",
  brotes: "poros",
  luminosidad: "luminosidad",
  antiedad: "antiedad",
  hidratacion: "hidratacion",
  sensible: "sensible",
};

/**
 * Que tecnica suma el tratamiento que se sugiere. Se busca por la
 * tecnica y no por el id porque los tratamientos los edita Valen en el
 * panel: un id cambiado no rompe el test, una tecnica que deja de
 * ofrecer simplemente cae en la limpieza profunda.
 */
function tecnicaSugerida(r: Respuestas): string | null {
  const sensible = r.reaccion === "mucho" || r.objetivo === "sensible";
  // La primera vez, o una piel que reacciona, se arranca por lo basico.
  if (sensible || r.experiencia === "nunca") return null;
  switch (r.objetivo) {
    case "poros":
    case "brotes":
      return "Ácidos";
    case "luminosidad":
      return "Dermaplaning";
    case "antiedad":
      return "Microneedling";
    default:
      return null;
  }
}

function elegirTratamiento(lista: Tratamiento[], tecnica: string | null) {
  const conPrecio = lista.filter((t) => t.precio > 0);
  if (tecnica) {
    // El que suma esa tecnica con menos agregados: el paso siguiente, no el combo entero.
    const candidatos = conPrecio
      .filter((t) => t.extras.includes(tecnica))
      .sort((a, b) => a.extras.length - b.extras.length);
    if (candidatos[0]) return candidatos[0];
  }
  return conPrecio.find((t) => t.extras.length === 0) ?? conPrecio[0] ?? null;
}

/** Hasta tres productos para la necesidad, con stock y de categorias distintas. */
function elegirProductos(productos: Producto[], necesidad: string) {
  const elegidos: Producto[] = [];
  const categorias = new Set<string>();
  for (const p of productos) {
    if (p.borrador || !hayStock(p) || !sirvePara(p, necesidad) || p.incluye) continue;
    if (categorias.has(p.categoria)) continue;
    categorias.add(p.categoria);
    elegidos.push(p);
    if (elegidos.length === 3) break;
  }
  return elegidos;
}

export default function TestDePiel({ productos }: { productos: Producto[] }) {
  const { tratamientos, consultorio, irAReservar } = useReserva();
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const caja = useRef<HTMLDivElement>(null);

  const terminado = paso >= PREGUNTAS.length;

  const resultado = useMemo(() => {
    if (!terminado) return null;
    const tipo = TIPOS[respuestas.tipo] ?? TIPOS.normal;
    const necesidad = NECESIDAD_DE[respuestas.objetivo] ?? "hidratacion";
    const tratamiento = elegirTratamiento(tratamientos, tecnicaSugerida(respuestas));
    return {
      tipo,
      sensible: respuestas.reaccion === "mucho",
      necesidad: NECESIDADES.find((n) => n.slug === necesidad),
      tratamiento,
      productos: elegirProductos(productos, necesidad),
    };
  }, [terminado, respuestas, tratamientos, productos]);

  /* Al cambiar de pregunta el foco va a la caja: quien navega con
     teclado o lector de pantalla no se queda en un boton que ya no esta. */
  const enfocar = () => requestAnimationFrame(() => caja.current?.focus());

  const responder = (valor: string) => {
    setRespuestas((r) => ({ ...r, [PREGUNTAS[paso].id]: valor }));
    setPaso((p) => p + 1);
    enfocar();
  };

  const reiniciar = () => {
    setRespuestas({});
    setPaso(0);
    enfocar();
  };

  const mensaje = resultado
    ? [
        "Hola Valen! Hice el test de piel de la web 🌿",
        `Me dio: ${resultado.tipo.nombre}${resultado.sensible ? ", sensible" : ""}.`,
        resultado.necesidad && `Quiero mejorar: ${resultado.necesidad.texto.toLowerCase()}.`,
        resultado.tratamiento && `Me sugirió: ${resultado.tratamiento.nombre}.`,
        "¿Me ayudás a elegir?",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <section id="test-piel" className="seccion border-t border-borde bg-crema-oscuro">
      <div className="contenedor">
        <div>
          <TituloSeccion
            titulo="Conocé tu piel"
            bajada="Cuatro preguntas y te decimos por dónde empezar."
          />
        </div>

        <div
          ref={caja}
          tabIndex={-1}
          className="tarjeta relative mx-auto mt-8 max-w-2xl overflow-hidden outline-none"
        >
          {!abierto ? (
            <div className="flex flex-col items-center gap-5 px-6 py-8 text-center sm:px-10">
              <ul className="flex flex-wrap justify-center gap-2" aria-hidden>
                {["Tipo de piel", "Sensibilidad", "Qué querés mejorar", "Tu experiencia"].map(
                  (t) => (
                    <li
                      key={t}
                      className="rounded-full bg-vino-suave px-3 py-1 text-sm font-medium text-vino"
                    >
                      {t}
                    </li>
                  ),
                )}
              </ul>
              <p className="max-w-md text-lg leading-snug text-tinta-suave">
                Al final te mostramos el tratamiento con el que se suele arrancar y los
                productos que te pueden servir. Tarda menos de un minuto.
              </p>
              <button
                type="button"
                className="boton-principal"
                onClick={() => {
                  setAbierto(true);
                  enfocar();
                }}
              >
                Empezar el test
              </button>
            </div>
          ) : !terminado ? (
            <Paso
              key={paso}
              numero={paso}
              pregunta={PREGUNTAS[paso]}
              elegida={respuestas[PREGUNTAS[paso].id]}
              onElegir={responder}
              onVolver={paso > 0 ? () => setPaso((p) => p - 1) : undefined}
            />
          ) : (
            resultado && (
              <div className="test-paso px-5 py-7 sm:px-8">
                <p className="rotulo-seccion text-center">Tu resultado</p>
                <h3 className="mt-3 text-center font-display text-3xl text-tinta">
                  {resultado.tipo.nombre}
                  {resultado.sensible && <span className="text-vino"> y sensible</span>}
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-center text-lg leading-snug text-tinta-suave">
                  {resultado.tipo.texto}
                  {resultado.sensible &&
                    " Al reaccionar fácil, conviene empezar suave y sumar de a poco."}
                </p>

                {resultado.tratamiento && (
                  <div className="mt-6 rounded-chico bg-vino-suave p-4 sm:p-5">
                    <p className="text-sm font-medium tracking-wide text-vino uppercase">
                      Para arrancar
                    </p>
                    <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4">
                      <p className="text-xl font-semibold text-tinta">
                        {resultado.tratamiento.nombre}
                      </p>
                      <p className="font-display text-lg font-semibold text-tinta tabular-nums">
                        {formatearPrecio(resultado.tratamiento.precio)}
                      </p>
                    </div>
                    <p className="mt-1 text-base leading-snug text-tinta-suave">
                      Es una orientación: en la consulta Valen te mira la piel y define el
                      tratamiento con vos.
                    </p>
                  </div>
                )}

                {resultado.productos.length > 0 && resultado.necesidad && (
                  <div className="mt-6">
                    <p className="text-base font-semibold text-tinta">
                      Para {resultado.necesidad.texto.toLowerCase()}, en casa
                    </p>
                    <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                      {resultado.productos.map((p, i) => (
                        <li
                          key={p.id}
                          className="test-producto"
                          style={{ animationDelay: `${0.15 + i * 0.1}s` }}
                        >
                          <Link
                            href={`/productos/${slugDe(p)}`}
                            className="group flex items-center gap-3 rounded-chico border border-borde bg-papel p-2 transition hover:-translate-y-0.5 hover:shadow-suave sm:flex-col sm:items-start"
                          >
                            <Image
                              src={fotoDe(p)}
                              alt=""
                              width={160}
                              height={160}
                              className="aspect-square w-16 shrink-0 rounded-lg bg-tinta object-cover sm:w-full"
                            />
                            <span className="min-w-0 text-sm leading-snug">
                              <span className="font-semibold text-tinta group-hover:text-vino">
                                {p.marca}
                              </span>{" "}
                              <span className="text-tinta">{p.nombre}</span>
                              <span className="mt-0.5 block font-display font-semibold text-tinta tabular-nums">
                                {precioDe(p)}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
                  <button type="button" className="boton-principal" onClick={irAReservar}>
                    Reservar consulta
                  </button>
                  <a
                    href={linkWhatsAppSimple(mensaje, consultorio.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="boton-secundario"
                  >
                    <IconoWhatsApp className="h-5 w-5" />
                    Mandarle el resultado
                  </a>
                </div>
                <p className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={reiniciar}
                    className="text-base text-tinta-suave underline underline-offset-4 hover:text-vino"
                  >
                    Hacer el test de nuevo
                  </button>
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

function Paso({
  numero,
  pregunta,
  elegida,
  onElegir,
  onVolver,
}: {
  numero: number;
  pregunta: Pregunta;
  elegida?: string;
  onElegir: (valor: string) => void;
  onVolver?: () => void;
}) {
  const total = PREGUNTAS.length;
  return (
    <div className="test-paso px-5 py-7 sm:px-8">
      <div className="flex items-center gap-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-crema-oscuro"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={numero + 1}
          aria-label={`Pregunta ${numero + 1} de ${total}`}
        >
          <div
            className="h-full rounded-full bg-vino transition-[width] duration-500 ease-out"
            style={{ width: `${((numero + 1) / total) * 100}%` }}
          />
        </div>
        <span className="text-sm text-tinta-suave tabular-nums">
          {numero + 1} de {total}
        </span>
      </div>

      <h3 className="mt-5 text-2xl font-semibold text-tinta">{pregunta.titulo}</h3>
      {pregunta.ayuda && <p className="mt-1 text-base text-tinta-suave">{pregunta.ayuda}</p>}

      <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {pregunta.opciones.map((o, i) => (
          <li key={o.valor} className="test-opcion" style={{ animationDelay: `${i * 0.05}s` }}>
            <button
              type="button"
              onClick={() => onElegir(o.valor)}
              aria-pressed={elegida === o.valor}
              className="flex min-h-14 w-full items-center rounded-chico border border-borde bg-papel px-4 py-3 text-left text-lg text-tinta transition hover:border-vino hover:bg-vino-suave active:scale-[0.98] aria-pressed:border-vino aria-pressed:bg-vino-suave"
            >
              {o.texto}
            </button>
          </li>
        ))}
      </ul>

      {onVolver && (
        <button
          type="button"
          onClick={onVolver}
          className="mt-5 text-base text-tinta-suave underline underline-offset-4 hover:text-vino"
        >
          ← Volver
        </button>
      )}
    </div>
  );
}
