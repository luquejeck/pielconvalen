import { obtenerConfiguracion } from "@/lib/consultorio";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * El turno, en un archivo que el celular agrega al calendario.
 *
 * Terminado el flujo, lo unico que le quedaba a la clienta era el mensaje
 * que ella misma habia mandado por WhatsApp: ni mail, ni recordatorio, ni
 * nada anotado. Para Valen eso son ausencias; para la clienta, revisar el
 * chat cinco veces para asegurarse del horario.
 *
 * Es una ruta PUBLICA: la usa la clienta, que no tiene sesion. Por eso
 * todo lo que entra se valida y se limpia antes de escribirlo.
 */

/**
 * En un .ics la coma, el punto y coma y la barra tienen significado
 * propio: separan valores. Si no se escapan, una direccion como
 * "Riglos 531, Caballito" se lee como tres campos distintos.
 */
function escaparTexto(texto: string, maximo = 200): string {
  return texto
    .slice(0, maximo)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * El formato pide renglones de 75 OCTETOS como maximo, y los que siguen
 * arrancan con un espacio. Sin esto, iOS y Google descartan el evento
 * entero en vez de mostrarlo cortado.
 *
 * Se cuentan bytes y no letras porque cada tilde ocupa dos: "Vení como
 * estés" mide 16 letras y 18 octetos. Y se corta entre caracteres
 * completos: partir una "í" al medio deja dos bytes sueltos que ningun
 * calendario sabe leer.
 */
const LIMITE = 75;
const bytes = (t: string) => new TextEncoder().encode(t).length;

function plegar(linea: string): string {
  if (bytes(linea) <= LIMITE) return linea;

  const partes: string[] = [];
  let actual = "";
  // El primer renglon usa los 75; los siguientes gastan uno en el espacio.
  let tope = LIMITE;

  // [...linea] recorre por caracteres, no por unidades UTF-16.
  for (const letra of linea) {
    if (bytes(actual + letra) > tope) {
      partes.push(actual);
      actual = " " + letra;
      tope = LIMITE;
    } else {
      actual += letra;
    }
  }
  if (actual) partes.push(actual);

  return partes.join("\r\n");
}

const dosDigitos = (n: number) => String(n).padStart(2, "0");

/** "2026-09-03" + "10:00" (+ horas) -> "20260903T120000" */
function selloLocal(fecha: string, hora: string, sumarHoras = 0): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [h, m] = hora.split(":").map(Number);
  const t = new Date(anio, mes - 1, dia, h + sumarHoras, m);
  return (
    `${t.getFullYear()}${dosDigitos(t.getMonth() + 1)}${dosDigitos(t.getDate())}` +
    `T${dosDigitos(t.getHours())}${dosDigitos(t.getMinutes())}00`
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const fecha = searchParams.get("fecha") ?? "";
  const hora = searchParams.get("hora") ?? "";
  const tratamiento = searchParams.get("tratamiento") ?? "Turno";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const CONSULTORIO = await obtenerConfiguracion();

  /*
    Sin zona horaria declarada, cada calendario interpreta la hora como
    la del telefono. Para un consultorio de barrio, donde la clienta esta
    en el mismo huso, es justo lo que se quiere.
  */
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Piel con Valen//Turnos//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${fecha}-${hora.replace(":", "")}@pielconvalen`,
    // Cuando se genero el archivo, en UTC. No es la hora del turno.
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${selloLocal(fecha, hora)}`,
    // Las sesiones duran de 1.5 a 2 horas: se reserva el rato completo.
    `DTEND:${selloLocal(fecha, hora, 2)}`,
    `SUMMARY:${escaparTexto(`${tratamiento} · ${CONSULTORIO.nombre}`, 120)}`,
    `LOCATION:${escaparTexto(CONSULTORIO.direccion, 150)}`,
    `DESCRIPTION:${escaparTexto(
      `Turno con ${CONSULTORIO.profesional}. ${CONSULTORIO.comoVenir}`,
      400
    )}`,
    "BEGIN:VALARM",
    // Un dia antes: es el aviso que evita la ausencia.
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escaparTexto(`Mañana tenés turno en ${CONSULTORIO.nombre}`, 120)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const ics = lineas.map(plegar).join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="turno-${fecha}.ics"`,
    },
  });
}
