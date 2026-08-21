import Beneficios from "@/components/Beneficios";
import BotonWhatsApp from "@/components/BotonWhatsApp";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { ReservaProvider } from "@/components/ReservaContext";
import Reservas from "@/components/Reservas";
import Tratamientos from "@/components/Tratamientos";
import { obtenerAgenda, obtenerTratamientosPublicos } from "@/lib/catalogo";
import { CONSULTORIO } from "@/lib/config";

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
  const [tratamientos, agenda] = await Promise.all([
    obtenerTratamientosPublicos(),
    obtenerAgenda(),
  ]);

  /** Ficha de negocio local para Google. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: CONSULTORIO.nombre,
    description: `Cosmetología por ${CONSULTORIO.profesional}, ${CONSULTORIO.titulo}. ${CONSULTORIO.eslogan}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Riglos 531",
      addressLocality: "Caballito",
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
    <ReservaProvider tratamientos={tratamientos} agenda={agenda}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        <Hero />
        <Beneficios />
        <Tratamientos />
        <Reservas />
      </main>
      <Footer />
      <BotonWhatsApp />
    </ReservaProvider>
  );
}
