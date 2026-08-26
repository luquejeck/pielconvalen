"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CasoDB = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tratamiento: string | null;
  consentimiento: string | null;
  archivo_antes: string;
  archivo_despues: string;
  publicado: boolean;
};

/**
 * Los antes y después que se ven en la web.
 *
 * Se suben las dos fotos juntas y el caso queda SIN PUBLICAR: aparece en
 * la web recien cuando Valen lo publica a mano. Publicar la cara de una
 * clienta es algo que se decide mirando, no un efecto secundario de
 * apretar "guardar".
 *
 * Por eso tambien el campo de consentimiento: queda anotado quien
 * autorizo y cuando. No se ve en la web, es el respaldo de Valen.
 */
export default function EditorCasos({ urlBase }: { urlBase: string }) {
  const [casos, setCasos] = useState<CasoDB[]>([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [porBorrar, setPorBorrar] = useState<string | null>(null);
  const formulario = useRef<HTMLFormElement>(null);

  const foto = (archivo: string) =>
    `${urlBase}/storage/v1/object/public/casos/${archivo}`;

  const cargar = useCallback(async () => {
    const res = await fetch("/api/casos");
    if (res.ok) {
      const data = await res.json();
      setCasos(Array.isArray(data) ? data : []);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const subir = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubiendo(true);
    setError(null);

    const res = await fetch("/api/casos", {
      method: "POST",
      body: new FormData(e.currentTarget),
    });

    setSubiendo(false);

    if (!res.ok) {
      const { error: mensaje } = await res.json().catch(() => ({ error: null }));
      setError(mensaje ?? "No se pudo guardar el caso.");
      return;
    }

    formulario.current?.reset();
    await cargar();
  };

  const alternarPublicado = async (c: CasoDB) => {
    setError(null);
    const res = await fetch(`/api/casos?id=${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicado: !c.publicado }),
    });
    if (!res.ok) {
      setError("No se pudo cambiar.");
      return;
    }
    await cargar();
  };

  const borrar = async (id: string) => {
    const res = await fetch(`/api/casos?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("No se pudo eliminar.");
      return;
    }
    setPorBorrar(null);
    setCasos((prev) => prev.filter((c) => c.id !== id));
  };

  const publicados = casos.filter((c) => c.publicado).length;

  return (
    <div className="space-y-6">
      <p className="text-lg text-tinta-suave">
        Las fotos se suben sin publicar. Aparecen en la web recién cuando las
        publicás vos.
      </p>

      {error && (
        <p className="rounded-chico bg-negativo-suave px-5 py-4 text-base text-negativo">
          {error}
        </p>
      )}

      <form ref={formulario} onSubmit={subir} className="tarjeta space-y-4 px-5 py-5">
        <h2 className="text-xl font-semibold text-tinta">Agregar un caso</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-base text-tinta">Foto de antes</span>
            <input
              type="file"
              name="antes"
              accept="image/jpeg,image/png,image/webp"
              required
              className="mt-1.5 w-full text-base"
            />
          </label>
          <label className="block">
            <span className="text-base text-tinta">Foto de después</span>
            <input
              type="file"
              name="despues"
              accept="image/jpeg,image/png,image/webp"
              required
              className="mt-1.5 w-full text-base"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-base text-tinta">Título</span>
          <input
            type="text"
            name="titulo"
            required
            placeholder="Piel con puntos negros en la zona T"
            className="mt-1.5 min-h-12 w-full px-4 text-base"
          />
        </label>

        <label className="block">
          <span className="text-base text-tinta">Qué tratamiento fue</span>
          <input
            type="text"
            name="tratamiento"
            placeholder="Higiene Facial con Ácidos"
            className="mt-1.5 min-h-12 w-full px-4 text-base"
          />
        </label>

        <label className="block">
          <span className="text-base text-tinta">Qué contar del caso</span>
          <textarea
            name="descripcion"
            rows={2}
            placeholder="Dos sesiones con quince días de diferencia."
            className="mt-1.5 w-full px-4 py-2.5 text-base"
          />
        </label>

        <label className="block">
          <span className="text-base text-tinta">
            Quién autorizó a publicarlas
          </span>
          <input
            type="text"
            name="consentimiento"
            placeholder="María González, por WhatsApp, 12/08/2026"
            className="mt-1.5 min-h-12 w-full px-4 text-base"
          />
          {/* No se ve en la web: es tu respaldo. */}
          <span className="mt-1 block text-sm text-tinta-suave">
            Esto no se publica. Queda anotado por si alguna vez hace falta.
          </span>
        </label>

        <button
          type="submit"
          disabled={subiendo}
          className="boton-principal disabled:opacity-60"
        >
          {subiendo ? "Subiendo…" : "Guardar sin publicar"}
        </button>
      </form>

      {cargando ? (
        <p className="text-center text-tinta-suave">Cargando…</p>
      ) : casos.length === 0 ? (
        <p className="rounded-suave border border-borde bg-white px-6 py-10 text-center text-base text-tinta-suave">
          Todavía no cargaste ningún caso.
        </p>
      ) : (
        <>
          <p className="text-sm text-tinta-suave">
            {casos.length} {casos.length === 1 ? "caso" : "casos"} ·{" "}
            {publicados} en la web
          </p>

          <ul className="space-y-3">
            {casos.map((c) => (
              <li key={c.id} className="tarjeta overflow-hidden">
                <div className="grid grid-cols-2">
                  {/* Sin next/image a proposito: es el panel, no la web,
                      y no vale la pena optimizar lo que mira una persona. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={foto(c.archivo_antes)}
                    alt={`Antes: ${c.titulo}`}
                    className="aspect-square w-full object-cover"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={foto(c.archivo_despues)}
                    alt={`Después: ${c.titulo}`}
                    className="aspect-square w-full object-cover"
                  />
                </div>

                <div className="px-4 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-lg font-medium text-tinta">{c.titulo}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        c.publicado
                          ? "bg-positivo-suave text-positivo"
                          : "bg-crema-oscuro text-tinta-suave"
                      }`}
                    >
                      {c.publicado ? "En la web" : "Sin publicar"}
                    </span>
                  </div>

                  {c.tratamiento && (
                    <p className="mt-1 text-base text-tinta-suave">{c.tratamiento}</p>
                  )}
                  {c.consentimiento && (
                    <p className="mt-1 text-sm text-tinta-suave">
                      Autorizó: {c.consentimiento}
                    </p>
                  )}

                  {porBorrar === c.id ? (
                    <div className="mt-3 rounded-chico bg-negativo-suave px-4 py-3">
                      <p className="text-base text-negativo">
                        ¿Eliminar este caso? Se borran también las dos fotos.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => borrar(c.id)}
                          className="min-h-11 rounded-full bg-negativo px-5 text-base font-medium text-white"
                        >
                          Sí, eliminar
                        </button>
                        <button
                          onClick={() => setPorBorrar(null)}
                          className="min-h-11 rounded-full border border-borde bg-white px-5 text-base text-tinta-suave"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => alternarPublicado(c)}
                        className={`min-h-11 rounded-full px-5 text-base font-medium ${
                          c.publicado
                            ? "border border-borde bg-white text-tinta-suave"
                            : "bg-vino text-crema"
                        }`}
                      >
                        {c.publicado ? "Sacar de la web" : "Publicar en la web"}
                      </button>
                      <button
                        onClick={() => setPorBorrar(c.id)}
                        className="min-h-11 rounded-full px-4 text-base text-tinta-suave hover:text-negativo"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
