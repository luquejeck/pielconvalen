import { ImageResponse } from "next/og";
import { cargarRecursos, giftcardParaDibujar, Tarjeta } from "@/lib/giftcard-dibujo";

export const dynamic = "force-dynamic";

/**
 * GET /giftcard/G-4K7M9P/imagen — la tarjeta sola, en grande, para
 * guardarla en el telefono y mandarla como foto.
 *
 * Solo de una giftcard cobrada: la base no devuelve datos de las que
 * todavia no se pagaron (ver schema-22).
 */
export async function GET(_: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const [g, recursos] = await Promise.all([
    giftcardParaDibujar(decodeURIComponent(codigo).toUpperCase()),
    cargarRecursos(),
  ]);
  if (!g) return new Response("No encontramos esta giftcard.", { status: 404 });

  const imagen = new ImageResponse(<Tarjeta g={g} ancho={1600} logoBlanco={recursos.logoBlanco} />, {
    width: 1600,
    height: 1000,
    fonts: recursos.fuentes,
  });
  imagen.headers.set("Content-Disposition", `inline; filename="giftcard-${g.codigo}.png"`);
  return imagen;
}
