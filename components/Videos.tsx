"use client";

import { useState } from "react";
import TituloSeccion from "./TituloSeccion";
import { useReserva } from "./ReservaContext";
import { codigoDeReel, esUrlDeReel, urlEmbebido } from "@/lib/instagram";
import type { VideoGaleria } from "@/lib/galeria";
import { IconoFlecha, IconoInstagram, IconoPlay } from "./iconos";

/**
 * "Cómo es una sesión": lo que pasa en la camilla, en video.
 *
 * Va entre "Qué vas a notar" y "Quién te va a atender" a proposito. Lo
 * de arriba es una promesa —piel mas sana, mas luminosa— y lo de abajo
 * es una cara. Entre las dos falta la unica cosa que contesta la duda
 * real de quien nunca se hizo una limpieza: que te van a hacer. Eso una
 * foto no lo puede mostrar. Un video, si.
 *
 * ----------------------------------------------------------------------
 * DOS ORIGENES, Y POR QUE UNO ES MEJOR QUE EL OTRO
 *
 * 1. VIDEOS PROPIOS (`subidos`). Archivos nuestros, en nuestro bucket.
 *    Se ven SIN el marco de Instagram: ni la cabecera con el arroba, ni
 *    el pie con los corazones, ni el boton que se lleva a la clienta a
 *    otra aplicacion justo cuando estaba por reservar. Es un <video> y
 *    nada mas, con el aspecto de la pagina y no el de Instagram.
 *
 * 2. REELS EMBEBIDOS (la lista de "Mi web"). El respaldo, para que la
 *    seccion funcione desde el dia uno sin que Valen tenga que exportar
 *    y subir nada. Traen el marco de Instagram, y ese marco no se puede
 *    sacar: el embebido es una pagina de Instagram metida adentro de la
 *    nuestra, y su cabecera es parte del trato de usarlo gratis.
 *
 * Apenas hay UN video propio publicado, los reels dejan de mostrarse. No
 * se mezclan: media seccion con marco y media sin marco se ve como un
 * error, no como una decision.
 *
 * ----------------------------------------------------------------------
 * POR QUE NADA SE CARGA SOLO
 *
 * Ni el reel ni el video propio arrancan hasta que los tocan. Tres
 * videos cargando a la vez, en un celular con 4G flojo, pesan mas que
 * todo el resto de la web junta. Y con los embebidos hay algo mas:
 * mientras la clienta no toque nada, Instagram no se entera de que
 * existe. Cargarlos de una le manda su direccion IP a Facebook sin que
 * nadie lo haya pedido.
 *
 * De a uno por vez: al abrir el segundo, el primero se desmonta y deja
 * de sonar.
 * ---------------------------------------------------------------------- */

/*
 * El titulo NO se muestra debajo de cada tarjeta. Un epigrafe que
 * describe un video que todavia no se vio es una promesa escrita por
 * alguien que no lo filmo, y termina contando otra cosa que la que se
 * ve. La miniatura y el numero alcanzan para entender que hay tres.
 *
 * El titulo sigue existiendo: nombra la tarjeta para los lectores de
 * pantalla y sirve para reconocer cual es cual en el panel.
 */

/** Lo que se puede reproducir en una tarjeta, venga de donde venga. */
type Video =
  | { id: string; titulo: string; clase: "propio"; url: string }
  | {
      id: string;
      titulo: string;
      clase: "instagram";
      codigo: string;
      /* Un carrusel de fotos no es un reel: cambia como se lo nombra. */
      esReel: boolean;
    };

export default function Videos({ subidos }: { subidos: VideoGaleria[] }) {
  const { consultorio } = useReserva();
  const [abierto, setAbierto] = useState<string | null>(null);

  const videos: Video[] = subidos.map((v) => ({
    id: v.id,
    titulo: v.titulo,
    clase: "propio" as const,
    url: v.url,
  }));

  /* Los reels solo si no hay ninguno propio. Ver el comentario de arriba. */
  if (videos.length === 0) {
    for (const reel of consultorio.videos) {
      /* Un link que Instagram ya no reconoce no se muestra roto: se
         saltea. Valen los pega a mano y un caracter de mas no puede
         dejar un recuadro gris en el medio de la pagina. */
      const codigo = codigoDeReel(reel.url);
      if (codigo) {
        videos.push({
          id: codigo,
          titulo: reel.titulo,
          clase: "instagram" as const,
          codigo,
          esReel: esUrlDeReel(reel.url),
        });
      }
    }
  }

  if (videos.length === 0) return null;

  return (
    <section
      id="videos"
      className="border-t border-borde bg-crema py-14 md:py-16 xl:py-20"
    >
      <div className="contenedor">
        <TituloSeccion
          titulo="Cómo es una sesión"
          bajada="Lo que no se puede contar por escrito: las manos, el ritmo y cuánto se tarda."
        />

        {/*
          Misma tira que la galeria: scroll nativo, iman en cada tarjeta y
          el borde de la siguiente asomando en el margen. Se arrastra con
          el dedo sin tener que explicarlo.
        */}
        <ul
          className="-mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 xl:-mx-10 xl:px-10"
          style={{ scrollbarWidth: "none" }}
        >
          {videos.map((video, i) => (
            <li
              key={video.id}
              className="w-[72%] shrink-0 snap-center sm:w-[46%] lg:w-[31%]"
            >
              <figure className="tarjeta overflow-hidden">
                {/*
                  Vertical, como se filma y como se mira en el celular.

                  El fondo es tinta y no vino suave: encima va la portada,
                  y si algun dia no carga —un reel borrado, Instagram
                  caido— la tarjeta queda oscura y el texto blanco se
                  sigue leyendo. Con el rosa palido de antes, una portada
                  que no llega dejaba letras blancas sobre casi blanco.
                */}
                <div className="relative aspect-9/16 bg-tinta">
                  {abierto !== video.id ? (
                    <button
                      type="button"
                      onClick={() => setAbierto(video.id)}
                      /* El titulo no se ve, asi que el boton se queda sin
                         nombre: para un lector de pantalla serian tres
                         botones identicos que dicen "Ver el reel". */
                      aria-label={`${video.titulo} — ver el video`}
                      className="group absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 text-white"
                    >
                      {/*
                        La portada. Antes esto era un color liso: no se
                        veia nada de lo que hay adentro y no habia ninguna
                        razon para tocarlo.

                        El reel la saca de nuestra propia direccion, que
                        se la pide a Instagram del lado del servidor. El
                        video propio muestra su primer fotograma, que es
                        lo que dibuja el navegador con `preload`.
                      */}
                      {video.clase === "instagram" ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={`/api/reel-portada?codigo=${video.codigo}`}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={video.url}
                          muted
                          playsInline
                          preload="metadata"
                          aria-hidden
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}

                      {/* Velo: sin esto el boton y el numero pelean con lo
                          que haya en la foto, que cambia en cada reel. */}
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-linear-to-t from-tinta/80 via-tinta/25 to-tinta/45 transition-opacity group-hover:opacity-90"
                      />

                      {/* El numero da orden de lectura sin sumar palabras:
                          se ve que son tres y cual va primero. */}
                      <span className="absolute left-5 top-4 text-lg font-semibold tabular-nums text-white/70">
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-vino text-white shadow-boton transition-transform group-hover:scale-105 group-active:scale-95">
                        {/* Corrido a la derecha: centrado a ojo, un
                            triangulo se ve pegado al borde izquierdo. */}
                        <IconoPlay className="ml-1 h-7 w-7" />
                      </span>

                      {/* Cada cosa por su nombre: el archivo propio es un
                          video, `/reel/` es un reel y `/p/` puede ser un
                          carrusel de fotos, que no es ninguna de las dos. */}
                      <span className="relative text-lg font-semibold">
                        {video.clase === "propio"
                          ? "Ver el video"
                          : video.esReel
                            ? "Ver el reel"
                            : "Ver en Instagram"}
                      </span>
                    </button>
                  ) : video.clase === "propio" ? (
                    /* Nuestro archivo: sin marco, sin logo y sin salir de
                       la pagina. `playsInline` es lo que evita que el
                       iPhone lo abra a pantalla completa por su cuenta. */
                    <video
                      src={video.url}
                      title={video.titulo}
                      controls
                      autoPlay
                      playsInline
                      className="h-full w-full bg-tinta object-cover"
                    />
                  ) : (
                    <iframe
                      src={urlEmbebido(video.codigo)}
                      title={video.titulo}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  )}
                </div>
              </figure>
            </li>
          ))}
        </ul>

        {/* Quien quiere ver mas, va a la fuente y de paso la sigue. */}
        <p className="mt-5 text-center">
          <a
            href={consultorio.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 text-lg text-tinta-suave transition-colors hover:text-vino"
          >
            <IconoInstagram className="h-5 w-5 text-vino" />
            Ver más en @{consultorio.instagram}
            <IconoFlecha className="h-4 w-4" />
          </a>
        </p>
      </div>
    </section>
  );
}
