import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { CONSULTORIO } from "@/lib/config";
import "./globals.css";

/**
 * Inter es el plan B para Windows y Android.
 * En iPhone y Mac la pagina usa San Francisco, la tipografia del sistema.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
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
  themeColor: "#fbf8f5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
