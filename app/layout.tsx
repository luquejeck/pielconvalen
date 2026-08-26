import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { SITIO_URL } from "@/lib/config";
import { obtenerConfiguracion } from "@/lib/consultorio";
import "./globals.css";

/**
 * Montserrat es la unica tipografia que se descarga, y se usa: es la de
 * los titulos y la del panel.
 *
 * Antes tambien viajaba Inter. El cuerpo de texto arranca con la
 * tipografia del sistema (`-apple-system`, San Francisco), asi que en
 * iPhone y en Mac —el telefono mas probable de esta clienta— Inter se
 * bajaba, se precargaba, y no dibujaba un solo caracter. En Windows y
 * Android el cuerpo cae ahora en la tipografia del sistema, que es lo
 * que Inter estaba imitando.
 */
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

/* Se genera en cada visita y no se escribe fijo: el titulo, la
   descripcion y las palabras clave salen de la configuracion que Valen
   edita en el panel. */
export async function generateMetadata(): Promise<Metadata> {
  const CONSULTORIO = await obtenerConfiguracion();

  return {
  /* Sin esto, la imagen de la vista previa se pide con una ruta
     relativa y ningun cliente de mensajeria la resuelve. */
    metadataBase: new URL(SITIO_URL),
    title: `${CONSULTORIO.nombre} | ${CONSULTORIO.profesional} · ${CONSULTORIO.titulo}`,
    description: `${CONSULTORIO.queSeHace} en ${CONSULTORIO.direccion}. Con ${CONSULTORIO.profesional}, ${CONSULTORIO.titulo}. Reservá tu turno por WhatsApp.`,
    keywords: [
      `${CONSULTORIO.profesion} ${CONSULTORIO.direccion.split(",")[1]?.trim() ?? ""}`,
      CONSULTORIO.queSeHace,
      "higiene facial profunda",
      "dermaplaning",
      "microneedling",
    ],
    openGraph: {
      title: `${CONSULTORIO.nombre} | ${CONSULTORIO.eslogan}`,
      description: `${CONSULTORIO.queSeHace} en ${CONSULTORIO.direccion}. Reservá tu turno online.`,
      locale: "es_AR",
      type: "website",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#faf6f2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
