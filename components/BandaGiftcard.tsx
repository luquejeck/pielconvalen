import Link from "next/link";
import TarjetaGiftcard from "./TarjetaGiftcard";

/**
 * Las giftcards en la portada: una tarjeta blanca con la giftcard
 * dibujada al lado, y el boton que lleva a armarla.
 *
 * VA DESPUES DEL TURNO Y ANTES DE LOS PRODUCTOS. Quien baja leyendo ya
 * vio los tratamientos con su precio, que es justo lo que se regala; y
 * no le quita lugar al turno, que sigue siendo el negocio.
 *
 * CHICA A PROPOSITO. No es una seccion con titulo grande: es un aviso,
 * como el de un producto destacado. La giftcard vino es el unico color
 * fuerte, del tamaño de una foto de producto, y el boton va en hueco
 * para no competir con "Reservar turno".
 */
export default function BandaGiftcard({ ejemplo }: { ejemplo: string }) {
  return (
    <section id="giftcards" className="border-t border-borde bg-crema seccion">
      <div className="contenedor">
        <div className="tarjeta mx-auto grid max-w-4xl items-center gap-6 overflow-hidden px-6 py-7 sm:px-8 md:grid-cols-[1fr_0.85fr] md:gap-10 md:py-9">
          <div className="mx-auto w-full max-w-[17rem] px-2 pt-1 md:order-2 md:max-w-none md:px-0">
            <TarjetaGiftcard
              para="alguien especial"
              de="vos"
              regalo={ejemplo}
              className="-rotate-3"
            />
          </div>

          <div className="text-center md:order-1 md:text-left">
            <p className="font-display text-sm font-semibold tracking-[0.12em] text-vino uppercase">
              Giftcards
            </p>
            <h2 className="mt-2 text-3xl leading-tight text-tinta sm:text-4xl">
              Regalá una sesión
            </h2>
            <p className="mt-3 text-lg leading-snug text-tinta-suave">
              Un tratamiento o un monto, con tu mensaje. La armás en un minuto y Valen te la
              manda lista para regalar.
            </p>
            <Link href="/giftcard" className="boton-secundario mt-5 w-full sm:w-auto">
              Armar una giftcard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
