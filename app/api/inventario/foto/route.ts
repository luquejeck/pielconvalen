import sharp from "sharp";
import { fallo, requerirSesion } from "@/lib/api";
import { BUCKET_GALERIA } from "@/lib/galeria";
import { NextRequest, NextResponse } from "next/server";

/**
 * La foto de un producto, subida desde el panel.
 *
 * Antes el campo "Foto" era un texto donde habia que pegar una ruta del
 * repo: para ponerle imagen a un producto nuevo hacia falta un
 * programador, un comando y un deploy. Asi quedaron cinco mascarillas y
 * tres productos mas en borrador, esperando una foto que Valen no tenia
 * como subir.
 *
 * LA FOTO SE PROCESA AL SUBIRLA, NO SE GUARDA TAL CUAL.
 * Sale cuadrada, sobre el mismo blanco roto de las tarjetas y en webp,
 * igual que las que arma `npm run fotos` para el catalogo. Una foto de
 * celular vertical de 4 MB puesta al lado de catorce fichas cuadradas de
 * 30 KB se ve como un parche; procesada, se ve como una mas.
 *
 * Va al bucket `casos`, que ya existe y ya tiene sus politicas: tocar
 * politicas sobre storage.objects es lo que una vez corto con "deadlock
 * detected". Dentro del bucket, en una carpeta propia.
 */

const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAXIMO = 15 * 1024 * 1024; // 15 MB: una foto de celular sin tocar

/** Lado final, el mismo que usan las fotos del catalogo. */
const LADO = 640;

/** --color-papel de app/globals.css: el fondo de las tarjetas. */
const PAPEL = { r: 253, g: 251, b: 252 };

export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const form = await req.formData();
  const id = String(form.get("inventario_id") ?? "");
  const archivo = form.get("foto");

  if (!id) return NextResponse.json({ error: "Falta el producto" }, { status: 400 });
  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: "Falta la foto" }, { status: 400 });
  }
  if (!TIPOS.includes(archivo.type)) {
    return NextResponse.json(
      { error: "Tiene que ser una foto (JPG, PNG, WEBP o la del iPhone)" },
      { status: 400 }
    );
  }
  if (archivo.size > MAXIMO) {
    return NextResponse.json({ error: "La foto pesa más de 15 MB" }, { status: 400 });
  }

  const { data: producto } = await sesion.sb
    .from("inventario")
    .select("codigo, foto")
    .eq("id", id)
    .maybeSingle();
  if (!producto) {
    return NextResponse.json({ error: "Ese producto no existe" }, { status: 404 });
  }

  /*
    `contain` y no `cover`: una foto de producto trae el envase entero y
    recortarla a cuadrado le come la tapa o la base. Se mete completa y
    se rellena con el mismo color del fondo, asi no se nota que sobro
    lugar. `rotate()` respeta la orientacion que guarda el celular.
  */
  let procesada: Buffer;
  try {
    procesada = await sharp(Buffer.from(await archivo.arrayBuffer()))
      .rotate()
      .resize(LADO, LADO, { fit: "contain", background: PAPEL })
      .flatten({ background: PAPEL })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer la foto. Probá con otra." },
      { status: 400 }
    );
  }

  /*
    El nombre lleva el momento de la subida. Si fuera solo el codigo, la
    foto nueva pisaria a la vieja con el mismo nombre y el navegador —y
    el optimizador de Next— seguirian mostrando la anterior de su cache.
  */
  const base = (producto.codigo ?? id).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const ruta = `productos/${base}-${Date.now()}.webp`;

  const { error: fallaSubida } = await sesion.sb.storage
    .from(BUCKET_GALERIA)
    .upload(ruta, procesada, { contentType: "image/webp" });
  if (fallaSubida) {
    console.error("[api] subir foto de producto:", fallaSubida.message);
    return NextResponse.json({ error: "No se pudo subir la foto. Probá de nuevo." }, { status: 500 });
  }

  const { error } = await sesion.sb
    .from("inventario")
    .update({ foto: ruta, actualizado_en: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    /* Si la fila no se actualiza, la foto subida queda huerfana. */
    await sesion.sb.storage.from(BUCKET_GALERIA).remove([ruta]);
    return fallo("guardar la foto", error);
  }

  /*
    La foto anterior se borra solo si era del bucket. Las que empiezan
    con barra son archivos del repo: esas no se tocan desde aca, las
    maneja git.
  */
  if (producto.foto && !producto.foto.startsWith("/")) {
    await sesion.sb.storage.from(BUCKET_GALERIA).remove([producto.foto]);
  }

  return NextResponse.json({ foto: ruta }, { status: 201 });
}
