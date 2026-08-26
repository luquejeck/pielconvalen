import { fallo, requerirSesion } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TIPOS = ["image/jpeg", "image/png", "image/webp"];
const MAXIMO = 8 * 1024 * 1024; // 8 MB

/** Nombre de archivo sin sorpresas: nada de rutas ni acentos. */
function nombreSeguro(original: string) {
  const ext = (original.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
  return `${crypto.randomUUID()}.${ext.replace(/[^a-z0-9]/g, "") || "jpg"}`;
}

export async function GET() {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  // El panel los ve todos, publicados o no.
  const { data, error } = await sesion.sb.from("casos").select("*").order("orden");
  if (error) return fallo("traer los casos", error);
  return NextResponse.json(data);
}

/**
 * Alta de un caso: las dos fotos y los textos, en un solo envio.
 *
 * Llega como FormData y no como JSON porque viajan archivos. Las fotos
 * van al bucket `casos`, que es publico —se ven en la web— y esta
 * separado del bucket privado de las fichas clinicas.
 */
export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const form = await req.formData();
  const titulo = String(form.get("titulo") ?? "").trim();
  const antes = form.get("antes");
  const despues = form.get("despues");

  if (!titulo) {
    return NextResponse.json({ error: "Falta el título." }, { status: 400 });
  }
  if (!(antes instanceof File) || !(despues instanceof File)) {
    return NextResponse.json(
      { error: "Faltan las dos fotos." },
      { status: 400 }
    );
  }

  for (const foto of [antes, despues]) {
    if (!TIPOS.includes(foto.type)) {
      return NextResponse.json(
        { error: "Las fotos tienen que ser JPG, PNG o WEBP." },
        { status: 400 }
      );
    }
    if (foto.size > MAXIMO) {
      return NextResponse.json(
        { error: "Cada foto tiene que pesar menos de 8 MB." },
        { status: 400 }
      );
    }
  }

  const rutaAntes = nombreSeguro(antes.name);
  const rutaDespues = nombreSeguro(despues.name);

  const subida = await Promise.all([
    sesion.sb.storage.from("casos").upload(rutaAntes, antes, {
      contentType: antes.type,
    }),
    sesion.sb.storage.from("casos").upload(rutaDespues, despues, {
      contentType: despues.type,
    }),
  ]);

  const falla = subida.find((s) => s.error);
  if (falla?.error) {
    console.error("[api] subir fotos:", falla.error.message);
    return NextResponse.json(
      { error: "No se pudieron subir las fotos. Probá de nuevo." },
      { status: 500 }
    );
  }

  const { data, error } = await sesion.sb
    .from("casos")
    .insert({
      titulo,
      descripcion: String(form.get("descripcion") ?? "").trim() || null,
      tratamiento: String(form.get("tratamiento") ?? "").trim() || null,
      consentimiento: String(form.get("consentimiento") ?? "").trim() || null,
      archivo_antes: rutaAntes,
      archivo_despues: rutaDespues,
      publicado: false,
    })
    .select()
    .single();

  if (error) {
    // Si la fila no entra, las fotos ya subidas quedarian huerfanas.
    await sesion.sb.storage.from("casos").remove([rutaAntes, rutaDespues]);
    return fallo("guardar el caso", error);
  }

  return NextResponse.json(data, { status: 201 });
}

/** Publicar o despublicar, sin tocar las fotos. */
export async function PATCH(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const body = await req.json();
  const { data, error } = await sesion.sb
    .from("casos")
    .update({ publicado: Boolean(body.publicado) })
    .eq("id", id)
    .select()
    .single();

  if (error) return fallo("cambiar el caso", error);
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  // Primero se averigua que archivos borrar, despues se borra la fila.
  const { data: caso } = await sesion.sb
    .from("casos")
    .select("archivo_antes, archivo_despues")
    .eq("id", id)
    .maybeSingle();

  const { error } = await sesion.sb.from("casos").delete().eq("id", id);
  if (error) return fallo("borrar el caso", error);

  if (caso) {
    await sesion.sb.storage
      .from("casos")
      .remove([caso.archivo_antes, caso.archivo_despues]);
  }

  return NextResponse.json({ ok: true });
}
