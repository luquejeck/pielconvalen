"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clienteNavegador } from "@/lib/supabase";
import { formatearPrecio, type Tratamiento } from "@/lib/tratamientos";

/** "Ácidos, Dermaplaning" -> ["Ácidos", "Dermaplaning"] */
const aLista = (texto: string) =>
  texto
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

/** "Higiene Facial con Ácidos" -> "higiene-facial-con-acidos" */
const aIdentificador = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

type Props = { tratamientos: Tratamiento[] };

export default function EditorTratamientos({ tratamientos }: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  return (
    <section>
      <p className="text-lg text-tinta-suave">
        Lo que cambies acá se ve en la web al instante.
      </p>

      <ul className="mt-6 space-y-3">
        {tratamientos.map((t) => (
          <li key={t.id} className="tarjeta px-5 py-4">
            {editando === t.id ? (
              <Formulario
                inicial={t}
                onCancelar={() => setEditando(null)}
                onListo={() => {
                  setEditando(null);
                  router.refresh();
                }}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-semibold text-tinta">
                    {t.nombre}
                    {t.destacado && (
                      <span className="ml-2 rounded-full bg-vino-suave px-3 py-0.5 text-sm text-vino">
                        destacado
                      </span>
                    )}
                  </p>
                  <p className="text-base text-tinta-suave">
                    {formatearPrecio(t.precio)}
                    {t.extras.length > 0 && ` · + ${t.extras.join(", ")}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditando(t.id)}
                  className="rounded-full border border-vino px-5 py-2.5 text-base text-vino hover:bg-vino hover:text-white"
                >
                  Editar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {creando ? (
        <div className="tarjeta mt-4 px-5 py-4">
          <Formulario
            onCancelar={() => setCreando(false)}
            onListo={() => {
              setCreando(false);
              router.refresh();
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="mt-6 min-h-13 w-full rounded-full bg-vino px-6 text-base text-white"
        >
          Agregar tratamiento
        </button>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------------- */

function Formulario({
  inicial,
  onCancelar,
  onListo,
}: {
  inicial?: Tratamiento;
  onCancelar: () => void;
  onListo: () => void;
}) {
  const supabase = clienteNavegador();
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [nombreCorto, setNombreCorto] = useState(inicial?.nombreCorto ?? "");
  const [precio, setPrecio] = useState(String(inicial?.precio ?? ""));
  const [extras, setExtras] = useState(inicial?.extras.join(", ") ?? "");
  const [destacado, setDestacado] = useState(Boolean(inicial?.destacado));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const datos = {
      nombre: nombre.trim(),
      nombre_corto: nombreCorto.trim() || nombre.trim(),
      precio: Number(precio) || 0,
      extras: aLista(extras),
      destacado,
    };

    const { error } = inicial
      ? await supabase.from("tratamientos").update(datos).eq("id", inicial.id)
      : await supabase.from("tratamientos").insert({
          ...datos,
          id: aIdentificador(nombre),
          orden: 99,
        });

    setGuardando(false);

    if (error) {
      setError(
        error.code === "23505"
          ? "Ya existe un tratamiento con ese nombre."
          : "No se pudo guardar."
      );
      return;
    }

    onListo();
  };

  const borrar = async () => {
    if (!inicial) return;
    setGuardando(true);
    await supabase.from("tratamientos").delete().eq("id", inicial.id);
    setGuardando(false);
    onListo();
  };

  return (
    <form onSubmit={guardar}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Nombre completo"
          valor={nombre}
          onChange={setNombre}
          requerido
          ayuda="Como aparece en la web"
        />
        <Campo
          etiqueta="Nombre corto"
          valor={nombreCorto}
          onChange={setNombreCorto}
          ayuda="Para los botones del calendario"
        />
        <Campo
          etiqueta="Precio"
          valor={precio}
          onChange={setPrecio}
          tipo="number"
          requerido
          ayuda="Solo números, sin puntos"
        />
        <Campo
          etiqueta="Qué suma"
          valor={extras}
          onChange={setExtras}
          ayuda="Separado por comas. Vacío = solo la limpieza profunda"
        />
      </div>

      <label className="mt-4 flex items-center gap-3 text-base">
        <input
          type="checkbox"
          checked={destacado}
          onChange={(e) => setDestacado(e.target.checked)}
          className="h-5 w-5 accent-[#6d2740]"
        />
        Marcarlo como el más completo
      </label>

      {error && <p className="mt-3 text-base text-vino">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={guardando}
          className="min-h-12 rounded-full bg-vino px-6 text-base text-white disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>

        <button
          type="button"
          onClick={onCancelar}
          className="min-h-12 rounded-full border border-borde px-6 text-base text-tinta-suave hover:border-vino hover:text-vino"
        >
          Cancelar
        </button>

        {inicial && (
          <button
            type="button"
            onClick={borrar}
            disabled={guardando}
            className="ml-auto min-h-12 rounded-full border border-borde px-6 text-base text-tinta-suave hover:border-vino hover:text-vino"
          >
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}

function Campo({
  etiqueta,
  valor,
  onChange,
  tipo = "text",
  requerido,
  ayuda,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  tipo?: string;
  requerido?: boolean;
  ayuda?: string;
}) {
  return (
    <label className="block">
      <span className="text-base text-tinta">{etiqueta}</span>
      <input
        type={tipo}
        value={valor}
        required={requerido}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 min-h-12 w-full rounded-2xl border border-borde bg-white px-4 text-base text-tinta outline-none focus:border-vino"
      />
      {ayuda && <span className="text-sm text-tinta-suave">{ayuda}</span>}
    </label>
  );
}
