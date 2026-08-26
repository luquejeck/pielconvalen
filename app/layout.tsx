import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { CONSULTORIO, SITIO_URL } from "@/lib/config";
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

export const metadata: Metadata = {
  /* Sin esto, la imagen de la vista previa se pide con una ruta
     relativa y ningun cliente de mensajeria la resuelve. */
  metadataBase: new URL(SITIO_URL),
  title: `${CONSULTORIO.nombre} | ${CONSULTORIO.profesional} · ${CONSULTORIO.titulo}`,
  description:
    "Higiene facial profunda, dermaplaning y microneedling en Caballito, CABA. Tratamientos personalizados con Valentina Gallo, Técnica UBA. Reservá tu turno por WhatsApp.",
  keywords: [
    "cosmetología Caballito",
    "higiene facial profunda",
    "dermaplaning",
    "microneedling",
    "limpieza de cutis CABA",
  ],
  openGraph: {
    title: `${CONSULTORIO.nombre} | ${CONSULTORIO.eslogan}`,
    description:
      "Tratamientos faciales personalizados en Caballito, CABA. Reservá tu turno online.",
    locale: "es_AR",
    type: "website",
  },
};

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
