"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Beneficio, ConfiguracionWeb } from "@/lib/consultorio";

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
