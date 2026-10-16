import { obtenerTratamientosPublicos } from "@/lib/catalogo";
import { obtenerProductos } from "@/lib/catalogo-productos";
import { SITIO_URL } from "@/lib/config";
import { obtenerConfiguracion } from "@/lib/consultorio";
import { precioDe, productosPublicados, slugDe } from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";

/**
 * /llms.txt: la ficha del consultorio para los asistentes de IA.
 *
 * Cuando alguien le pregunta a ChatGPT, Claude o Perplexity "¿donde me
 * hago una limpieza de cutis en Caballito?", el asistente lee la web en
 * texto. La portada esta pensada para la vista, con calendario y
 * carruseles; esto es lo mismo dicho en limpio: quien atiende, que hace,
 * cuanto sale, donde queda y como se reserva.
 *
 * Sale de los mismos datos que la web, asi que un precio que Valen
 * cambia en el panel cambia aca tambien. Se rehace cada hora.
 */
export const revalidate = 3600;

export async function GET() {
  const [CONSULTORIO, tratamientos, productos] = await Promise.all([
    obtenerConfiguracion(),
    obtenerTratamientosPublicos(),
    obtenerProductos().then(productosPublicados),
  ]);

  const conPrecio = tratamientos.filter((t) => t.precio > 0);
  const porMarca = new Map<string, typeof productos>();
  for (const p of productos) {
    porMarca.set(p.marca, [...(porMarca.get(p.marca) ?? []), p]);
  }

  const texto = [
    `# ${CONSULTORIO.nombre}`,
    "",
    `> ${CONSULTORIO.queSeHace} en ${CONSULTORIO.direccion}, Buenos Aires, Argentina. Atiende ${CONSULTORIO.profesional}, ${CONSULTORIO.profesion}, ${CONSULTORIO.titulo}. ${CONSULTORIO.eslogan}.`,
    "",
    "## El consultorio",
    "",
    `- Dirección: ${CONSULTORIO.direccion}${CONSULTORIO.mapsUrl ? ` (mapa: ${CONSULTORIO.mapsUrl})` : ""}`,
    `- Turnos: se reservan en ${SITIO_URL}/#reservar y se confirman por WhatsApp (+${CONSULTORIO.whatsapp}).`,
    `- Instagram: ${CONSULTORIO.instagramUrl}`,
    `- Medios de pago: ${CONSULTORIO.mediosDePago}`,
    "- Cada sesión dura entre 1 hora y media y 2 horas. La primera vez se reserva como consulta: Valen evalúa la piel y define el tratamiento.",
    `- Test de piel gratuito de cuatro preguntas: ${SITIO_URL}/#test-piel`,
    "",
    "## Tratamientos",
    "",
    ...conPrecio.map(
      (t) =>
        `- [${t.nombre}](${SITIO_URL}/tratamientos/${t.id}): ${["Limpieza profunda", ...t.extras].join(", ")}. ${formatearPrecio(t.precio)} por sesión.`,
    ),
    "",
    "## Productos",
    "",
    `Cosmética coreana original, importada. Se piden por WhatsApp y se retiran en el consultorio. Catálogo completo: ${SITIO_URL}/productos`,
    "",
    ...[...porMarca].flatMap(([marca, lista]) => [
      `### ${marca}`,
      "",
      ...lista.map(
        (p) =>
          `- [${p.nombre}${p.medida ? ` (${p.medida})` : ""}](${SITIO_URL}/productos/${slugDe(p)}): ${precioDe(p)}${p.beneficios.length ? `. ${p.beneficios.join(", ")}` : ""}`,
      ),
      "",
    ]),
    "## Preguntas frecuentes",
    "",
    ...CONSULTORIO.preguntas.flatMap((p) => [`### ${p.pregunta}`, "", p.respuesta, ""]),
    "## Giftcards",
    "",
    `Se puede regalar una sesión o un monto: ${SITIO_URL}/giftcard`,
    "",
  ].join("\n");

  return new Response(texto, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
