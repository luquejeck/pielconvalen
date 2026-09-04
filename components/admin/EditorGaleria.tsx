"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Foto = {
  id: string;
  titulo: string;
  descripcion: string | null;
  archivo: string;
  orden: number;
  publicado: boolean;
  /* Las filas viejas no lo traen: antes de la migracion todo era foto. */
  tipo?: "foto" | "video";
};

const esVideo = (f: Foto) => f.tipo === "video";

/**
 * Las fotos que se ven en la galería de la web.
 *
 * Se suben SIN publicar y aparecen recien cuando Valen las publica a
 * mano. Una foto que se sube por error no llega a la web.
 *
 * El orden se cambia con flechas y no arrastrando: arrastrar en una
 * pantalla tactil compite con el desplazamiento de la pagina y termina
 * moviendo cosas sin querer.
 */
export default function EditorGaleria({ urlBase }: { urlBase: string }) {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [porBorrar, setPorBorrar] = useState<string | null>(null);
  const formulario = useRef<HTMLFormElement>(null);

  const url = (archivo: string) =>
    `${urlBase}/storage/v1/object/public/casos/${archivo}`;

  const cargar = useCallback(async () => {
    const res = await fetch("/api/galeria");
    if (res.ok) {
      const data = await res.json();
      setFotos(Array.isArray(data) ? data : []);
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

    const res = await fetch("/api/galeria", {
      method: "POST",
      body: new FormData(e.currentTarget),
    });

    setSubiendo(false);

    if (!res.ok) {
      const { error: mensaje } = await res.json().catch(() => ({ error: null }));
      setError(mensaje ?? "No se pudo subir la foto.");
      return;
    }

    formulario.current?.reset();
    await cargar();
  };

  const cambiar = async (id: string, cambios: Partial<Foto>) => {
    setError(null);
    const res = await fetch(`/api/galeria?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    });
    if (!res.ok) {
      setError("No se pudo cambiar.");
      return;
    }
    await cargar();
  };

  /* Mover una foto intercambia su orden con la vecina. Dos escrituras y
     listo, sin renumerar toda la lista. */
  const mover = async (i: number, direccion: -1 | 1) => {
    const a = fotos[i];
    const b = fotos[i + direccion];
    if (!a || !b) return;
    await cambiar(a.id, { orden: b.orden });
    await cambiar(b.id, { orden: a.orden });
  };

  const borrar = async (id: string) => {
    const res = await fetch(`/api/galeria?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("No se pudo eliminar.");
      return;
    }
    setPorBorrar(null);
    setFotos((prev) => prev.filter((f) => f.id !== id));
  };

  const publicadas = fotos.filter((f) => f.publicado).length;

  return (
    <div className="space-y-6">
      <p className="text-lg text-tinta-suave">
        Fotos del consultorio, de los productos o de un tratamiento, y los
        videos de &ldquo;Cómo es una sesión&rdquo;. Se suben sin publicar:
        aparecen en la web recién cuando las publicás vos.
      </p>

      {error && (
        <p className="rounded-chico bg-negativo-suave px-5 py-4 text-base text-negativo">
          {error}
        </p>
      )}

      <form ref={formulario} onSubmit={subir} className="tarjeta space-y-4 px-5 py-5">
        <h2 className="text-xl font-semibold text-tinta">
          Agregar una foto o un video
        </h2>

        <label className="block">
          <span className="text-base text-tinta">El archivo</span>
          <input
            type="file"
            name="foto"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
            required
            className="mt-1.5 w-full text-base"
          />
          {/*
            El peso de la foto no importa: la web la achica sola. El del
            video si, porque se sirve tal cual.

            Un video subido acá se ve SIN el marco de Instagram. Mientras
            no haya ninguno, la sección muestra los reels embebidos, que
            traen la cabecera con el arroba y el pie con los corazones.
          */}
          <span className="mt-1 block text-sm text-tinta-suave">
            Foto: como sale de la cámara, hasta 10 MB. Video: MP4 o MOV,
            hasta 60 MB. El video se ve sin el marco de Instagram.
          </span>
        </label>

        <label className="block">
          <span className="text-base text-tinta">Qué se ve</span>
          <input
            type="text"
            name="titulo"
            required
            placeholder="La camilla, lista para atender"
            className="mt-1.5 min-h-12 w-full px-4 text-base"
          />
        </label>

        <label className="block">
          <span className="text-base text-tinta">Un detalle más (opcional)</span>
          <input
            type="text"
            name="descripcion"
            placeholder="Todo el material es descartable."
            className="mt-1.5 min-h-12 w-full px-4 text-base"
          />
        </label>

        <button
          type="submit"
          disabled={subiendo}
          className="boton-principal disabled:opacity-60"
        >
          {subiendo ? "Subiendo…" : "Subir sin publicar"}
        </button>
      </form>

      {cargando ? (
        <p className="text-center text-tinta-suave">Cargando…</p>
      ) : fotos.length === 0 ? (
        <p className="rounded-suave border border-borde bg-white px-6 py-10 text-center text-base text-tinta-suave">
          Todavía no subiste ninguna foto. Mientras no haya ninguna publicada,
          la sección no aparece en la web.
        </p>
      ) : (
        <>
          <p className="text-sm text-tinta-suave">
            {fotos.length} {fotos.length === 1 ? "archivo" : "archivos"} ·{" "}
            {fotos.filter(esVideo).length}{" "}
            {fotos.filter(esVideo).length === 1 ? "video" : "videos"} ·{" "}
            {publicadas} en la web
          </p>

          <ul className="space-y-3">
            {fotos.map((f, i) => (
              <li key={f.id} className="tarjeta overflow-hidden">
                <div className="flex items-stretch gap-4">
                  {/* Sin next/image: es el panel, no la web. Y un video
                      no se dibuja con <img>: se pide solo el primer
                      cuadro, que alcanza para reconocerlo en la lista. */}
                  {esVideo(f) ? (
                    <video
                      src={url(f.archivo)}
                      muted
                      playsInline
                      preload="metadata"
                      className="aspect-square w-28 shrink-0 bg-tinta object-cover"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={url(f.archivo)}
                      alt={f.titulo}
                      className="aspect-square w-28 shrink-0 object-cover"
                    />
                  )}

                  <div className="min-w-0 flex-1 py-3 pr-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-lg font-medium text-tinta">{f.titulo}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          f.publicado
                            ? "bg-positivo-suave text-positivo"
                            : "bg-crema-oscuro text-tinta-suave"
                        }`}
                      >
                        {f.publicado ? "En la web" : "Sin publicar"}
                      </span>
                    </div>

                    {f.descripcion && (
                      <p className="mt-1 text-base text-tinta-suave">
                        {f.descripcion}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => cambiar(f.id, { publicado: !f.publicado })}
                        className={`min-h-11 rounded-full px-5 text-base font-medium ${
                          f.publicado
                            ? "border border-borde bg-white text-tinta-suave"
                            : "bg-vino text-crema"
                        }`}
                      >
                        {f.publicado ? "Sacar de la web" : "Publicar"}
                      </button>

                      <button
                        onClick={() => mover(i, -1)}
                        disabled={i === 0}
                        aria-label="Subir en el orden"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-borde text-xl text-tinta-suave disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => mover(i, 1)}
                        disabled={i === fotos.length - 1}
                        aria-label="Bajar en el orden"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-borde text-xl text-tinta-suave disabled:opacity-30"
                      >
                        ↓
                      </button>

                      <button
                        onClick={() => setPorBorrar(f.id)}
                        className="ml-auto rounded-full px-4 py-1.5 text-base text-tinta-suave hover:text-negativo"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>

                {porBorrar === f.id && (
                  <div className="border-t border-borde bg-negativo-suave px-4 py-3">
                    <p className="text-base text-negativo">
                      ¿Eliminar esta foto? Se borra también el archivo.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => borrar(f.id)}
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
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
