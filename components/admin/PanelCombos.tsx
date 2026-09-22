"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { URL_SUPABASE } from "@/lib/supabase";
import { formatearPrecio } from "@/lib/tratamientos";
import { hoyEnArgentina } from "@/lib/fechas";
import { MEDIOS_DE_PAGO } from "./FormularioCobro";

/**
 * Los combos, armados por Valen.
 *
 * Un combo es un nombre, un descuento y una lista de productos. Hasta el
 * 22-09-2026 vivia escrito en lib/combos.ts: cambiarle el nombre o un
 * producto pedia un programador y un deploy.
 *
 * EL PRECIO NO SE ESCRIBE, SE CALCULA.
 * Es la suma de lo que valen hoy sus productos menos el descuento. Por
 * eso cuando Valen cambia un precio —o pone una oferta— el combo se
 * actualiza solo y nunca anuncia un numero que ya no corresponde. Esta
 * pantalla hace la misma cuenta que la web para mostrarla antes de
 * guardar, incluido el redondeo a la centena para abajo.
 *
 * SOLO ENTRAN PRODUCTOS PUBLICADOS.
 * Un combo con un producto oculto no se muestra en la web —esa regla ya
 * existe— y elegirlo aca seria armar algo que no se ve, sin explicacion.
 */
type Producto = {
  id: string;
  codigo: string | null;
  marca: string;
  producto: string;
  medida: string | null;
  categoria: string | null;
  costo: number;
  precio_venta: number;
  cantidad: number;
  publicado: boolean;
  foto: string | null;
};

type Combo = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  descuento: number;
  publicado: boolean;
  orden: number;
  productos: string[];
};

const DESCUENTOS = [5, 10, 15, 20, 25];
const LIMITE = 6;

/** Igual que en la web: a la centena para abajo. */
const aCentena = (n: number) => Math.floor(n / 100) * 100;

const urlFoto = (foto: string | null) =>
  !foto ? null
  : foto.startsWith("/") || foto.startsWith("http") ? foto
  : `${URL_SUPABASE}/storage/v1/object/public/casos/${foto}`;

/** Lo que sale, lo que costaba y lo que deja. */
function cuentas(elegidos: Producto[], descuento: number) {
  const suma = elegidos.reduce((n, p) => n + p.precio_venta, 0);
  const precio = aCentena(suma * (1 - descuento / 100));
  const costo = elegidos.reduce((n, p) => n + p.costo, 0);
  return {
    suma,
    precio,
    ahorro: suma - precio,
    costo,
    margen: costo ? Math.round((precio / costo - 1) * 100) : null,
  };
}

export default function PanelCombos() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState<Combo | null>(null);
  const [creando, setCreando] = useState(false);

  const traer = useCallback(async () => {
    setError("");
    try {
      const [rc, rp] = await Promise.all([fetch("/api/combos"), fetch("/api/inventario")]);
      if (!rp.ok) throw new Error("No se pudo traer el inventario");
      setProductos(await rp.json());
      /*
        Si la tabla todavia no existe —schema-18 sin correr— la lista
        queda vacia y se avisa, en vez de romper la pantalla entera.
      */
      if (rc.ok) setCombos(await rc.json());
      else setError("Todavía no se puede guardar combos: falta correr schema-18-combos.sql en Supabase.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo falló");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    traer();
  }, [traer]);

  const porId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);

  if (cargando) return <p className="mt-6 text-base text-tinta-suave">Cargando…</p>;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Combos</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            Varios productos juntos, con descuento. El precio se calcula solo con lo que valen hoy.
          </p>
        </div>
        <button type="button" onClick={() => setCreando(true)} className="boton-principal">
          + Nuevo combo
        </button>
      </div>

      {error && <p className="mb-4 text-base text-negativo">{error}</p>}

      {combos.length === 0 && !error && (
        <p className="rounded-chico border border-dashed border-borde bg-crema p-4 text-base text-tinta-suave">
          Todavía no hay combos. Armá uno con dos o más productos y un descuento: aparece arriba
          del catálogo y en la portada.
        </p>
      )}

      <ul className="space-y-3">
        {combos.map((c) => (
          <Fila
            key={c.id}
            combo={c}
            productos={c.productos.map((id) => porId.get(id)).filter(Boolean) as Producto[]}
            onEditar={() => setEditando(c)}
            onCambio={traer}
          />
        ))}
      </ul>

      {(creando || editando) && (
        <Editor
          combo={editando}
          productos={productos}
          onCerrar={() => {
            setCreando(false);
            setEditando(null);
          }}
          onListo={() => {
            setCreando(false);
            setEditando(null);
            traer();
          }}
        />
      )}
    </div>
  );
}

function Fila({
  combo: c,
  productos,
  onEditar,
  onCambio,
}: {
  combo: Combo;
  productos: Producto[];
  onEditar: () => void;
  onCambio: () => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [vendiendo, setVendiendo] = useState(false);
  const n = cuentas(productos, c.descuento);

  /*
    Le faltan productos para ser un combo: o Valen guardo uno solo, o
    borro un producto que lo integraba. La web no lo muestra, y aca hay
    que poder enterarse sin abrirlo.
  */
  const incompleto = productos.length < 2;
  const ocultos = productos.filter((p) => !p.publicado);

  const publicar = async () => {
    setOcupado(true);
    await fetch(`/api/combos?id=${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicado: !c.publicado }),
    });
    setOcupado(false);
    onCambio();
  };

  const borrar = async () => {
    if (!confirm(`¿Borrar el combo "${c.nombre}"? Los productos no se tocan.`)) return;
    setOcupado(true);
    await fetch(`/api/combos?id=${c.id}`, { method: "DELETE" });
    setOcupado(false);
    onCambio();
  };

  return (
    <li className="rounded-chico border border-borde bg-papel px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base leading-snug text-tinta">
            <span className="font-semibold">{c.nombre}</span>
            <span className="text-tinta-suave"> · {c.descuento}% de descuento</span>
          </p>
          <p className="mt-0.5 text-sm text-tinta-suave tabular-nums">
            {formatearPrecio(n.suma)} → <span className="font-semibold text-tinta">{formatearPrecio(n.precio)}</span>
            {" "}· ahorra {formatearPrecio(n.ahorro)}
            {n.margen != null && <span> · te queda {n.margen}% de margen</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Vendi primero y relleno, igual que en cada producto: es lo
              que mas va a pasar con un combo publicado. */}
          <button
            type="button"
            onClick={() => setVendiendo((v) => !v)}
            disabled={ocupado || incompleto}
            className="rounded-full bg-vino px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-vino-oscuro disabled:opacity-50"
          >
            Vendí
          </button>

          <button
            type="button"
            onClick={publicar}
            disabled={ocupado}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              c.publicado ? "border-vino bg-vino-suave text-vino" : "border-borde text-tinta-suave hover:border-vino"
            }`}
          >
            {c.publicado ? "En la web" : "Oculto"}
          </button>
          <button
            type="button"
            onClick={onEditar}
            className="rounded-full border border-borde px-3 py-1.5 text-sm text-tinta transition-colors hover:border-vino"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={borrar}
            disabled={ocupado}
            className="rounded-full px-2 py-1.5 text-sm text-tinta-suave underline-offset-2 hover:text-negativo hover:underline"
          >
            Borrar
          </button>
        </div>
      </div>

      <ul className="mt-2 flex flex-wrap gap-2">
        {productos.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-2 rounded-full border border-borde bg-crema py-1 pr-3 pl-1 text-sm text-tinta"
          >
            {urlFoto(p.foto) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlFoto(p.foto)!} alt="" className="size-6 rounded-full object-cover" />
            ) : (
              <span className="size-6 rounded-full bg-vino-suave" />
            )}
            {p.marca} {p.producto}
          </li>
        ))}
      </ul>

      {incompleto && (
        <p className="mt-2 text-sm text-negativo">
          Con menos de dos productos no se muestra en la web. Editalo y agregá otro.
        </p>
      )}
      {!incompleto && ocultos.length > 0 && (
        <p className="mt-2 text-sm text-negativo">
          No se muestra: {ocultos.map((p) => p.producto).join(", ")} {ocultos.length === 1 ? "está oculto" : "están ocultos"}.
        </p>
      )}

      {vendiendo && (
        <Vender
          combo={c}
          productos={productos}
          onListo={() => {
            setVendiendo(false);
            onCambio();
          }}
        />
      )}
    </li>
  );
}

/**
 * Registrar la venta de un combo.
 *
 * DESCUENTA UNA UNIDAD DE CADA PRODUCTO, no "una del combo": el combo no
 * existe en el deposito, existen sus productos. El servidor guarda una
 * venta por cada uno con su parte del precio, asi el stock baja donde
 * tiene que bajar y la ganancia por producto sigue siendo cierta.
 *
 * EL PRECIO SE PUEDE CAMBIAR, como en la venta suelta: viene el del
 * combo y si Valen cobro otra cosa pone lo que entro de verdad. Ese
 * total se reparte igual entre los productos.
 */
function Vender({
  combo: c,
  productos,
  onListo,
}: {
  combo: Combo;
  productos: Producto[];
  onListo: () => void;
}) {
  const n = cuentas(productos, c.descuento);
  const [unidades, setUnidades] = useState(1);
  const [precio, setPrecio] = useState(String(n.precio));
  const [medio, setMedio] = useState(MEDIOS_DE_PAGO[0]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const precioNum = Number(precio) || 0;
  const total = precioNum * unidades;
  const ganancia = n.costo ? total - n.costo * unidades : null;
  /* El que no alcanza para las unidades pedidas. Se avisa y no se
     bloquea: si pasa, el numero mal era el del sistema. */
  const faltan = productos.filter((p) => p.cantidad < unidades);

  const guardar = async () => {
    if (precioNum <= 0) return setError("Poné a cuánto lo vendiste");
    setGuardando(true);
    setError("");
    const r = await fetch("/api/combos/venta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        combo_id: c.id,
        unidades,
        precio: precioNum,
        medio_pago: medio,
        fecha: hoyEnArgentina(),
      }),
    });
    setGuardando(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      return setError(d.error ?? "No se pudo registrar la venta");
    }
    onListo();
  };

  const campo = "mt-1 w-full rounded-xl border border-borde px-3 py-2 text-base outline-none focus:border-vino";

  return (
    <div className="mt-3 rounded-chico border border-vino/30 bg-crema p-3">
      <p className="text-sm font-semibold text-tinta">Registrar la venta del combo</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm text-tinta-suave">Combos vendidos</span>
          <input type="number" min={1} className={campo} value={unidades} onChange={(e) => setUnidades(Math.max(1, Number(e.target.value)))} />
        </label>
        <label className="block">
          <span className="text-sm text-tinta-suave">Precio del combo</span>
          <input type="number" className={campo} value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Medio de pago">
        {MEDIOS_DE_PAGO.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMedio(m)}
            aria-pressed={medio === m}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              medio === m ? "border-vino bg-vino text-white" : "border-borde bg-papel text-tinta hover:border-vino"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-tinta-suave tabular-nums">
        Total <span className="font-semibold text-tinta">{formatearPrecio(total)}</span>
        {ganancia != null && (
          <span className={ganancia >= 0 ? "text-positivo" : "text-negativo"}>
            {" "}· {ganancia >= 0 ? "ganás" : "perdés"} {formatearPrecio(Math.abs(ganancia))}
          </span>
        )}
      </p>

      {/* Que le pasa al stock de cada uno: es lo que hace distinta a la
          venta de un combo y conviene verlo antes de confirmar. */}
      <ul className="mt-2 space-y-0.5 text-sm text-tinta-suave tabular-nums">
        {productos.map((p) => (
          <li key={p.id}>
            {p.marca} {p.producto}: {p.cantidad} → {Math.max(0, p.cantidad - unidades)}
          </li>
        ))}
      </ul>

      {faltan.length > 0 && (
        <p className="mt-2 text-sm text-negativo">
          En el sistema no hay tantas unidades de {faltan.map((p) => p.producto).join(", ")}. Si igual
          las vendiste, después corregí el stock con + y el motivo &quot;Recuento&quot;.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-negativo">{error}</p>}

      <button type="button" onClick={guardar} disabled={guardando} className="boton-principal mt-3 disabled:opacity-60">
        {guardando ? "Guardando…" : `Registrar venta · ${formatearPrecio(total)}`}
      </button>
    </div>
  );
}

function Editor({
  combo,
  productos,
  onCerrar,
  onListo,
}: {
  combo: Combo | null;
  productos: Producto[];
  onCerrar: () => void;
  onListo: () => void;
}) {
  const [nombre, setNombre] = useState(combo?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(combo?.descripcion ?? "");
  const [descuento, setDescuento] = useState(combo?.descuento ?? 10);
  const [publicado, setPublicado] = useState(combo?.publicado ?? false);
  const [elegidos, setElegidos] = useState<string[]>(combo?.productos ?? []);
  const [busca, setBusca] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  /* Solo publicados: un combo con un producto oculto no se ve. */
  const disponibles = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return productos
      .filter((p) => p.publicado)
      .filter((p) => !t || `${p.marca} ${p.producto} ${p.codigo ?? ""}`.toLowerCase().includes(t));
  }, [productos, busca]);

  const porId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);
  const lista = elegidos.map((id) => porId.get(id)).filter(Boolean) as Producto[];
  const n = cuentas(lista, descuento);

  const alternar = (id: string) =>
    setElegidos((v) =>
      v.includes(id) ? v.filter((x) => x !== id) : v.length >= LIMITE ? v : [...v, id]
    );

  const guardar = async () => {
    if (!nombre.trim()) return setError("Ponele un nombre al combo");
    if (elegidos.length < 2) return setError("Elegí al menos dos productos");
    setGuardando(true);
    setError("");
    const cuerpo = JSON.stringify({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      descuento,
      publicado,
      productos: elegidos,
    });
    const r = combo
      ? await fetch(`/api/combos?id=${combo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: cuerpo,
        })
      : await fetch("/api/combos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: cuerpo,
        });
    setGuardando(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      return setError(d.error ?? "No se pudo guardar el combo");
    }
    onListo();
  };

  const campo = "mt-1 w-full rounded-xl border border-borde px-3 py-2 text-base outline-none focus:border-vino";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-tinta/40 p-4">
      <div className="mx-auto max-w-2xl rounded-chico bg-papel p-4 shadow-lg">
        <h3 className="text-lg font-semibold text-tinta">{combo ? "Editar combo" : "Nuevo combo"}</h3>

        <label className="mt-3 block">
          <span className="text-sm text-tinta-suave">Nombre del combo</span>
          <input
            className={campo}
            placeholder="Rutina antiedad"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </label>

        <label className="mt-3 block">
          <span className="text-sm text-tinta-suave">Para qué es, en una línea</span>
          <textarea
            rows={2}
            className={campo}
            placeholder="Limpiar, tratar y cuidar el contorno."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </label>

        <div className="mt-3">
          <span className="text-sm text-tinta-suave">Descuento</span>
          <div className="mt-1 flex flex-wrap items-center gap-2" role="group" aria-label="Descuento">
            {DESCUENTOS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDescuento(d)}
                aria-pressed={descuento === d}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  descuento === d ? "border-vino bg-vino text-white" : "border-borde bg-papel text-tinta hover:border-vino"
                }`}
              >
                {d}%
              </button>
            ))}
            <label className="flex items-center gap-1 text-sm text-tinta-suave">
              otro
              <input
                type="number"
                min={1}
                max={90}
                value={descuento}
                onChange={(e) => setDescuento(Math.min(90, Math.max(1, Number(e.target.value))))}
                className="w-16 rounded-xl border border-borde px-2 py-1.5 text-base outline-none focus:border-vino"
              />
              %
            </label>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-tinta-suave">
              Productos del combo ({elegidos.length} de hasta {LIMITE})
            </span>
            <input
              className="w-40 rounded-xl border border-borde px-3 py-1.5 text-base outline-none focus:border-vino"
              placeholder="Buscar…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {/* La lista entra en una caja con scroll: son 24 productos y el
              resto del formulario tiene que seguir a la vista. */}
          <ul className="mt-2 max-h-64 overflow-y-auto rounded-chico border border-borde">
            {disponibles.map((p) => {
              const puesto = elegidos.indexOf(p.id);
              return (
                <li key={p.id} className="border-b border-borde last:border-b-0">
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-crema">
                    <input
                      type="checkbox"
                      checked={puesto >= 0}
                      onChange={() => alternar(p.id)}
                      className="size-5 shrink-0 accent-[var(--color-vino)]"
                    />
                    {urlFoto(p.foto) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={urlFoto(p.foto)!} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="size-9 shrink-0 rounded-lg bg-vino-suave" />
                    )}
                    <span className="min-w-0 flex-1 text-base text-tinta">
                      <span className="font-semibold">{p.marca}</span> {p.producto}
                      {p.medida && <span className="text-tinta-suave"> · {p.medida}</span>}
                    </span>
                    <span className="shrink-0 text-sm text-tinta-suave tabular-nums">
                      {formatearPrecio(p.precio_venta)}
                    </span>
                    {/* El numerito dice en que orden van los pasos en la
                        web: 1 limpiar, 2 tratar, 3 proteger. */}
                    {puesto >= 0 && (
                      <span className="shrink-0 rounded-full bg-vino px-2 py-0.5 text-xs font-bold text-white">
                        {puesto + 1}
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
            {disponibles.length === 0 && (
              <li className="px-3 py-3 text-sm text-tinta-suave">
                No hay productos publicados que coincidan.
              </li>
            )}
          </ul>
        </div>

        {/* La cuenta, antes de guardar: lo que va a ver la clienta y lo
            que le queda a Valen. */}
        <div className="mt-4 rounded-chico bg-crema p-3">
          {lista.length < 2 ? (
            <p className="text-sm text-tinta-suave">Elegí al menos dos productos para ver el precio.</p>
          ) : (
            <p className="text-sm text-tinta-suave tabular-nums">
              Por separado {formatearPrecio(n.suma)} · el combo sale{" "}
              <span className="font-semibold text-tinta">{formatearPrecio(n.precio)}</span> · la clienta
              ahorra <span className="font-semibold text-positivo">{formatearPrecio(n.ahorro)}</span>
              {n.margen != null && (
                <span className={n.margen >= 50 ? " text-positivo" : n.margen >= 0 ? "" : " text-negativo"}>
                  {" "}· te queda {n.margen}% de margen
                </span>
              )}
            </p>
          )}
        </div>

        <label className="mt-3 flex items-center gap-2 text-base text-tinta">
          <input
            type="checkbox"
            checked={publicado}
            onChange={(e) => setPublicado(e.target.checked)}
            className="size-5 accent-[var(--color-vino)]"
          />
          Mostrarlo en la web
        </label>

        {error && <p className="mt-3 text-sm text-negativo">{error}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={guardar} disabled={guardando} className="boton-principal disabled:opacity-60">
            {guardando ? "Guardando…" : "Guardar combo"}
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full border border-borde px-4 py-2 text-base text-tinta transition-colors hover:border-vino"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
