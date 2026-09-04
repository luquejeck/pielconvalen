"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  Beneficio,
  ConfiguracionWeb,
  Pregunta,
  Video,
} from "@/lib/consultorio";
import { codigoDeReel } from "@/lib/instagram";

/**
 * "Mi web": lo que se ve en la pagina, editable sin programador.
 *
 * De las once cosas que se ven en el sitio, Valen podia cambiar dos —los
 * tratamientos y los horarios—. Las otras nueve vivian escritas en el
 * codigo: su nombre, la direccion, el telefono, los medios de pago, los
 * tres beneficios, las explicaciones de los tratamientos. Cambiar
 * cualquiera de esas necesitaba un programador y un deploy.
 *
 * Los campos van agrupados por lo que SON para ella —quien sos, donde
 * estas, como te contactan— y no por como estan guardados. Y cada uno
 * dice donde se ve en la pagina: sin eso hay que adivinar que cambia.
 */
export default function EditorWeb({ inicial }: { inicial: ConfiguracionWeb }) {
  const router = useRouter();

  const [datos, setDatos] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set =
    (campo: keyof ConfiguracionWeb) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDatos((d) => ({ ...d, [campo]: e.target.value }));

  const setBeneficio = (i: number, parte: keyof Beneficio, valor: string) =>
    setDatos((d) => ({
      ...d,
      beneficios: d.beneficios.map((b, j) =>
        j === i ? { ...b, [parte]: valor } : b
      ),
    }));

  const setPregunta = (i: number, parte: keyof Pregunta, valor: string) =>
    setDatos((d) => ({
      ...d,
      preguntas: d.preguntas.map((p, j) =>
        j === i ? { ...p, [parte]: valor } : p
      ),
    }));

  const agregarPregunta = () =>
    setDatos((d) => ({
      ...d,
      preguntas: [...d.preguntas, { pregunta: "", respuesta: "" }],
    }));

  const quitarPregunta = (i: number) =>
    setDatos((d) => ({ ...d, preguntas: d.preguntas.filter((_, j) => j !== i) }));

  const setContra = (i: number, valor: string) =>
    setDatos((d) => ({
      ...d,
      contraindicaciones: d.contraindicaciones.map((c, j) => (j === i ? valor : c)),
    }));

  const agregarContra = () =>
    setDatos((d) => ({ ...d, contraindicaciones: [...d.contraindicaciones, ""] }));

  const quitarContra = (i: number) =>
    setDatos((d) => ({
      ...d,
      contraindicaciones: d.contraindicaciones.filter((_, j) => j !== i),
    }));

  const setProtocolo = (i: number, valor: string) =>
    setDatos((d) => ({
      ...d,
      protocolo: d.protocolo.map((x, j) => (j === i ? valor : x)),
    }));

  const agregarProtocolo = () =>
    setDatos((d) => ({ ...d, protocolo: [...d.protocolo, ""] }));

  const quitarProtocolo = (i: number) =>
    setDatos((d) => ({ ...d, protocolo: d.protocolo.filter((_, j) => j !== i) }));

  const setVideo = (i: number, parte: keyof Video, valor: string) =>
    setDatos((d) => ({
      ...d,
      videos: d.videos.map((v, j) => (j === i ? { ...v, [parte]: valor } : v)),
    }));

  const agregarVideo = () =>
    setDatos((d) => ({ ...d, videos: [...d.videos, { titulo: "", url: "" }] }));

  const quitarVideo = (i: number) =>
    setDatos((d) => ({ ...d, videos: d.videos.filter((_, j) => j !== i) }));

  const setGlosario = (termino: string, texto: string) =>
    setDatos((d) => ({ ...d, glosario: { ...d.glosario, [termino]: texto } }));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setAviso(null);
    setError(null);

    const res = await fetch("/api/configuracion", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    setGuardando(false);

    if (!res.ok) {
      setError("No se pudo guardar. Probá de nuevo.");
      return;
    }

    setAviso("Guardado. Ya se ve en la web.");
    router.refresh();
    setTimeout(() => setAviso(null), 4000);
  };

  return (
    <form onSubmit={guardar} className="space-y-6">
      <p className="text-lg text-tinta-suave">
        Lo que cambies acá se ve en la web al instante.
      </p>

      <Grupo titulo="Quién sos">
        <Campo
          rotulo="Nombre del consultorio"
          ayuda="Arriba a la izquierda y en el pie"
          valor={datos.nombre}
          onChange={set("nombre")}
        />
        <Campo
          rotulo="Tu nombre"
          ayuda="El título grande de la portada"
          valor={datos.profesional}
          onChange={set("profesional")}
        />
        <Campo
          rotulo="Profesión"
          ayuda="Debajo de tu nombre. Hoy dice Cosmetóloga y Cosmiatra"
          valor={datos.profesion}
          onChange={set("profesion")}
        />
        <Campo
          rotulo="Credencial corta"
          ayuda="Va al lado de la profesión"
          valor={datos.titulo}
          onChange={set("titulo")}
        />
        <Campo
          rotulo="Carrera completa"
          ayuda="En «Quién te va a atender»"
          valor={datos.carrera}
          onChange={set("carrera")}
        />
        <Campo
          rotulo="Frase de la portada"
          ayuda="El eslogan, debajo de la profesión"
          valor={datos.eslogan}
          onChange={set("eslogan")}
        />
        <Campo
          rotulo="Qué hacés, en criollo"
          ayuda="La línea que explica el rubro a quien no lo conoce"
          valor={datos.queSeHace}
          onChange={set("queSeHace")}
        />
        <Campo
          rotulo="Tu presentación, en primera persona"
          ayuda="En «Quién te va a atender». Escribilo como se lo contarías a una clienta nueva: tres o cuatro renglones, con tus palabras"
          valor={datos.bio}
          largo
          onChange={set("bio")}
        />
        <Campo
          rotulo="Matrícula profesional"
          ayuda="Va debajo de tu nombre. Si la dejás vacía, no se muestra"
          valor={datos.matricula}
          onChange={set("matricula")}
        />
        <Campo
          rotulo="Años de experiencia"
          ayuda="Ej: «8 años atendiendo en Caballito». Vacío = no se muestra"
          valor={datos.experiencia}
          onChange={set("experiencia")}
        />
      </Grupo>

      <Grupo titulo="Cómo se trabaja acá">
        <p className="text-base text-tinta-suave">
          Material, esterilización, ficha previa. Es lo que más tranquiliza a
          quien nunca se hizo un tratamiento con agujas. Revisá que cada punto
          sea exacto: decir algo que no se cumple es peor que no decir nada.
        </p>

        {datos.protocolo.map((punto, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={punto}
              onChange={(e) => setProtocolo(i, e.target.value)}
              placeholder="Agujas y guantes descartables, abiertos delante tuyo"
              className="min-h-12 w-full px-4 text-base"
            />
            <button
              type="button"
              onClick={() => quitarProtocolo(i)}
              aria-label="Quitar este punto"
              className="shrink-0 rounded-full px-4 text-base text-tinta-suave hover:text-vino"
            >
              Quitar
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={agregarProtocolo}
          className="min-h-12 rounded-full border border-vino px-6 text-base text-vino hover:bg-vino hover:text-white"
        >
          Agregar punto
        </button>
      </Grupo>

      <Grupo titulo="Dónde estás">
        <Campo
          rotulo="Dirección"
          ayuda="Se ve en la portada, en «Dónde queda» y en el pie"
          valor={datos.direccion}
          onChange={set("direccion")}
        />
        <Campo
          rotulo="Link del mapa"
          ayuda="A dónde lleva el botón «Ver en el mapa»"
          valor={datos.mapsUrl}
          onChange={set("mapsUrl")}
        />
        <Campo
          rotulo="Punto de referencia"
          ayuda="Ej: «a dos cuadras del Parque Rivadavia». Si lo dejás vacío, no se muestra"
          valor={datos.referencia}
          onChange={set("referencia")}
        />
        <Campo
          rotulo="Cómo llegar en transporte"
          ayuda="Las líneas que paran cerca. Vacío = no se muestra"
          valor={datos.transporte}
          onChange={set("transporte")}
        />
      </Grupo>

      <Grupo titulo="Cómo te contactan">
        <Campo
          rotulo="WhatsApp (solo números, con código de país)"
          ayuda="A este número van todos los botones de WhatsApp"
          valor={datos.whatsapp}
          onChange={set("whatsapp")}
        />
        <Campo
          rotulo="Teléfono como se ve"
          ayuda="El número escrito lindo, en el pie"
          valor={datos.whatsappVisible}
          onChange={set("whatsappVisible")}
        />
        <Campo
          rotulo="Teléfono para llamar"
          ayuda="El del botón «Llamame». Formato +5491122943672"
          valor={datos.telefono}
          onChange={set("telefono")}
        />
        <Campo
          rotulo="Instagram (sin arroba)"
          valor={datos.instagram}
          onChange={set("instagram")}
        />
        <Campo
          rotulo="Link de Instagram"
          valor={datos.instagramUrl}
          onChange={set("instagramUrl")}
        />
      </Grupo>

      <Grupo titulo="Lo que le contás a la clienta">
        <Campo
          rotulo="Medios de pago"
          ayuda="Se avisa justo debajo de los precios"
          valor={datos.mediosDePago}
          onChange={set("mediosDePago")}
        />
        <Campo
          rotulo="Cómo tiene que venir"
          ayuda="En el paso 3, al confirmar el turno"
          valor={datos.comoVenir}
          largo
          onChange={set("comoVenir")}
        />
      </Grupo>

      <Grupo titulo="Qué va a notar">
        <p className="text-base text-tinta-suave">
          Los tres beneficios de la portada. El dibujito de cada uno lo pone
          el sistema.
        </p>
        {datos.beneficios.map((b, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <input
              type="text"
              value={b.titulo}
              onChange={(e) => setBeneficio(i, "titulo", e.target.value)}
              placeholder="Piel más sana"
              className="min-h-12 w-full px-4 text-base"
            />
            <input
              type="text"
              value={b.texto}
              onChange={(e) => setBeneficio(i, "texto", e.target.value)}
              placeholder="Limpia, descongestionada y desinflamada."
              className="min-h-12 w-full px-4 text-base"
            />
          </div>
        ))}
      </Grupo>

      <Grupo titulo="Los nombres técnicos, explicados">
        <p className="text-base text-tinta-suave">
          Lo que aparece en «Lo que se suma en algunos». Escribilo como se lo
          explicarías a alguien que nunca lo escuchó.
        </p>
        {Object.entries(datos.glosario).map(([termino, texto]) => (
          <label key={termino} className="block">
            <span className="text-base font-medium text-vino">{termino}</span>
            <textarea
              rows={2}
              value={texto}
              onChange={(e) => setGlosario(termino, e.target.value)}
              className="mt-1.5 w-full px-4 py-2.5 text-base"
            />
          </label>
        ))}
      </Grupo>

      <Grupo titulo="Videos de Instagram">
        <p className="text-base text-tinta-suave">
          Se ven en &ldquo;Cómo es una sesión&rdquo;, arriba de tu foto. Pegá el
          link del reel como te lo copia Instagram: sirve tal cual, con la
          barra del final y con lo que venga pegado atrás. Si sacás todos,
          la sección desaparece de la web.
        </p>

        <p className="text-base text-tinta-suave">
          El <b>nombre</b> no se ve en la web: es para que sepas cuál es cuál
          acá adentro, y para quien navega con lector de pantalla.
        </p>

        {datos.videos.map((v, i) => (
          <div key={i} className="rounded-chico bg-crema-oscuro p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={v.titulo}
                onChange={(e) => setVideo(i, "titulo", e.target.value)}
                placeholder="Una limpieza profunda, de principio a fin"
                className="min-h-12 w-full px-4 text-base font-medium"
              />
              <button
                type="button"
                onClick={() => quitarVideo(i)}
                aria-label={`Quitar el video ${v.titulo}`}
                className="shrink-0 rounded-full px-4 text-base text-tinta-suave hover:text-vino"
              >
                Quitar
              </button>
            </div>
            <input
              type="text"
              value={v.url}
              onChange={(e) => setVideo(i, "url", e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              inputMode="url"
              className="mt-2 min-h-12 w-full px-4 text-base"
            />
            {/* Que el link no sirva se avisa acá y no en la web, donde el
                video simplemente no aparece y no hay forma de saber por qué. */}
            {v.url.trim() !== "" && !codigoDeReel(v.url) && (
              <p className="mt-2 text-sm text-negativo">
                Este link no parece de Instagram. Tenés que copiar el del reel,
                que empieza con instagram.com/reel/
              </p>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={agregarVideo}
          className="min-h-12 rounded-full border border-vino px-6 text-base text-vino hover:bg-vino hover:text-white"
        >
          Agregar video
        </button>
      </Grupo>

      <Grupo titulo="Preguntas frecuentes">
        <p className="text-base text-tinta-suave">
          Se ven entre los precios y el módulo de reservas, que es donde
          aparecen las dudas. Escribilas como te las hacen, no como las diría
          un manual.
        </p>

        {datos.preguntas.map((p, i) => (
          <div key={i} className="rounded-chico bg-crema-oscuro p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={p.pregunta}
                onChange={(e) => setPregunta(i, "pregunta", e.target.value)}
                placeholder="¿Duele?"
                className="min-h-12 w-full px-4 text-base font-medium"
              />
              <button
                type="button"
                onClick={() => quitarPregunta(i)}
                aria-label={`Quitar la pregunta ${p.pregunta}`}
                className="shrink-0 rounded-full px-4 text-base text-tinta-suave hover:text-vino"
              >
                Quitar
              </button>
            </div>
            <textarea
              rows={2}
              value={p.respuesta}
              onChange={(e) => setPregunta(i, "respuesta", e.target.value)}
              placeholder="La respuesta, en dos o tres renglones."
              className="mt-2 w-full px-4 py-2.5 text-base"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={agregarPregunta}
          className="min-h-12 rounded-full border border-vino px-6 text-base text-vino hover:bg-vino hover:text-white"
        >
          Agregar pregunta
        </button>
      </Grupo>

      <Grupo titulo="Cuándo tiene que escribirte antes">
        <p className="text-base text-tinta-suave">
          Los casos en que conviene consultar antes de reservar. Evita que
          alguien viaje hasta acá para que después haya que suspenderle la
          sesión. Es criterio tuyo: revisá que la lista sea la que usás.
        </p>

        {datos.contraindicaciones.map((c, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={c}
              onChange={(e) => setContra(i, e.target.value)}
              placeholder="Estás embarazada o amamantando"
              className="min-h-12 w-full px-4 text-base"
            />
            <button
              type="button"
              onClick={() => quitarContra(i)}
              aria-label="Quitar este caso"
              className="shrink-0 rounded-full px-4 text-base text-tinta-suave hover:text-vino"
            >
              Quitar
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={agregarContra}
          className="min-h-12 rounded-full border border-vino px-6 text-base text-vino hover:bg-vino hover:text-white"
        >
          Agregar caso
        </button>
      </Grupo>

      {error && (
        <p className="rounded-chico bg-negativo-suave px-5 py-4 text-base text-negativo">
          {error}
        </p>
      )}

      {/*
        El boton se queda pegado abajo: el formulario es largo y hay que
        poder guardar desde donde uno esta, sin volver hasta el final.
      */}
      <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-suave border border-borde bg-white/95 px-5 py-4 backdrop-blur">
        <button
          type="submit"
          disabled={guardando}
          className="boton-principal disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
        {aviso && <p className="text-base text-positivo">✓ {aviso}</p>}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-base text-tinta-suave underline hover:text-vino"
        >
          Ver la web
        </a>
      </div>
    </form>
  );
}

/* ---------------------------------------------------------------------- */

function Grupo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="tarjeta space-y-4 px-5 py-5">
      <h2 className="text-xl font-semibold text-tinta">{titulo}</h2>
      {children}
    </section>
  );
}

function Campo({
  rotulo,
  ayuda,
  valor,
  largo = false,
  onChange,
}: {
  rotulo: string;
  ayuda?: string;
  valor: string;
  largo?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <label className="block">
      <span className="text-base text-tinta">{rotulo}</span>
      {largo ? (
        <textarea
          rows={3}
          value={valor}
          onChange={onChange}
          className="mt-1.5 w-full px-4 py-2.5 text-base"
        />
      ) : (
        <input
          type="text"
          value={valor}
          onChange={onChange}
          className="mt-1.5 min-h-12 w-full px-4 text-base"
        />
      )}
      {/* Donde se ve cada campo. Sin esto hay que tocar y adivinar. */}
      {ayuda && <span className="mt-1 block text-sm text-tinta-suave">{ayuda}</span>}
    </label>
  );
}
