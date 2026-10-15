import Image from "next/image";
import { fotoDe, hayStock, type Producto } from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";
import BotonRegalar from "./BotonRegalar";

/**
 * El regalo del Dia de la Madre, en la portada: el kit de viaje
 * Madagascar Centella de SKIN1004.
 *
 * COMO UNA PAGINA DE REVISTA (15-10-2026). Lucas vio dos rondas de
 * opciones y eligio la mas sobria: la foto grande sobre un rosado muy
 * suave, una frase fina —"Un rato para ella"— y un solo boton. La
 * primera version llevaba sello con el 18, cuenta regresiva, los cinco
 * pasos y el link a giftcards; era mucho para una banda de paso.
 *
 * VA APENAS DEBAJO DE LA PORTADA, ARRIBA DE TODO. El orden de la pagina
 * pone primero el turno (ver app/page.tsx), pero esta semana la pregunta
 * de mucha gente que entra es "¿que le regalo a mamá?", y la respuesta
 * tiene fecha. Es una banda de temporada y se va sola.
 *
 * SE VA SOLA EL LUNES 19. La fecha se mira en hora de Buenos Aires en
 * cada visita (la portada se arma por pedido, por las cookies de
 * Supabase), asi que no hay que acordarse de sacarla. Tampoco aparece si
 * el kit se despublica o se queda sin stock: no se promociona algo que
 * no se puede pedir.
 */

const CODIGO_KIT = "SKI-MADA-KIT";

/** El Dia de la Madre de 2026 en Argentina: tercer domingo de octubre. */
const DIA = { anio: 2026, mes: 10, dia: 18 };

/** Si todavia no paso el domingo, contado en Buenos Aires. */
function esTemporada(ahora = new Date()): boolean {
  const hoy = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora); // "2026-10-15"
  const fin = `${DIA.anio}-${String(DIA.mes).padStart(2, "0")}-${String(DIA.dia).padStart(2, "0")}`;
  return hoy <= fin;
}

export default function DiaDeLaMadre({ productos }: { productos: Producto[] }) {
  const kit = productos.find((p) => p.codigo === CODIGO_KIT);
  if (!kit || !hayStock(kit) || !esTemporada()) return null;

  return (
    <section
      id="dia-de-la-madre"
      aria-labelledby="dia-de-la-madre-titulo"
      className="border-t border-borde bg-papel"
    >
      <div className="mx-auto grid max-w-6xl items-center md:grid-cols-2 md:gap-4 md:px-8 md:py-14">
        {/* La foto a sangre, sobre un rosado que apenas se nota: el
            blanco de la foto de catalogo se funde con el fondo. */}
        <div className="bg-[linear-gradient(180deg,#fbf3f6,#f3e2e9)] px-3 pt-6 md:rounded-suave md:px-10 md:py-10">
          <Image
            src={fotoDe(kit)}
            alt={`${kit.marca} ${kit.nombre}: la caja y los cinco productos de la rutina`}
            width={640}
            height={640}
            sizes="(min-width: 768px) 36rem, 100vw"
            className="mx-auto w-full max-w-xl mix-blend-multiply"
          />
        </div>

        <div className="px-6 pt-6 pb-10 sm:px-10 md:py-0 lg:px-14">
          <p className="font-display text-xs font-semibold tracking-[0.24em] text-vino uppercase">
            Día de la Madre · 18 de octubre
          </p>
          <h2
            id="dia-de-la-madre-titulo"
            className="mt-3 font-display text-4xl leading-[1.02] font-light tracking-tight text-tinta sm:text-5xl"
          >
            Un rato <span className="font-semibold">para ella</span>
          </h2>
          <p className="mt-4 max-w-md text-lg leading-snug text-tinta-suave">
            El kit de {kit.marca} trae su rutina coreana completa, en tamaño de viaje.
            {kit.precio > 0 && (
              <span className="text-tinta tabular-nums"> {formatearPrecio(kit.precio)}.</span>
            )}
          </p>

          <div className="mt-6">
            <BotonRegalar id={kit.id} nombre={`${kit.marca} ${kit.nombre}`} />
          </div>
        </div>
      </div>
    </section>
  );
}
