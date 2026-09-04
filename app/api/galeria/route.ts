import { fallo, requerirSesion } from "@/lib/api";
import { BUCKET_GALERIA } from "@/lib/galeria";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"];
/* Un reel exportado del celular sale en mp4 y, en iPhone, a veces en
   .mov (quicktime). Los dos los reproduce cualquier navegador de hoy. */
const TIPOS_VIDEO = ["video/mp4", "video/quicktime", "video/webm"];
const MAXIMO_FOTO = 10 * 1024 * 1024; // 10 MB
/* Un reel de un minuto en buena calidad ronda los 15 MB. 60 deja aire
   sin que nadie suba una pelicula por error. */
const MAXIMO_VIDEO = 60 * 1024 * 1024; // 60 MB

/** Nombre sin sorpresas: nada de rutas, acentos ni mayusculas. */
function nombreSeguro(original: string) {
  const ext = (original.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
  return `${crypto.randomUUID()}.${ext.replace(/[^a-z0-9]/g, "") || "jpg"}`;
}

export async function GET() {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  // El panel las ve todas, publicadas o no.
  const { data, error } = await sesion.sb
    .from("galeria")
    .select("*")
    .order("orden")
    .order("creado_en");

  if (error) return fallo("traer la galería", error);
  return NextResponse.json(data);
}

/** Alta: la foto y su titulo, en un solo envio. Llega como FormData. */
export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const form = await req.formData();
  const titulo = String(form.get("titulo") ?? "").trim();
  const foto = form.get("foto");

  if (!titulo) {
    return NextResponse.json({ error: "Falta el título." }, { status: 400 });
  }
  if (!(foto instanceof File)) {
    return NextResponse.json({ error: "Falta la foto." }, { status: 400 });
  }
  const esVideo = TIPOS_VIDEO.includes(foto.type);

  if (!esVideo && !TIPOS_FOTO.includes(foto.type)) {
    return NextResponse.json(
      { error: "Tiene que ser una foto (JPG, PNG o WEBP) o un video (MP4 o MOV)." },
      { status: 400 }
    );
  }
  if (foto.size > (esVideo ? MAXIMO_VIDEO : MAXIMO_FOTO)) {
    return NextResponse.json(
      {
        error: esVideo
          ? "El video tiene que pesar menos de 60 MB."
          : "La foto tiene que pesar menos de 10 MB.",
      },
      { status: 400 }
    );
  }

  const ruta = nombreSeguro(foto.name);

  const { error: fallaSubida } = await sesion.sb.storage
    .from(BUCKET_GALERIA)
    .upload(ruta, foto, { contentType: foto.type });

  if (fallaSubida) {
    console.error("[api] subir foto:", fallaSubida.message);
    return NextResponse.json(
      { error: "No se pudo subir la foto. Probá de nuevo." },
      { status: 500 }
    );
  }

  const { data, error } = await sesion.sb
    .from("galeria")
    .insert({
      titulo,
      descripcion: String(form.get("descripcion") ?? "").trim() || null,
      archivo: ruta,
      tipo: esVideo ? "video" : "foto",
      publicado: false,
    })
    .select()
    .single();

  if (error) {
    // Si la fila no entra, la foto ya subida quedaria huerfana.
    await sesion.sb.storage.from(BUCKET_GALERIA).remove([ruta]);
    return fallo("guardar la foto", error);
  }

  return NextResponse.json(data, { status: 201 });
}

/** Publicar, despublicar o cambiar el orden. No toca el archivo. */
export async function PATCH(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const body = await req.json();
  const cambios: Record<string, unknown> = {};
  if (typeof body.publicado === "boolean") cambios.publicado = body.publicado;
  if (typeof body.orden === "number") cambios.orden = body.orden;

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "Nada que cambiar." }, { status: 400 });
  }

  const { data, error } = await sesion.sb
    .from("galeria")
    .update(cambios)
    .eq("id", id)
    .select()
    .single();

  if (error) return fallo("cambiar la foto", error);
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  // Primero se averigua que archivo borrar, despues se borra la fila.
  const { data: foto } = await sesion.sb
    .from("galeria")
    .select("archivo")
    .eq("id", id)
    .maybeSingle();

  const { error } = await sesion.sb.from("galeria").delete().eq("id", id);
  if (error) return fallo("borrar la foto", error);

  if (foto) {
    await sesion.sb.storage.from(BUCKET_GALERIA).remove([foto.archivo]);
  }

  return NextResponse.json({ ok: true });
}
