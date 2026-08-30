"use client";

import { useEffect, useState } from "react";
import { linkWhatsAppSimple } from "@/lib/whatsapp";
import { useReserva } from "./ReservaContext";
import { IconoWhatsApp } from "./iconos";

/**
 * Boton flotante de consulta rapida.
 * No reemplaza al modulo de reservas: es para dudas previas
 * ("¿cual me conviene?", "¿tenes algo antes del viernes?").
 *
 * El aro blanco no es decoracion: el boton flota sobre el crema de la
 * pagina, que es clarito, y lo despega del fondo para que se encuentre
 * rapido sin tener que buscarlo.
 *
 * ----------------------------------------------------------------------
 * POR QUE CAMBIA DE TAMAÑO Y POR QUE A VECES NO ESTA
 *
 * Con el texto siempre visible, en celular medía 213px sobre una
 * pantalla de 375: el 57% del ancho, fijo, encima de todo y sin forma de
 * cerrarlo. Tapaba contenido todo el tiempo, y adentro del modulo de
 * reservas se le montaba encima a los botones que sí llevan a reservar:
 * la clienta tocaba lo que queria elegir y lo que se le abria era
 * WhatsApp.
 *
 * La solucion conserva las dos cosas que importaban:
 *
 *   1. Arriba de todo se ve entero, con el texto. Quien se marea con los
 *      pasos tiene que ver la salida, no adivinar que hace un circulito.
 *   2. Apenas empieza a leer, se achica al icono solo: sigue a mano y
 *      deja de taparle los renglones.
 *   3. Dentro del modulo de reservas desaparece. Ahi ya hay tres botones
 *      de WhatsApp propios y mejor explicados; un cuarto flotando encima
 *      solo puede hacer daño.
 * ---------------------------------------------------------------------- */
export default function BotonWhatsApp() {
  const { consultorio } = useReserva();

  /* Arranca expandido y visible para que el HTML del servidor y el del
     navegador coincidan. Los efectos lo ajustan despues. */
  const [compacto, setCompacto] = useState(false);
  const [oculto, setOculto] = useState(false);

  // Se achica apenas la clienta empieza a bajar.
  useEffect(() => {
    const alScrollear = () => setCompacto(window.scrollY > 320);
    alScrollear();
    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => window.removeEventListener("scroll", alScrollear);
  }, []);

  // Se esconde mientras el modulo de reservas esta en pantalla.
  useEffect(() => {
    const reservar = document.getElementById("reservar");
    if (!reservar) return;

    const observador = new IntersectionObserver(
      ([entrada]) => setOculto(entrada.isIntersecting),
      { threshold: 0 }
    );
    observador.observe(reservar);
    return () => observador.disconnect();
  }, []);

  return (
    <a
      href={linkWhatsAppSimple(undefined, consultorio.whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      aria-hidden={oculto}
      tabIndex={oculto ? -1 : undefined}
      /*
        El `gap` se apaga al achicarse. La etiqueta se colapsa a ancho
        cero pero sigue estando, y el hueco entre ella y el icono no:
        flex lo cuenta igual al centrar, asi que el icono quedaba medio
        gap corrido a la izquierda dentro del circulo.
      */
      className={`fixed bottom-5 right-5 z-50 flex min-h-14 items-center justify-center rounded-full bg-vino text-white ring-3 ring-white/85 shadow-xl shadow-tinta/25 transition-all duration-300 hover:bg-vino-oscuro active:scale-95 ${
        compacto ? "gap-0" : "gap-2.5"
      } ${
        oculto
          ? "pointer-events-none translate-y-24 opacity-0"
          : "translate-y-0 opacity-100 hover:scale-105"
      } ${compacto ? "w-14 px-0" : "px-5 py-3.5 md:px-6 md:py-4"}`}
    >
      <IconoWhatsApp className="h-6 w-6 shrink-0" />
      {/*
        El texto no se saca del DOM: se colapsa. Asi la transicion es
        suave y el lector de pantalla siempre encuentra la etiqueta,
        que ademas esta en el aria-label.
      */}
      <span
        className={`overflow-hidden whitespace-nowrap text-lg font-semibold transition-all duration-300 ${
          compacto ? "max-w-0 opacity-0" : "max-w-52 opacity-100"
        }`}
      >
        Escribile a Valen
      </span>
    </a>
  );
}
