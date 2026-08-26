import { ImageResponse } from "next/og";
import { obtenerConfiguracion } from "@/lib/consultorio";

/**
 * La imagen que se ve cuando alguien pasa el link.
 *
 * Todo el negocio pasa por WhatsApp: la clienta reserva por WhatsApp,
 * confirma por WhatsApp, y la amiga le pasa el link por WhatsApp. En esa
 * vista previa —que es la primera impresion real de la marca— antes salia
 * un rectangulo gris con texto, porque `openGraph` no declaraba ninguna
 * imagen y no habia ningun archivo que la generara.
 *
 * Se dibuja con las tipografias del sistema a proposito: cargar una
 * fuente aca obliga a bajarse el archivo en cada build y no aporta nada
 * a un cartel de dos lineas.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Piel con Valen";

export default async function Imagen() {
  const CONSULTORIO = await obtenerConfiguracion();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 92px",
          // Los colores de la marca, los mismos de globals.css
          backgroundColor: "#faf6f2",
          color: "#1e1015",
        }}
      >
        {/* Barra de color, para que no sea un rectangulo crema y nada mas */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 24,
            backgroundColor: "#7a0f45",
          }}
        />

        <div
          style={{
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#7a0f45",
            fontWeight: 600,
          }}
        >
          {CONSULTORIO.nombre}
        </div>

        <div
          style={{
            fontSize: 92,
            fontWeight: 700,
            marginTop: 22,
            letterSpacing: -2,
          }}
        >
          {CONSULTORIO.profesional}
        </div>

        <div style={{ fontSize: 40, marginTop: 18, color: "#6b5259" }}>
          {CONSULTORIO.queSeHace}
        </div>

        <div
          style={{
            fontSize: 30,
            marginTop: 46,
            color: "#6b5259",
            display: "flex",
            gap: 18,
          }}
        >
          <span>{CONSULTORIO.direccion}</span>
          <span style={{ color: "#e5d8d0" }}>·</span>
          <span>{CONSULTORIO.titulo}</span>
        </div>
      </div>
    ),
    size
  );
}
