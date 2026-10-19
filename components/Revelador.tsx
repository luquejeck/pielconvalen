"use client";

import { useEffect } from "react";

/**
 * Hace aparecer los bloques de la portada a medida que se baja.
 *
 * Es UN componente para toda la pagina y no un envoltorio por seccion:
 * marca solo lo que corresponde (los hijos directos del contenedor de
 * cada seccion, y las tarjetas de las listas, escalonadas) y lo hace
 * subir con un fundido cuando entra en pantalla. El movimiento esta en
 * globals.css (`[data-revelar]`).
 *
 * SIN JAVASCRIPT, O CON "REDUCIR MOVIMIENTO", NO PASA NADA: todo se ve
 * desde el principio. El estado escondido solo existe cuando este
 * componente ya marco `html[data-revelando]`, y lo que ya estaba en
 * pantalla al cargar queda visible sin animar, asi no parpadea.
 */

/** Los bloques de cada seccion, fuera de la primera pantalla. */
const BLOQUES = "main > section:not(#inicio) > .contenedor > *";

/**
 * Las tarjetas que entran una detras de la otra.
 *
 * NINGUNA DE UN CARRUSEL (Tratamientos, Productos, Videos). Ahi cada
 * tarjeta nueva entra a la pantalla por el costado al deslizar, y si se
 * animaba subia desde abajo mientras la clienta la arrastraba: el gesto
 * es de lado y la tarjeta tiene que moverse solo de lado. El carrusel
 * entero sigue apareciendo al bajar, como un bloque mas.
 */
const ESCALONADOS = [
  "#consultorio ul > li",
  "#como-trabajo ol > li",
  "#beneficios .tarjeta > *",
  "#preguntas ul > li",
].join(", ");

export default function Revelador() {
  useEffect(() => {
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const alto = window.innerHeight;
    const elementos: HTMLElement[] = [];

    const marcar = (el: HTMLElement, retraso = 0) => {
      if (el.hasAttribute("data-revelar")) return;
      el.setAttribute("data-revelar", "");
      if (retraso) el.style.setProperty("--retraso", `${retraso}s`);
      // Lo que ya se ve al cargar no se esconde: aparecer y desaparecer es peor que nada.
      const caja = el.getBoundingClientRect();
      if (caja.top < alto && caja.bottom > 0) el.setAttribute("data-visible", "");
      else elementos.push(el);
    };

    document.querySelectorAll<HTMLElement>(ESCALONADOS).forEach((el) => {
      const indice = Array.prototype.indexOf.call(el.parentElement?.children ?? [], el);
      // Tope de 0,4 s: en una lista larga la ultima no puede llegar tarde.
      marcar(el, Math.min(indice, 5) * 0.08);
    });
    document.querySelectorAll<HTMLElement>(BLOQUES).forEach((el) => marcar(el));

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-visible", "");
          observador.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    elementos.forEach((el) => observador.observe(el));
    document.documentElement.setAttribute("data-revelando", "");

    return () => {
      observador.disconnect();
      document.documentElement.removeAttribute("data-revelando");
    };
  }, []);

  return null;
}
