import { ImageResponse } from "next/og";
import { PDFDocument } from "pdf-lib";
import { SITIO_URL } from "@/lib/config";
import { obtenerConfiguracion } from "@/lib/consultorio";
import {
  cargarRecursos,
  giftcardParaDibujar,
  HOJA,
  HojaImpresion,
  qrDe,
} from "@/lib/giftcard-dibujo";

export const dynamic = "force-dynamic";

/**
 * GET /giftcard/G-4K7M9P/pdf — la giftcard para imprimir, en una hoja A4.
 *
 * La hoja se dibuja como imagen (el mismo dibujo que la vista previa, ver
 * lib/giftcard-dibujo.tsx) y se pone entera en un PDF de una pagina. Asi
 * hay un solo diseño, y el PDF sale igual en cualquier impresora.
 *
 * Solo de una giftcard cobrada.
 */
export async function GET(_: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const [g, recursos, CONSULTORIO] = await Promise.all([
    giftcardParaDibujar(decodeURIComponent(codigo).toUpperCase()),
    cargarRecursos(),
    obtenerConfiguracion(),
  ]);
  if (!g) return new Response("No encontramos esta giftcard.", { status: 404 });

  const url = `${SITIO_URL}/giftcard/${g.codigo}`;
  const pie = [
    CONSULTORIO.nombre,
    CONSULTORIO.direccion,
    `WhatsApp ${CONSULTORIO.whatsappVisible}`,
    `@${CONSULTORIO.instagram}`,
  ].join("  ·  ");

  const png = await new ImageResponse(
    <HojaImpresion g={g} url={url} qr={await qrDe(url)} recursos={recursos} pie={pie} />,
    { width: HOJA.ancho, height: HOJA.alto, fonts: recursos.fuentes }
  ).arrayBuffer();

  /* A4 en puntos: 595,28 x 841,89. La imagen la ocupa entera. */
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Giftcard ${g.codigo} · ${CONSULTORIO.nombre}`);
  const pagina = pdf.addPage([595.28, 841.89]);
  const imagen = await pdf.embedPng(png);
  pagina.drawImage(imagen, { x: 0, y: 0, width: 595.28, height: 841.89 });

  return new Response(Buffer.from(await pdf.save()), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="giftcard-${g.codigo}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
