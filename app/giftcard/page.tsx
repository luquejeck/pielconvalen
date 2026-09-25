import type { Metadata } from "next";
import ArmarGiftcard from "@/components/ArmarGiftcard";
import BotonVolver from "@/components/BotonVolver";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { obtenerTratamientos } from "@/lib/catalogo";
import { SITIO_URL } from "@/lib/config";
import { obtenerConfiguracion } from "@/lib/consultorio";

export async function generateMetadata(): Promise<Metadata> {
  const CONSULTORIO = await obtenerConfiguracion();
  return {
    title: `Giftcards | ${CONSULTORIO.nombre}`,
    description: `Regalá un tratamiento facial con ${CONSULTORIO.profesional}: elegís el tratamiento o un monto, escribís un mensaje y la pagás por WhatsApp.`,
    alternates: { canonical: `${SITIO_URL}/giftcard` },
  };
}

/**
 * Donde se arma una giftcard. Una pagina y no una ventana sobre la
 * portada, por lo mismo que los tratamientos: tiene direccion propia,
 * que se puede pasar por WhatsApp ("mirá, regalan esto"), y el boton de
 * atras hace lo que se espera.
 *
 * `?regalo=full-glow` la abre con ese tratamiento ya elegido: es el link
 * de "Regalar este tratamiento" en la pagina de cada uno.
 */
export default async function PaginaGiftcard({
  searchParams,
}: {
  searchParams: Promise<{ regalo?: string }>;
}) {
  const [{ regalo }, tratamientos, CONSULTORIO] = await Promise.all([
    searchParams,
    obtenerTratamientos(),
    obtenerConfiguracion(),
  ]);

  /* La consulta no tiene precio: no se puede regalar un numero que no
     existe. De menor a mayor, como en la portada. */
  const conPrecio = tratamientos
    .filter((t) => t.precio > 0)
    .sort((a, b) => a.precio - b.precio);

  return (
    <>
      <Header consultorio={CONSULTORIO} enPortada={false} />

      <main className="bg-crema">
        <div className="contenedor py-6 md:py-12">
          <div className="mx-auto max-w-xl">
            <BotonVolver href="/" />

            <header className="mt-3 mb-6">
              <p className="font-display text-sm font-semibold tracking-[0.12em] text-vino uppercase">
                Giftcards
              </p>
              <h1 className="mt-2 text-4xl leading-tight text-tinta">Regalá una sesión</h1>
              <p className="mt-3 text-xl leading-snug text-tinta-suave">
                Un tratamiento o un monto, para alguien que querés. La armás acá y la pagás por
                WhatsApp.
              </p>
            </header>

            <ArmarGiftcard
              tratamientos={conPrecio}
              whatsapp={CONSULTORIO.whatsapp}
              mediosDePago={CONSULTORIO.mediosDePago}
              inicial={regalo}
            />
          </div>
        </div>
      </main>

      <Footer consultorio={CONSULTORIO} />
    </>
  );
}
