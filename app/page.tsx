import Beneficios from "@/components/Beneficios";
import BotonWhatsApp from "@/components/BotonWhatsApp";
import ComoTrabajo from "@/components/ComoTrabajo";
import Consultorio from "@/components/Consultorio";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Preguntas from "@/components/Preguntas";
import Marcas from "@/components/Marcas";
import Productos from "@/components/Productos";
import { ReservaProvider } from "@/components/ReservaContext";
import Reservas from "@/components/Reservas";
import Tratamientos from "@/components/Tratamientos";
import Videos from "@/components/Videos";
import { obtenerAgenda, obtenerTratamientosPublicos } from "@/lib/catalogo";
import { horariosDelDia } from "@/lib/config";
import { obtenerConfiguracion } from "@/lib/consultorio";
import { obtenerVideos } from "@/lib/galeria";

const DIAS_SCHEMA = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * A que hora cierra: el ultimo turno del dia mas las dos horas que dura
 * la sesion mas larga. Antes decia "20:00" para todos los dias, escrito
 * a mano, y dejaba de ser cierto apenas Valen cambiaba un horario.
 */
function horaDeCierre(ultimoTurno: string): string {
  const [h, m] = ultimoTurno.split(":").map(Number);
  if (h + 2 >= 24) return "23:59";
  return `${String(h + 2).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default async function Home() {
  // Precios, tratamientos y horarios salen de la base: lo que Valen
  // edita en el panel se ve en la web sin tocar el codigo.
  const [tratamientos, agenda, CONSULTORIO, videos] = await Promise.all([
    obtenerTratamientosPublicos(),
    obtenerAgenda(),
    obtenerConfiguracion(),
    obtenerVideos(),
  ]);

  /** Ficha de negocio local para Google. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: CONSULTORIO.nombre,
    description: `${CONSULTORIO.queSeHace} por ${CONSULTORIO.profesional}, ${CONSULTORIO.profesion}, ${CONSULTORIO.titulo}. ${CONSULTORIO.eslogan}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: CONSULTORIO.direccion.split(",")[0].trim(),
      addressLocality: CONSULTORIO.direccion.split(",")[1]?.trim() ?? "Caballito",
      addressRegion: "Ciudad Autónoma de Buenos Aires",
      addressCountry: "AR",
    },
    telephone: `+${CONSULTORIO.whatsapp}`,
    sameAs: [CONSULTORIO.instagramUrl],
    priceRange: "$$",
    /* Un renglon por dia, con la franja de ESE dia: ahora cada uno tiene
       la suya y antes Google leia la misma para toda la semana. */
    openingHoursSpecification: agenda.diasHabiles
      .map((dia) => ({ dia, horas: horariosDelDia(agenda, dia) }))
      .filter(({ horas }) => horas.length > 0)
      .map(({ dia, horas }) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DIAS_SCHEMA[dia],
        opens: horas[0],
        closes: horaDeCierre(horas[horas.length - 1]),
      })),
    // La consulta de evaluacion no lleva precio: no va como oferta.
    makesOffer: tratamientos
      .filter((t) => t.precio > 0)
      .map((t) => ({
        "@type": "Offer",
        name: t.nombre,
        price: t.precio,
        priceCurrency: "ARS",
      })),
  };

  return (
    <ReservaProvider
      tratamientos={tratamientos}
      agenda={agenda}
      consultorio={CONSULTORIO}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header consultorio={CONSULTORIO} />
      <main>
        <Hero consultorio={CONSULTORIO} />

        {/*
          EL ORDEN SIGUE EL RECORRIDO DE UNA DECISION, no el del folleto.

          1. Quien te atiende  — la cara y la credencial: sin eso, nada de
             lo que sigue importa.
          2. Que cuesta        — los precios ANTES del calendario. Antes el
             modulo de reserva venia tercero y le pedia a la clienta que
             eligiera un horario sin haber visto un solo numero; quien
             queria saber cuanto salia tenia que pasarlo de largo, bajar
             cinco secciones y despues volver.
          3. Como se trabaja   — metodo, lo que va a notar, y el lugar.
          4. El turno          — recien aca, con todo resuelto.
          5. Los productos     — lo que se lleva a casa despues.

          Quien entra decidido no tiene que recorrer nada: el boton del
          encabezado lo lleva al turno desde cualquier punto, y esta
          siempre a la vista porque el encabezado es sticky.
        */}
        <Consultorio consultorio={CONSULTORIO} />
        <Tratamientos />
        <ComoTrabajo agenda={agenda} />
        <Beneficios consultorio={CONSULTORIO} />
        <Videos subidos={videos} />
        <Reservas />
        <Productos consultorio={CONSULTORIO} />
        <Marcas />

        {/* Al final de todo: es una seccion de consulta, no parte del
            recorrido. Quien la necesita la busca. */}
        <Preguntas consultorio={CONSULTORIO} />
      </main>
      <Footer consultorio={CONSULTORIO} />
      <BotonWhatsApp />
    </ReservaProvider>
  );
}
