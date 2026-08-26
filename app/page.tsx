import Beneficios from "@/components/Beneficios";
import Casos from "@/components/Casos";
import BotonWhatsApp from "@/components/BotonWhatsApp";
import Consultorio from "@/components/Consultorio";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Preguntas from "@/components/Preguntas";
import { ReservaProvider } from "@/components/ReservaContext";
import Reservas from "@/components/Reservas";
import Tratamientos from "@/components/Tratamientos";
import { obtenerAgenda, obtenerTratamientosPublicos } from "@/lib/catalogo";
import { obtenerCasos } from "@/lib/casos";
import { obtenerConfiguracion } from "@/lib/consultorio";

const DIAS_SCHEMA = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function Home() {
  // Precios, tratamientos y horarios salen de la base: lo que Valen
  // edita en el panel se ve en la web sin tocar el codigo.
  const [tratamientos, agenda, CONSULTORIO, casos] = await Promise.all([
    obtenerTratamientosPublicos(),
    obtenerAgenda(),
    obtenerConfiguracion(),
    obtenerCasos(),
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
    openingHoursSpecification: agenda.diasHabiles.map((dia) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DIAS_SCHEMA[dia],
      opens: agenda.horarios[0],
      closes: "20:00",
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
        <Beneficios consultorio={CONSULTORIO} />
        <Consultorio consultorio={CONSULTORIO} />
        {/* Despues de "Que vas a notar", que lo dice con palabras, y
            antes de los precios: que sepa que compra antes del numero. */}
        <Casos casos={casos} />
        <Tratamientos />
        {/* Las dudas van entre ver los precios y reservar: es el momento
            exacto en que aparecen. */}
        <Preguntas consultorio={CONSULTORIO} />
        <Reservas />
      </main>
      <Footer consultorio={CONSULTORIO} />
      <BotonWhatsApp />
    </ReservaProvider>
  );
}
