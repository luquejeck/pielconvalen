import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import QRCode from "qrcode";
import { fechaConAnio, queRegala, type Giftcard } from "./giftcards";
import { clienteServidor } from "./supabase-servidor";
import { hayBaseDeDatos } from "./supabase";

/*
  LA GIFTCARD COMO IMAGEN Y COMO HOJA PARA IMPRIMIR.

  La web la dibuja con Tailwind (components/TarjetaGiftcard.tsx). Para
  la vista previa de WhatsApp, la imagen para guardar y el PDF hace falta
  una imagen de verdad, y eso lo hace `ImageResponse` de next/og, que
  entiende un subconjunto de CSS: todo en `style`, y todo `display:
  flex`. Por eso es un dibujo aparte, con las mismas medidas y colores.

  Los recursos (tipografia y logos) salen de `assets/` y no de `public/`:
  en Vercel la carpeta public no viaja adentro de la funcion (ver
  lib/config.ts), y lo que se lee con `readFile` desde process.cwd() si.
*/

/** Lo que muestra la tarjeta: lo que devuelve `giftcard_publica`. */
export type GiftcardPublica = Pick<
  Giftcard,
  "codigo" | "estado" | "para" | "de" | "mensaje" | "tratamiento" | "monto" | "vence_el"
>;

/** Una giftcard por su codigo, solo si ya esta cobrada (vigente o usada). */
export async function giftcardParaDibujar(codigo: string): Promise<GiftcardPublica | null> {
  if (!hayBaseDeDatos) return null;
  const supabase = await clienteServidor();
  const { data } = await supabase.rpc("giftcard_publica", { p_codigo: codigo });
  const g = (data as GiftcardPublica[] | null)?.[0];
  return g && (g.estado === "vigente" || g.estado === "usada") ? g : null;
}

const C = {
  vino: "#7d0d46",
  vinoClaro: "#931656",
  vinoOscuro: "#5d0a34",
  crema: "#faf5f6",
  papel: "#fdfbfc",
  tinta: "#1d0f14",
  tintaSuave: "#6b525a",
  borde: "#dcc6ce",
  vinoSuave: "#f7e8ee",
};

type Recursos = {
  fuentes: { name: string; data: Buffer; weight: 400 | 600; style: "normal" }[];
  logoBlanco: string;
  logoVino: string;
};

let recursos: Promise<Recursos> | null = null;

/** Tipografia y logos, leidos una sola vez por instancia. */
export function cargarRecursos(): Promise<Recursos> {
  recursos ??= (async () => {
    /* Rutas escritas enteras, sin armar con variables: es lo que le
       permite a Vercel ver que archivos usa la funcion y llevarlos
       adentro. Ademas estan declarados en next.config.mjs. */
    const [r400, r600, blanco, vino] = await Promise.all([
      readFile(join(process.cwd(), "assets/fuentes/Montserrat-400.ttf")),
      readFile(join(process.cwd(), "assets/fuentes/Montserrat-600.ttf")),
      readFile(join(process.cwd(), "assets/logo-vg-blanco.png")),
      readFile(join(process.cwd(), "assets/logo-vg.png")),
    ]);
    return {
      fuentes: [
        { name: "Montserrat", data: r400, weight: 400, style: "normal" },
        { name: "Montserrat", data: r600, weight: 600, style: "normal" },
      ],
      logoBlanco: `data:image/png;base64,${blanco.toString("base64")}`,
      logoVino: `data:image/png;base64,${vino.toString("base64")}`,
    };
  })();
  return recursos;
}

/** El monograma mide 830 x 428. */
const ANCHO_LOGO = 830 / 428;

/** La caja de regalo de components/iconos.tsx, como imagen. */
const iconoRegalo = (color: string) =>
  `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.4"><rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5v7a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-7M12 8.5V21" stroke-linejoin="round"/><path d="M12 8.5C10.5 5 7.5 3.5 6.3 5.2 5.2 6.8 7.5 8.5 12 8.5zM12 8.5c1.5-3.5 4.5-5 5.7-3.3 1.1 1.6-1.2 3.3-5.7 3.3z" stroke-linejoin="round"/></svg>`
  ).toString("base64")}`;

/**
 * La tarjeta, de `ancho` px (la proporcion es la de siempre, 1,6). Sin
 * datos, es la tarjeta de muestra: para una giftcard que todavia no se
 * cobro no se muestra nada de quien la regala.
 */
export function Tarjeta({
  g,
  ancho,
  logoBlanco,
}: {
  g: GiftcardPublica | null;
  ancho: number;
  logoBlanco: string;
}) {
  const s = ancho / 600;
  const alto = Math.round(ancho / 1.6);
  const radio = 36 * s;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: ancho,
        height: alto,
        padding: 40 * s,
        borderRadius: radio,
        overflow: "hidden",
        backgroundImage: `linear-gradient(135deg, ${C.vinoClaro} 0%, ${C.vino} 42%, ${C.vinoOscuro} 100%)`,
        color: C.crema,
        fontFamily: "Montserrat",
      }}
    >
      {/* La marca de agua, el brillo y el filete. */}
      <img
        src={logoBlanco}
        width={300 * s * ANCHO_LOGO}
        height={300 * s}
        style={{ position: "absolute", right: -70 * s, bottom: -60 * s, opacity: 0.08 }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: ancho,
          height: alto,
          backgroundImage:
            "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.09) 45%, rgba(255,255,255,0) 60%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 16 * s,
          left: 16 * s,
          width: ancho - 32 * s,
          height: alto - 32 * s,
          borderRadius: radio - 14 * s,
          border: `${Math.max(1, 1.5 * s)}px solid rgba(250,245,246,0.22)`,
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <img src={logoBlanco} width={34 * s * ANCHO_LOGO} height={34 * s} />
          <div
            style={{
              marginTop: 12 * s,
              fontSize: 14 * s,
              fontWeight: 600,
              letterSpacing: 4.5 * s,
              color: "rgba(250,245,246,0.72)",
            }}
          >
            GIFTCARD
          </div>
        </div>
        <img src={iconoRegalo("rgba(250,245,246,0.88)")} width={42 * s} height={42 * s} />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 22 * s, color: "rgba(250,245,246,0.8)" }}>
          {g ? `Para ${g.para}` : "Para alguien especial"}
        </div>
        <div style={{ marginTop: 6 * s, fontSize: 50 * s, fontWeight: 600, lineHeight: 1.1 }}>
          {g ? queRegala(g) : "Una sesión de piel"}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22 * s, color: "rgba(250,245,246,0.8)" }}>
          {g ? `De parte de ${g.de}` : "Piel con Valen"}
        </div>
        {g && (
          <div
            style={{
              display: "flex",
              padding: `${7 * s}px ${18 * s}px`,
              borderRadius: 999,
              backgroundColor: "rgba(250,245,246,0.12)",
              border: `${Math.max(1, 1.5 * s)}px solid rgba(250,245,246,0.22)`,
              fontSize: 20 * s,
              fontWeight: 600,
              letterSpacing: 2.5 * s,
            }}
          >
            {g.codigo}
          </div>
        )}
      </div>
    </div>
  );
}

/** El QR que lleva a la tarjeta en la web, como imagen. */
export async function qrDe(url: string): Promise<string> {
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: C.tinta, light: "#ffffff00" },
  });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** A4 a 150 ppp: 1240 x 1754 px. */
export const HOJA = { ancho: 1240, alto: 1754 };

/**
 * La hoja para imprimir: la tarjeta grande, el mensaje, como usarla y un
 * QR que lleva a la tarjeta en la web. Es para quien quiere regalarla en
 * papel —en un sobre, con un moño— y no por WhatsApp.
 */
export function HojaImpresion({
  g,
  url,
  qr,
  recursos,
  pie,
}: {
  g: GiftcardPublica;
  url: string;
  qr: string;
  recursos: Recursos;
  pie: string;
}) {
  const direccionCorta = url.replace(/^https?:\/\//, "");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: HOJA.ancho,
        height: HOJA.alto,
        padding: "110px 120px 90px",
        backgroundColor: C.papel,
        color: C.tinta,
        fontFamily: "Montserrat",
      }}
    >
      <img src={recursos.logoVino} width={64 * ANCHO_LOGO} height={64} />
      <div style={{ marginTop: 22, fontSize: 22, fontWeight: 600, letterSpacing: 7, color: C.vino }}>
        UN REGALO PARA VOS
      </div>
      <div style={{ marginTop: 18, fontSize: 60, textAlign: "center", lineHeight: 1.1 }}>
        {`${g.de} te regaló una sesión`}
      </div>

      <div style={{ display: "flex", marginTop: 64 }}>
        <Tarjeta g={g} ancho={1000} logoBlanco={recursos.logoBlanco} />
      </div>

      {g.mensaje && (
        <div
          style={{
            marginTop: 52,
            maxWidth: 900,
            fontSize: 34,
            lineHeight: 1.35,
            textAlign: "center",
            color: C.tinta,
          }}
        >
          {`“${g.mensaje}”`}
        </div>
      )}

      {/* Como usarla, con el QR al costado. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: 1000,
          marginTop: "auto",
          padding: 44,
          borderRadius: 28,
          backgroundColor: C.vinoSuave,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingRight: 36 }}>
          <div style={{ fontSize: 30, fontWeight: 600 }}>Cómo usarla</div>
          <div style={{ marginTop: 16, fontSize: 25, lineHeight: 1.4, color: C.tinta }}>
            Escaneá el código o entrá a
          </div>
          <div style={{ fontSize: 25, fontWeight: 600, lineHeight: 1.4, color: C.vino }}>
            {direccionCorta}
          </div>
          <div style={{ marginTop: 12, fontSize: 25, lineHeight: 1.4 }}>
            y tocá «Reservar turno». Elegís día y horario, y la giftcard ya va incluida.
          </div>
          {g.vence_el && (
            <div style={{ marginTop: 16, fontSize: 23, color: C.tintaSuave }}>
              {`Vale hasta el ${fechaConAnio(g.vence_el)}.`}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            padding: 18,
            borderRadius: 20,
            backgroundColor: "#ffffff",
          }}
        >
          <img src={qr} width={230} height={230} />
        </div>
      </div>

      <div style={{ marginTop: 44, fontSize: 21, color: C.tintaSuave, textAlign: "center" }}>{pie}</div>
    </div>
  );
}
