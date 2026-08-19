import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { CONSULTORIO } from "@/lib/config";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

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
  themeColor: "#fbf6f1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" className={`${cormorant.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
