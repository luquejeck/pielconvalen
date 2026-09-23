"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconoFlecha } from "./iconos";

/**
 * Una fila que se desliza al costado: la de productos de la portada y la
 * de combos.
 *
 * EL DESPLAZAMIENTO NO NECESITA JAVASCRIPT: es `overflow-x-auto` con
 * `scroll-snap`, asi que el dedo en el celular y la rueda en el
 * escritorio funcionan aunque el script no llegue a cargar. Lo unico que
 * agrega este componente son los botones y el "1 de 4", que son ayudas:
 * si no aparecen, la fila igual se recorre.
 *
 * POR QUE CARRUSEL EN LA PORTADA Y GRILLA EN EL CATALOGO
 * Son dos preguntas distintas. En la portada la pregunta es "¿esta
 * vende productos?", y una fila con "1 de 4" debajo la contesta mejor
 * que una grilla: se ve que hay mas. En /productos la pregunta es
 * "¿cual me llevo?", y ahi esconder la mitad del catalogo detras de un
 * gesto juega en contra, asi que va grilla. Los combos son la excepcion:
 * son pocos, cada uno es grande, y uno debajo del otro se comian cuatro
 * pantallas de celular antes del primer producto.
 *
 * LOS CONTROLES VAN DEBAJO, A LA VISTA, EN TODOS LOS TAMAÑOS.
 * Antes el celular tenia solo puntitos de 8 px y el escritorio flechas
 * encima de las fotos. Deslizar al costado es un gesto que mucha gente
 * de sesenta no descubre sola: si no ve un boton, no sabe que hay mas.
 * Ahora son dos botones de 48 px —se tocan sin apuntar— y en el medio
 * dice en palabras donde esta: "1 de 4". Los puntos obligaban a contar.
 *
 * El numero cuenta PANTALLAS, no tarjetas: con ocho productos de a dos,
 * "1 de 8" avanzaria de a dos por toque. Con los combos en el telefono
 * entra uno por pantalla, asi que ahi pantalla y combo son lo mismo.
 */

/*
  CUANTO MIDE CADA TARJETA, segun lo que lleva la fila.

  EN REPOSO, SIMETRICO. Las tarjetas que se ven quedan con el mismo
  margen a los dos lados —los 20 px de toda la pagina— y entran justas:
  dos productos o un combo en el telefono, tres o dos en tableta, cuatro
  o tres en pantalla grande.

  Por eso el hueco entre tarjetas mide lo mismo que el margen (20 px)
  debajo de 1024: si fuera menor, asomaria una tira de la tarjeta
  siguiente de un solo lado. Antes pasaba a proposito —el combo medía
  86% para que se viera el siguiente— y Lucas prefirio la simetria. Que
  hay mas lo dicen los botones y el "1 de 4" de abajo.

  Van escritas enteras y no armadas con variables porque Tailwind las
  encuentra leyendo el archivo: una clase partida en pedazos no existe.
*/
const ANCHOS = {
  productos:
    "gap-5 lg:gap-4 [&>li]:w-[calc(50%-0.625rem)] sm:[&>li]:w-[calc(33.333%-0.834rem)] lg:[&>li]:w-[calc(25%-0.75rem)]",
  combos:
    "gap-5 lg:gap-4 [&>li]:w-full sm:[&>li]:w-[calc(50%-0.625rem)] lg:[&>li]:w-[calc(33.333%-0.667rem)]",
} as const;

export default function Carrusel({
  children,
  etiqueta,
  tipo = "productos",
}: {
  children: React.ReactNode;
  /** Para el lector de pantalla y los botones: "Productos destacados". */
  etiqueta: string;
  tipo?: keyof typeof ANCHOS;
}) {
  const pista = useRef<HTMLUListElement>(null);
  const [pagina, setPagina] = useState(0);
  const [paginas, setPaginas] = useState(1);

  /** Cuanto avanza una pantalla, y cuantas tarjetas entran en ella. */
  const medidas = useCallback(() => {
    const el = pista.current;
    if (!el || el.children.length === 0) return null;
    const primera = el.children[0] as HTMLElement;
    const segunda = el.children[1] as HTMLElement | undefined;
    /* De una tarjeta a la siguiente: el ancho mas el hueco. */
    const paso = segunda ? segunda.offsetLeft - primera.offsetLeft : primera.offsetWidth;
    const hueco = paso - primera.offsetWidth;
    /* El ancho util es el de adentro del relleno: la fila llega al borde
       de la pantalla, pero las tarjetas se acomodan entre los margenes. */
    const estilo = getComputedStyle(el);
    const util = el.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
    /* El +1 absorbe el redondeo a subpixeles: dos tarjetas que entran
       justas daban 1,999 y contaban como una. */
    const porPantalla = Math.max(1, Math.floor((util + hueco + 1) / paso));
    return { el, paso, porPantalla, sobra: el.scrollWidth - el.clientWidth };
  }, []);

  const medir = useCallback(() => {
    const m = medidas();
    /*
      Si todavia no tiene ancho, no se calcula nada.

      `clientWidth` da 0 mientras el elemento no esta maquetado. Pasa de
      verdad —el ResizeObserver dispara una primera vez antes del
      layout— y la version anterior dividia por cero y se llevo puesta
      la portada entera.
    */
    if (!m || m.el.clientWidth <= 0 || m.paso <= 0) return;

    /* Se compara contra 4 px y no contra 0: los navegadores redondean a
       subpixeles y una fila que entra justa daba medio pixel de sobra. */
    if (m.sobra <= 4) {
      setPaginas(1);
      setPagina(0);
      return;
    }

    const total = Math.min(20, Math.ceil(m.el.children.length / m.porPantalla));
    setPaginas(total);
    /* La ultima pantalla casi nunca empieza en una tarjeta justa —queda
       lo que sobra—, asi que "estar al final" se mira aparte. */
    setPagina(
      m.el.scrollLeft >= m.sobra - 4
        ? total - 1
        : Math.min(total - 1, Math.round(m.el.scrollLeft / (m.paso * m.porPantalla)))
    );
  }, [medidas]);

  useEffect(() => {
    medir();
    const el = pista.current;
    if (!el) return;
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [medir]);

  const ir = (destino: number) => {
    const m = medidas();
    if (!m) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    m.el.scrollTo({
      left: Math.max(0, Math.min(m.sobra, destino * m.porPantalla * m.paso)),
      behavior: quieto ? "auto" : "smooth",
    });
  };

  const hayCarrusel = paginas > 1;

  return (
    /*
      `overflow-x: clip` NO es decoracion: sin esto la pagina entera se
      mueve para los costados en el celular.

      La fila de adentro tiene `overflow-x-auto` y se recorta sola, pero
      el envoltorio igual reportaba 550px de ancho de contenido dentro de
      un hueco de 335, y eso se propagaba hasta el documento. Va `clip` y
      no `hidden` a proposito: `hidden` crea un contenedor de scroll y
      eso rompe el `position: sticky` del encabezado.

      LA FILA LLEGA HASTA EL BORDE DE LA PANTALLA debajo de 1024. Antes
      terminaba en el margen de la pagina, y al deslizar las tarjetas se
      cortaban a 20 px del borde, con una franja de fondo vacia al lado:
      parecia un error de armado. Ahora el envoltorio se estira sobre el
      margen (`-mx-5`) y la fila lo devuelve como relleno (`px-5`), asi
      que en reposo las tarjetas quedan alineadas con el resto de la
      pagina y al moverse pasan por debajo del borde. `scroll-px-5` hace
      que el iman las deje en el margen y no pegadas al borde.

      En pantalla grande no: ahi la pagina es una columna al medio con
      margenes anchos, y estirarse hasta el borde de la ventana seria
      salirse del diseño.
    */
    <div className="relative -mx-5 overflow-x-clip lg:mx-0">
      <ul
        ref={pista}
        onScroll={medir}
        tabIndex={0}
        role="region"
        aria-label={etiqueta}
        className={`sin-barra flex snap-x snap-mandatory scroll-px-5 overflow-x-auto scroll-smooth px-5 motion-reduce:scroll-auto lg:scroll-px-0 lg:px-0 [&>li]:shrink-0 [&>li]:snap-start ${ANCHOS[tipo]}`}
      >
        {children}
      </ul>

      {hayCarrusel && (
        <div className="mt-5 flex items-center justify-center gap-4">
          <BotonCarrusel
            nombre={`Anterior: ${etiqueta}`}
            onClick={() => ir(pagina - 1)}
            apagado={pagina === 0}
            giro="rotate-180"
          />

          {/* Dice donde esta con palabras. `aria-live` para que quien usa
              lector de pantalla oiga a donde lo llevo el boton. */}
          <p
            aria-live="polite"
            className="min-w-18 text-center text-base text-tinta-suave tabular-nums"
          >
            <span className="font-semibold text-tinta">{pagina + 1}</span> de {paginas}
          </p>

          <BotonCarrusel
            nombre={`Siguiente: ${etiqueta}`}
            onClick={() => ir(pagina + 1)}
            apagado={pagina >= paginas - 1}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Un boton de la fila. Apagado se ve pero no se toca: si desapareciera,
 * el "1 de 4" saltaria de lugar al llegar a una punta.
 */
function BotonCarrusel({
  nombre,
  onClick,
  apagado,
  giro = "",
}: {
  nombre: string;
  onClick: () => void;
  apagado: boolean;
  giro?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={apagado}
      aria-label={nombre}
      className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-borde bg-papel text-tinta shadow-suave transition-colors hover:border-vino hover:text-vino active:scale-95 disabled:cursor-default disabled:opacity-35 disabled:shadow-none disabled:hover:border-borde disabled:hover:text-tinta"
    >
      <IconoFlecha className={`h-5 w-5 ${giro}`} />
    </button>
  );
}
