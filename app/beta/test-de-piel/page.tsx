import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import TestDePiel from "@/components/TestDePiel";
import { obtenerTratamientosPublicos } from "@/lib/catalogo";

/**
 * BETA. Pagina suelta, sin enlaces desde la web publica y con noindex:
 * se prueba pasandole el link a alguien, no aparece en Google ni en el menu.
 */
export const metadata: Metadata = {
  title: "Test de piel (beta) | Piel con Valen",
  robots: { index: false, follow: false },
};

export default async function TestDePielPage() {
  const tratamientos = await obtenerTratamientosPublicos();

  return (
    <>
      <Header />
      <main>
        <TestDePiel tratamientos={tratamientos} />
      </main>
      <Footer />
    </>
  );
}
