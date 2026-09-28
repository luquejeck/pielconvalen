import { ImageResponse } from "next/og";
import { cargarRecursos, giftcardParaDibujar, Tarjeta } from "@/lib/giftcard-dibujo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Giftcard de Piel con Valen";

/**
 * La vista previa del link de una giftcard: lo que aparece en el chat
 * cuando Valen le manda el link a quien la compro, y cuando esa persona
 * se lo reenvia a quien la recibe. Sin abrir nada, ya se ve la tarjeta.
 *
 * Una giftcard sin cobrar no muestra nombres: sale la tarjeta de muestra.
 */
export default async function Imagen({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const [g, recursos] = await Promise.all([
    giftcardParaDibujar(decodeURIComponent(codigo).toUpperCase()),
    cargarRecursos(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#ecdde3",
        }}
      >
        <Tarjeta g={g} ancho={880} logoBlanco={recursos.logoBlanco} />
      </div>
    ),
    { ...size, fonts: recursos.fuentes }
  );
}
