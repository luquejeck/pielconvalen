import Beneficios from "@/components/Beneficios";
import BotonWhatsApp from "@/components/BotonWhatsApp";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { ReservaProvider } from "@/components/ReservaContext";
import Reservas from "@/components/Reservas";
import Tratamientos from "@/components/Tratamientos";
import { AGENDA, CONSULTORIO } from "@/lib/config";
import { TRATAMIENTOS } from "@/lib/tratamientos";

/**
 * Datos estructurados para Google (ficha de negocio local).
 * Ayuda a aparecer en "cosmetologa Caballito" y en Google Maps.
 */
const DIAS_SCHEMA = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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
  openingHoursSpecification: AGENDA.diasHabiles.map((dia) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: DIAS_SCHEMA[dia],
    opens: AGENDA.horarios[0],
    closes: "19:00",
  })),
  makesOffer: TRATAMIENTOS.map((t) => ({
    "@type": "Offer",
    name: t.nombre,
    price: t.precio,
    priceCurrency: "ARS",
  })),
};

export default function Home() {
  return (
    <ReservaProvider>
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
