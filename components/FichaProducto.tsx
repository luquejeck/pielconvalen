import { readFileSync } from "node:fs";
import Image from "next/image";
import {
  descuentoDe,
  fotoDe,
  precioDe,
  type Producto,
} from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";
import ControlCarrito from "./ControlCarrito";

/**
 * Una ficha de producto. La usan el carrusel de la portada y el catalogo.
 *
 * LA DISTRIBUCION ES LA DE LA TIENDA QUE PASO LUCAS DE REFERENCIA:
 * todo alineado a la izquierda, marca y nombre juntos en versalitas y en
 * gris, el precio grande abajo con el descuento al lado, y un boton
 * angosto al final.
 *
 * El orden de lectura que arma es mejor que el de antes: con el nombre
 * chico y parejo, lo que salta a la vista es el precio, que es lo que se
 * compara cuando hay trece productos en pantalla. Con el nombre grande y
 * centrado, cada ficha empezaba a leerse por un texto distinto.
 *
 * ES UNA TARJETA, con borde y fondo propio, como las de un marketplace.
 *
 * Estuvo un rato sin contenedor, apoyada sobre el fondo, que es lo que
 * hace la tienda de Apple. Funciona cuando hay cuatro productos y todos
 * fotografiados igual; con trece y con fotos de origenes distintos —unas
 * sobre blanco y otras sobre fondo oscuro— no se veia donde terminaba una
 * y empezaba la otra. El borde las vuelve a separar.
 *
 * LA FICHA YA NO ES UN LINK A WHATSAPP: suma al pedido.
 *
 * Antes cada ficha entera abria un chat con ese producto, asi que
 * llevarse tres cosas eran tres conversaciones sueltas. Ahora el unico
 * elemento que se toca es el control de unidades, y el mensaje se arma
 * una sola vez con todo junto desde el carrito.
 *
 * Eso ademas destraba algo que antes no se podia hacer: con la ficha
 * entera envuelta en un <a>, no se le podia meter adentro un boton de
 * "+" y otro de "−", porque un boton adentro de un link no es HTML
 * valido y los lectores de pantalla lo anuncian dos veces.
 */
/**
 * Que productos tienen la foto sobre fondo claro.
 *
 * Lo escribe `npm run fotos` mirando el original de cada uno: las fotos
 * de catalogo de las marcas vienen recortadas sobre blanco y las que
 * mando Valen por WhatsApp estan sacadas de noche sobre una mesa oscura.
 * La web no puede distinguirlo sola porque solo ve el .webp ya fundido.
 *
 * Esto es lo que deja convivir las dos cosas mientras se consiguen las
 * fotos que faltan: cada ficha pinta su base del color al que fundio su
 * foto, asi que ninguna se ve como un parche. El dia que entre la ultima
 * foto de catalogo, la grilla queda blanca entera sola.
 *
 * Se lee una vez por proceso, no una por ficha. Si el archivo no existe
 * —nadie corrio el comando todavia— quedan todas oscuras, que es como
 * venia funcionando.
 */
const FONDOS: Record<string, string> = (() => {
  try {
    return JSON.parse(
      readFileSync("public/imagenes/productos/fondos.json", "utf8")
    );
  } catch {
    return {};
  }
})();

export default function FichaProducto({ producto: p }: { producto: Producto }) {
  const descuento = descuentoDe(p);
  const claro = FONDOS[p.id] === "claro";
  const subtitulo = [p.medida, ...p.beneficios].filter(Boolean).join(" · ");

  return (
    <li className="group flex flex-col overflow-hidden rounded-chico border border-borde bg-papel">
        <div className={`relative ${claro ? "bg-papel" : "bg-tinta"}`}>
          {/*
            La base se pinta del mismo color al que fundio la foto
            (scripts/preparar-fotos.mjs), asi que no se ve donde termina
            el rectangulo. Claro para las fotos de catalogo, oscuro para
            las que sacamos con el celular.
          */}
          <Image
            src={fotoDe(p)}
            alt={`${p.nombre}, de ${p.marca}`}
            width={640}
            height={640}
            sizes="(min-width: 1024px) 18rem, (min-width: 640px) 30vw, 45vw"
            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Solo cuando hay precio anterior cargado. Hoy no hay ninguno. */}
          {descuento !== null && (
            <span className="absolute top-0 left-0 bg-vino px-2 py-1 font-display text-sm font-semibold text-white tabular-nums">
              −{descuento}%
            </span>
          )}

        </div>

        <div className="flex flex-1 flex-col px-3 pt-3 pb-4">
          {/*
            MARCA Y NOMBRE EN UN SOLO BLOQUE, en versalitas y en gris.

            Es la distribucion de la tienda que paso Lucas de referencia,
            y el orden de lectura que arma es mejor que el anterior: el
            nombre deja de competir con el precio —queda chico, gris y
            parejo— y lo que salta a la vista es el numero, que es lo que
            se compara cuando hay trece productos en pantalla.

            La marca va adentro del mismo bloque pero en negrita: asi se
            reconoce de un vistazo sin gastar un renglon propio, que era
            lo que hacia antes.
          */}
          {/*
            TRES RENGLONES EN CELULAR, DOS DE ANCHO PARA ARRIBA.

            La ficha mide 161 px en un telefono y en dos renglones
            entran unos 34 caracteres contando la marca. Diez de los
            diecisiete productos pasaban de ahi y quedaban cortados
            justo en la parte que los distingue: "Beauty of Joseon
            Revive Eye Ser..." no dice si es el de ojos o el otro.

            Se acortaron los nombres —fuera los nombres de linea y el
            relleno del fabricante— y aun asi los dos Relief Sun llegan
            a 38, porque "Beauty of Joseon" solo ya son 16. El tercer
            renglon cierra el caso: pasa de diez cortados a ninguno, y
            la ficha crece 18 px.

            De 640 para arriba la tarjeta es mas ancha y dos alcanzan.
          */}
          <h3 className="line-clamp-3 text-[0.8125rem] leading-snug tracking-[0.02em] text-tinta-suave uppercase sm:line-clamp-2">
            <span className="font-semibold text-tinta">{p.marca}</span>{" "}
            {p.nombre}
          </h3>

          {/* `mt-auto` empuja el precio al piso: en una fila los nombres
              miden distinto y sin esto los precios quedaban a distinta
              altura en cada columna. */}
          <div className="mt-auto pt-2">
            <p className="flex flex-wrap items-baseline gap-x-2 font-display text-xl font-semibold text-vino tabular-nums">
              {precioDe(p)}
              {descuento !== null && (
                <span className="text-sm font-semibold text-vino">
                  −{descuento}% OFF
                </span>
              )}
            </p>

            {p.precioAnterior && descuento !== null && (
              <p className="mt-0.5 text-sm text-tinta-suave line-through tabular-nums">
                {formatearPrecio(p.precioAnterior)}
              </p>
            )}

            {/*
              DOS RENGLONES Y NO UNO.

              El subtitulo es `medida + beneficios`, y con un solo renglon
              se cortaban 15 de las 16 fichas en celular: entraba "30 ml ·
              Luminosidad · Manch…" y los beneficios —que es lo que la
              clienta lee para elegir— quedaban afuera. Empeoro el
              19-09-2026, cuando se cargaron las nueve medidas que
              faltaban: cada ficha sumo unos siete caracteres adelante.

              Con dos renglones se corta una sola, la mas larga, y la
              ficha pasa de 335 a 353 px de alto en un iPhone: 18 px por
              catorce fichas que recuperan sus beneficios.
            */}
            {subtitulo && (
              <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-snug text-tinta-suave">
                {subtitulo}
              </p>
            )}

            <ControlCarrito id={p.id} nombre={p.nombre} />
          </div>
        </div>
    </li>
  );
}
