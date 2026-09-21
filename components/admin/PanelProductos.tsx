"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { URL_SUPABASE } from "@/lib/supabase";
import { formatearPrecio } from "@/lib/tratamientos";

/**
 * El control de productos de Valen.
 *
 * Contesta tres preguntas que antes no tenian donde contestarse:
 *
 *   ¿QUE TENGO?      stock por producto, y cuanta plata hay ahi parada
 *   ¿QUE SE VE?      publicar y despublicar sin tocar el codigo
 *   ¿QUE ME DEJA?    ganancia por producto, con ventas de verdad
 *
 * EL COSTO SE MUESTRA EN LAS DOS MONEDAS. Valen le paga al proveedor en
 * dolares y cobra en pesos. El de dolares es el que no envejece; el de
 * pesos es el que entra al flujo de caja. Mostrar uno solo obliga a
 * hacer la cuenta de cabeza justo cuando hay que decidir un precio.
 */

type Producto = {
  id: string;
  codigo: string | null;
  marca: string;
  producto: string;
  categoria: string | null;
  medida: string | null;
  descripcion: string;
  beneficios: string[] | null;
  foto: string | null;
  costo: number;
  costo_usd: number | null;
  precio_venta: number;
  precio_anterior: number | null;
  cantidad: number;
  publicado: boolean;
  destacado: boolean;
  orden: number;
};

type Movimiento = {
  id: string;
  fecha: string;
  tipo: string;
  monto: number;
  costo: number | null;
  costo_usd: number | null;
  unidades: number | null;
  inventario_id: string | null;
  producto_nombre: string | null;
};

const CATEGORIAS = [
  "Limpiadores",
  "Tónicos",
  "Sérums",
  "Mascarillas",
  "Cremas",
  "Contorno de ojos",
  "Protector solar",
];

const usd = (n: number | null | undefined) =>
  n == null ? "—" : `u$s ${Number(n).toFixed(2)}`;

/**
 * La URL de la foto, venga del repo o del bucket.
 *
 * Mismo criterio que `fotoDe()` en lib/productos.ts: con barra adelante
 * es un archivo del repo, sin barra es algo que subio Valen al bucket.
 */
const urlFoto = (foto: string | null) =>
  !foto ? null : foto.startsWith("/") ? foto : `${URL_SUPABASE}/storage/v1/object/public/casos/${foto}`;

/**
 * El margen sobre el costo, o null si no se puede calcular.
 *
 * Devuelve null y NO cero cuando falta el costo: un cero diria que no
 * gana nada, y lo que pasa es que todavia no se sabe. Son dos cosas
 * distintas y la pantalla las pinta distinto.
 */
function margenDe(p: Producto): number | null {
  if (!p.precio_venta || !p.costo) return null;
  return Math.round((p.precio_venta / p.costo - 1) * 100);
}

const claseMargen = (m: number | null) =>
  m == null ? "text-tinta-suave" : m < 40 ? "text-negativo" : "text-positivo";

export default function PanelProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"inventario" | "ganancia">("inventario");
  const [filtro, setFiltro] = useState<"todos" | "publicados" | "borrador" | "sin-stock">("todos");
  const [editando, setEditando] = useState<Producto | null>(null);
  const [creando, setCreando] = useState(false);
  const [cotizacion, setCotizacion] = useState<number | null>(null);

  const traer = useCallback(async () => {
    setError("");
    try {
      const [rp, rm, rc] = await Promise.all([
        fetch("/api/inventario"),
        fetch("/api/movimientos"),
        fetch("/api/configuracion"),
      ]);
      if (!rp.ok) throw new Error("No se pudo traer el inventario");
      setProductos(await rp.json());
      /* Los movimientos son para la pestaña de ganancia. Si fallan, el
         inventario igual se muestra: son dos cosas independientes. */
      if (rm.ok) setMovimientos(await rm.json());
      /* La cotizacion es para mostrar cuanto sale en pesos una compra
         antes de confirmarla. El servidor la vuelve a leer al guardar,
         asi que si esto falla la cuenta igual queda bien. */
      if (rc.ok) {
        const cfg = await rc.json();
        setCotizacion(cfg.cotizacion_usd ? Number(cfg.cotizacion_usd) : null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo fallo");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    traer();
  }, [traer]);

  const visibles = useMemo(() => {
    const lista = productos.filter((p) =>
      filtro === "publicados" ? p.publicado
      : filtro === "borrador" ? !p.publicado
      : filtro === "sin-stock" ? p.cantidad === 0
      : true
    );
    return lista.sort(
      (a, b) =>
        CATEGORIAS.indexOf(a.categoria ?? "") - CATEGORIAS.indexOf(b.categoria ?? "") ||
        a.orden - b.orden ||
        a.producto.localeCompare(b.producto, "es")
    );
  }, [productos, filtro]);

  const resumen = useMemo(() => {
    const conStock = productos.filter((p) => p.cantidad > 0);
    return {
      unidades: conStock.reduce((n, p) => n + p.cantidad, 0),
      productos: conStock.length,
      invertidoUsd: conStock.reduce((n, p) => n + p.cantidad * (p.costo_usd ?? 0), 0),
      invertido: conStock.reduce((n, p) => n + p.cantidad * p.costo, 0),
      aVender: conStock.reduce((n, p) => n + p.cantidad * p.precio_venta, 0),
      publicados: productos.filter((p) => p.publicado).length,
    };
  }, [productos]);

  if (cargando) {
    return <p className="mt-6 text-base text-tinta-suave">Cargando…</p>;
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-tinta">Mis productos</h2>
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="boton-principal"
        >
          + Nuevo producto
        </button>
      </div>

      {error && <p className="mb-4 text-base text-negativo">{error}</p>}

      {/* La plata que hay parada en el deposito, que es lo primero que
          se quiere saber al abrir esta pantalla. */}
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Tarjeta titulo="En stock" valor={`${resumen.unidades} u.`} pie={`${resumen.productos} productos`} />
        <Tarjeta titulo="Invertido" valor={usd(resumen.invertidoUsd)} pie={formatearPrecio(resumen.invertido)} />
        <Tarjeta titulo="A precio de venta" valor={formatearPrecio(resumen.aVender)} pie="si se vende todo" />
        <Tarjeta
          titulo="Ganancia si vendés todo"
          valor={formatearPrecio(resumen.aVender - resumen.invertido)}
          pie={`${resumen.publicados} publicados`}
        />
      </div>

      <nav className="mb-4 -mx-5 overflow-x-auto px-5">
        <div className="segmentado" style={{ width: "max-content" }}>
          {(["inventario", "ganancia"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} data-activo={tab === t}>
              {t === "inventario" ? "Inventario" : "Ganancia"}
            </button>
          ))}
        </div>
      </nav>

      {tab === "inventario" ? (
        <>
          <div className="mb-4 -mx-5 flex gap-2 overflow-x-auto px-5">
            {([
              ["todos", `Todos ${productos.length}`],
              ["publicados", `En la web ${productos.filter((p) => p.publicado).length}`],
              ["borrador", `Ocultos ${productos.filter((p) => !p.publicado).length}`],
              ["sin-stock", `Sin stock ${productos.filter((p) => p.cantidad === 0).length}`],
            ] as const).map(([id, texto]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFiltro(id)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition-colors ${
                  filtro === id
                    ? "border-vino bg-vino text-white"
                    : "border-borde bg-papel text-tinta hover:border-vino"
                }`}
              >
                {texto}
              </button>
            ))}
          </div>

          <ul className="space-y-2">
            {visibles.map((p) => (
              <Fila key={p.id} producto={p} cotizacion={cotizacion} onEditar={() => setEditando(p)} onCambio={traer} />
            ))}
          </ul>
          {visibles.length === 0 && (
            <p className="rounded-chico border border-borde bg-papel px-5 py-6 text-center text-base text-tinta-suave">
              No hay productos con ese filtro.
            </p>
          )}
        </>
      ) : (
        <Ganancia productos={productos} movimientos={movimientos} />
      )}

      {(editando || creando) && (
        <Editor
          producto={editando}
          onCerrar={() => {
            setEditando(null);
            setCreando(false);
          }}
          onGuardado={() => {
            setEditando(null);
            setCreando(false);
            traer();
          }}
        />
      )}
    </div>
  );
}

function Tarjeta({ titulo, valor, pie }: { titulo: string; valor: string; pie: string }) {
  return (
    <div className="rounded-chico border border-borde bg-papel px-4 py-3">
      <p className="text-xs tracking-wide text-tinta-suave uppercase">{titulo}</p>
      <p className="mt-1 font-display text-xl font-semibold text-tinta tabular-nums">{valor}</p>
      <p className="text-sm text-tinta-suave">{pie}</p>
    </div>
  );
}

/** Una fila del inventario, con el stock a mano. */
function Fila({
  producto: p,
  cotizacion,
  onEditar,
  onCambio,
}: {
  producto: Producto;
  cotizacion: number | null;
  onEditar: () => void;
  onCambio: () => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [panel, setPanel] = useState<null | "reponer" | "historial" | "sumar" | "restar">(null);
  const margen = margenDe(p);
  const foto = urlFoto(p.foto);

  const alternar = (cual: NonNullable<typeof panel>) => setPanel((v) => (v === cual ? null : cual));

  /*
    El +/- es un AJUSTE: corrige el numero contra lo que hay en el
    estante, sin tocar la plata. Pide el motivo, porque es el unico
    cambio de stock que antes no dejaba rastro y el que mas importa
    entender despues. El motivo va en botones y no en un campo de texto:
    sigue siendo un toque.
  */
  const ajustar = async (unidades: number, nota: string) => {
    setOcupado(true);
    await fetch("/api/inventario/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventario_id: p.id, unidades, motivo: "ajuste", nota }),
    });
    setOcupado(false);
    setPanel(null);
    onCambio();
  };

  const publicar = async () => {
    /* Sin foto no se publica: la web mostraria el recuadro vacio. Es lo
       que paso con tres productos el 19-09-2026 y hubo que ocultarlos. */
    if (!p.publicado && !p.foto) {
      alert("Antes de mostrarlo en la web, subile una foto desde Editar.");
      return;
    }
    setOcupado(true);
    await fetch(`/api/inventario?id=${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicado: !p.publicado }),
    });
    setOcupado(false);
    onCambio();
  };

  return (
    <li className="rounded-chico border border-borde bg-papel px-3 py-3">
      <div className="flex gap-3">
        {/* La miniatura dice de un vistazo que producto no tiene foto,
            que es lo que hay que resolver antes de publicarlo. */}
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="" className="size-14 shrink-0 rounded-lg border border-borde object-cover" />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-vino/50 bg-vino-suave text-center text-[0.65rem] leading-tight text-vino">
            sin
            <br />
            foto
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-tinta-suave">{p.codigo ?? "sin código"}</p>
          <p className="text-base leading-snug text-tinta">
            <span className="font-semibold">{p.marca}</span> {p.producto}
            {p.medida && <span className="text-tinta-suave"> · {p.medida}</span>}
          </p>
          <p className="mt-0.5 text-sm text-tinta-suave tabular-nums">
            {usd(p.costo_usd)} · {formatearPrecio(p.costo)} → {formatearPrecio(p.precio_venta)}
            {margen != null ? (
              <span className={claseMargen(margen)}> · {margen}%</span>
            ) : (
              <span> · sin costo</span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-full bg-crema-oscuro">
          <button
            type="button"
            disabled={ocupado || p.cantidad === 0}
            onClick={() => alternar("restar")}
            aria-label={`Quitar una unidad de ${p.producto}`}
            className="flex size-9 items-center justify-center rounded-full text-lg text-tinta disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-8 text-center font-display font-semibold text-tinta tabular-nums">
            {p.cantidad}
          </span>
          <button
            type="button"
            disabled={ocupado}
            onClick={() => alternar("sumar")}
            aria-label={`Agregar una unidad de ${p.producto}`}
            className="flex size-9 items-center justify-center rounded-full text-lg text-tinta disabled:opacity-40"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => alternar("reponer")}
          className="rounded-full border border-vino px-3 py-1.5 text-sm text-vino transition-colors hover:bg-vino-suave"
        >
          Reponer
        </button>

        <button
          type="button"
          onClick={publicar}
          disabled={ocupado}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
            p.publicado
              ? "border-vino bg-vino-suave text-vino"
              : "border-borde text-tinta-suave hover:border-vino"
          }`}
        >
          {p.publicado ? "En la web" : "Oculto"}
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
          onClick={() => alternar("historial")}
          className="rounded-full px-2 py-1.5 text-sm text-tinta-suave underline-offset-2 hover:text-vino hover:underline"
        >
          Historial
        </button>
      </div>

      {(panel === "restar" || panel === "sumar") && (
        <Motivo
          sale={panel === "restar"}
          ocupado={ocupado}
          onElegir={(nota) => ajustar(panel === "restar" ? -1 : 1, nota)}
          onCancelar={() => setPanel(null)}
        />
      )}

      {panel === "reponer" && (
        <Reponer
          producto={p}
          cotizacion={cotizacion}
          onListo={() => {
            setPanel(null);
            onCambio();
          }}
        />
      )}

      {panel === "historial" && <Historial id={p.id} />}
    </li>
  );
}

/**
 * El por que de un ajuste, en un toque.
 *
 * Los motivos son los que explican de verdad una diferencia entre el
 * sistema y el estante. "Vendido sin registrar" va primero en la
 * salida porque es el que mas va a pasar: una venta de mostrador que no
 * se anoto. Si se usa mucho, es la señal de que falta registrar ventas.
 */
const MOTIVOS_SALE = ["Vendido sin registrar", "Se rompió o venció", "Regalo o muestra", "Recuento"];
const MOTIVOS_ENTRA = ["Recuento", "Devolución", "Me lo regalaron"];

function Motivo({
  sale,
  ocupado,
  onElegir,
  onCancelar,
}: {
  sale: boolean;
  ocupado: boolean;
  onElegir: (nota: string) => void;
  onCancelar: () => void;
}) {
  return (
    <div className="mt-3 rounded-chico border border-borde bg-crema p-3">
      <p className="text-sm font-semibold text-tinta">
        {sale ? "¿Por qué sale una unidad?" : "¿Por qué entra una unidad?"}
      </p>
      <p className="text-xs text-tinta-suave">
        {sale
          ? "Si la vendiste, mejor registrala en Caja: así queda la plata."
          : "Si la compraste, usá Reponer: así queda lo que pagaste."}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(sale ? MOTIVOS_SALE : MOTIVOS_ENTRA).map((m) => (
          <button
            key={m}
            type="button"
            disabled={ocupado}
            onClick={() => onElegir(m)}
            className="rounded-full border border-borde bg-papel px-3 py-1.5 text-sm text-tinta transition-colors hover:border-vino hover:text-vino disabled:opacity-50"
          >
            {m}
          </button>
        ))}
        <button type="button" onClick={onCancelar} className="px-2 py-1.5 text-sm text-tinta-suave">
          Cancelar
        </button>
      </div>
    </div>
  );
}

type LineaHistorial = {
  id: string;
  cantidad: number;
  motivo: "compra" | "venta" | "ajuste" | "inicial";
  nota: string | null;
  stock_resultante: number | null;
  fecha: string;
};

const ROTULO: Record<LineaHistorial["motivo"], string> = {
  compra: "Compra",
  venta: "Venta",
  ajuste: "Ajuste",
  inicial: "Recuento inicial",
};

/** Cada unidad que entro o salio de un producto, de la mas nueva a la mas vieja. */
function Historial({ id }: { id: string }) {
  const [lineas, setLineas] = useState<LineaHistorial[] | null>(null);
  const [falta, setFalta] = useState(false);

  useEffect(() => {
    let vigente = true;
    fetch(`/api/inventario/historial?id=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!vigente) return;
        setLineas(d.lineas ?? []);
        setFalta(Boolean(d.falta));
      })
      .catch(() => vigente && setLineas([]));
    return () => {
      vigente = false;
    };
  }, [id]);

  if (lineas === null) return <p className="mt-3 text-sm text-tinta-suave">Cargando historial…</p>;

  if (falta) {
    return (
      <p className="mt-3 rounded-chico bg-crema p-3 text-sm text-tinta-suave">
        El historial todavía no está activado: falta correr el SQL de schema-17.
      </p>
    );
  }

  if (lineas.length === 0) {
    return <p className="mt-3 text-sm text-tinta-suave">Todavía no hay movimientos de este producto.</p>;
  }

  return (
    <ul className="mt-3 divide-y divide-borde rounded-chico border border-borde bg-crema">
      {lineas.map((l) => (
        <li key={l.id} className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
          <div className="min-w-0">
            <span className="text-tinta-suave tabular-nums">
              {new Date(l.fecha + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}
            </span>{" "}
            <span className="text-tinta">{ROTULO[l.motivo]}</span>
            {l.nota && <span className="text-tinta-suave"> · {l.nota}</span>}
          </div>
          <div className="shrink-0 text-right tabular-nums">
            <span className={l.cantidad > 0 ? "font-semibold text-positivo" : "font-semibold text-negativo"}>
              {l.cantidad > 0 ? `+${l.cantidad}` : l.cantidad}
            </span>
            {l.stock_resultante != null && (
              <span className="text-tinta-suave"> → {l.stock_resultante}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Registrar una compra de mercaderia.
 *
 * Es la otra mitad del inventario: las ventas descuentan stock desde
 * Economia, y esto lo repone. A diferencia del +/-, deja un movimiento
 * de plata —salio dinero de la caja— con el costo en las dos monedas y
 * la cotizacion del dia, congelados.
 *
 * El costo en dolares viene cargado con el del producto, que es lo que
 * pasa casi siempre: repone al mismo precio. Si esta vez le costo
 * distinto, lo cambia y ese manda.
 */
function Reponer({
  producto: p,
  cotizacion,
  onListo,
}: {
  producto: Producto;
  cotizacion: number | null;
  onListo: () => void;
}) {
  const [unidades, setUnidades] = useState(1);
  const [costoUsd, setCostoUsd] = useState(p.costo_usd != null ? String(p.costo_usd) : "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const usdNum = costoUsd === "" ? null : Number(costoUsd);
  /* Lo mismo que calcula el servidor: dolares por la cotizacion de hoy. */
  const pesosUnidad = usdNum != null && cotizacion ? Math.round(usdNum * cotizacion) : p.costo;
  const total = pesosUnidad * unidades;

  const guardar = async () => {
    if (unidades < 1) {
      setError("Tienen que ser una o más unidades");
      return;
    }
    setGuardando(true);
    setError("");
    const r = await fetch("/api/inventario/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inventario_id: p.id,
        unidades,
        motivo: "compra",
        costo_usd_unitario: costoUsd,
      }),
    });
    setGuardando(false);
    const d = await r.json().catch(() => ({}));
    if (!r.ok && r.status !== 207) {
      setError(d.error ?? "No se pudo registrar la compra");
      return;
    }
    if (d.aviso) alert(d.aviso);
    onListo();
  };

  const campo = "mt-1 w-full rounded-xl border border-borde px-3 py-2 text-base outline-none focus:border-vino";

  return (
    <div className="mt-3 rounded-chico border border-vino/30 bg-crema p-3">
      <p className="text-sm font-semibold text-tinta">Registrar una compra</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm text-tinta-suave">Unidades</span>
          <input type="number" min={1} className={campo} value={unidades} onChange={(e) => setUnidades(Number(e.target.value))} />
        </label>
        <label className="block">
          <span className="text-sm text-tinta-suave">Costo c/u (u$s)</span>
          <input type="number" step="0.01" className={campo} value={costoUsd} onChange={(e) => setCostoUsd(e.target.value)} />
        </label>
      </div>
      <p className="mt-2 text-sm text-tinta-suave tabular-nums">
        {cotizacion ? `Al dólar de hoy ($${cotizacion.toLocaleString("es-AR")}): ` : "Total: "}
        <span className="font-semibold text-tinta">{formatearPrecio(total)}</span>
        {" "}· el stock pasa de {p.cantidad} a {p.cantidad + Math.max(0, unidades)}
      </p>
      {error && <p className="mt-2 text-sm text-negativo">{error}</p>}
      <button type="button" onClick={guardar} disabled={guardando} className="boton-principal mt-3 disabled:opacity-60">
        {guardando ? "Guardando…" : "Registrar compra"}
      </button>
    </div>
  );
}

/**
 * Cuanto dejo cada producto, con ventas de verdad.
 *
 * Sale de los movimientos que tienen `inventario_id`. Los que no lo
 * tienen son ventas viejas, de antes de que la venta guardara el
 * producto: se cuentan aparte para que el total no mienta y para que se
 * vea por que la suma no cierra con el flujo de caja.
 */
function Ganancia({
  productos,
  movimientos,
}: {
  productos: Producto[];
  movimientos: Movimiento[];
}) {
  const filas = useMemo(() => {
    const ventas = movimientos.filter((m) => m.tipo === "venta_producto");
    const porProducto = new Map<string, { nombre: string; unidades: number; vendido: number; costo: number }>();

    for (const v of ventas) {
      if (!v.inventario_id) continue;
      const p = productos.find((x) => x.id === v.inventario_id);
      const nombre = p ? `${p.marca} ${p.producto}` : v.producto_nombre ?? "Producto borrado";
      const actual = porProducto.get(v.inventario_id) ?? { nombre, unidades: 0, vendido: 0, costo: 0 };
      const unidades = v.unidades ?? 1;
      actual.unidades += unidades;
      actual.vendido += v.monto;
      actual.costo += (v.costo ?? 0) * unidades;
      porProducto.set(v.inventario_id, actual);
    }

    return [...porProducto.values()]
      .map((f) => ({ ...f, ganancia: f.vendido - f.costo }))
      .sort((a, b) => b.ganancia - a.ganancia);
  }, [movimientos, productos]);

  const sinProducto = movimientos.filter((m) => m.tipo === "venta_producto" && !m.inventario_id);
  const total = filas.reduce((n, f) => n + f.ganancia, 0);

  if (filas.length === 0) {
    return (
      <div className="rounded-chico border border-borde bg-papel px-5 py-8 text-center">
        <p className="text-base text-tinta">Todavía no hay ventas de productos registradas.</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-snug text-tinta-suave">
          Cuando cargues una venta desde Economía, acá vas a ver cuánto te dejó
          cada producto: lo que entró, lo que te costó y la diferencia.
        </p>
        {sinProducto.length > 0 && (
          <p className="mt-3 text-sm text-tinta-suave">
            Hay {sinProducto.length} {sinProducto.length === 1 ? "venta" : "ventas"} sin
            producto asociado, de antes de que se registrara cuál era.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-base">
        <thead>
          <tr className="border-b border-borde text-left text-sm text-tinta-suave">
            <th className="py-2 font-normal">Producto</th>
            <th className="py-2 text-right font-normal">U.</th>
            <th className="py-2 text-right font-normal">Vendido</th>
            <th className="py-2 text-right font-normal">Costo</th>
            <th className="py-2 text-right font-normal">Ganancia</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.nombre} className="border-b border-borde last:border-0">
              <td className="py-2 pr-3 text-tinta">{f.nombre}</td>
              <td className="py-2 text-right text-tinta-suave tabular-nums">{f.unidades}</td>
              <td className="py-2 text-right text-tinta tabular-nums">{formatearPrecio(f.vendido)}</td>
              <td className="py-2 text-right text-tinta-suave tabular-nums">{formatearPrecio(f.costo)}</td>
              <td className="py-2 text-right font-semibold text-positivo tabular-nums">
                {formatearPrecio(f.ganancia)}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-borde">
            <td className="py-2 font-semibold text-tinta" colSpan={4}>
              Total
            </td>
            <td className="py-2 text-right font-semibold text-tinta tabular-nums">
              {formatearPrecio(total)}
            </td>
          </tr>
        </tbody>
      </table>

      {sinProducto.length > 0 && (
        <p className="mt-3 text-sm leading-snug text-tinta-suave">
          Hay {sinProducto.length} {sinProducto.length === 1 ? "venta" : "ventas"} sin
          producto asociado, de antes de que se registrara cuál era. No están en
          este total, así que no va a coincidir con el de Economía.
        </p>
      )}
    </div>
  );
}

/** El formulario de alta y edicion. */
function Editor({
  producto,
  onCerrar,
  onGuardado,
}: {
  producto: Producto | null;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const vacio = {
    codigo: "",
    marca: "",
    producto: "",
    categoria: CATEGORIAS[0],
    medida: "",
    descripcion: "",
    beneficios: "",
    costo_usd: "",
    costo: 0,
    precio_venta: 0,
    cantidad: 0,
    publicado: false,
    destacado: false,
    orden: 0,
    foto: "",
  };

  const [f, setF] = useState(
    producto
      ? {
          codigo: producto.codigo ?? "",
          marca: producto.marca,
          producto: producto.producto,
          categoria: producto.categoria ?? CATEGORIAS[0],
          medida: producto.medida ?? "",
          descripcion: producto.descripcion ?? "",
          beneficios: (producto.beneficios ?? []).join(", "),
          costo_usd: producto.costo_usd == null ? "" : String(producto.costo_usd),
          costo: producto.costo,
          precio_venta: producto.precio_venta,
          cantidad: producto.cantidad,
          publicado: producto.publicado,
          destacado: producto.destacado,
          orden: producto.orden,
          foto: producto.foto ?? "",
        }
      : vacio
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  /* La foto elegida y todavia no subida. Se sube al guardar, despues
     del producto, porque para subirla hace falta su id. */
  const [archivo, setArchivo] = useState<File | null>(null);
  const vistaPrevia = useMemo(() => (archivo ? URL.createObjectURL(archivo) : null), [archivo]);
  useEffect(() => () => { if (vistaPrevia) URL.revokeObjectURL(vistaPrevia); }, [vistaPrevia]);

  const guardar = async () => {
    if (!f.marca.trim() || !f.producto.trim()) {
      setError("Falta la marca o el nombre");
      return;
    }
    setGuardando(true);
    setError("");
    const cuerpo = {
      ...f,
      /* Los beneficios se escriben separados por coma, que es como los
         dicta cualquiera, y se guardan como lista. */
      beneficios: f.beneficios.split(",").map((s) => s.trim()).filter(Boolean),
    };
    const r = producto
      ? await fetch(`/api/inventario?id=${producto.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cuerpo),
        })
      : await fetch("/api/inventario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cuerpo),
        });
    if (!r.ok) {
      setGuardando(false);
      const d = await r.json().catch(() => ({}));
      setError(d.error ?? "No se pudo guardar");
      return;
    }

    /*
      La foto va despues, con el id que devolvio el guardado. Si el
      producto es nuevo, recien ahora existe. Si falla la foto, el
      producto ya quedo guardado: se avisa y se deja el editor abierto
      para reintentar, en vez de perder lo que se cargo.
    */
    if (archivo) {
      const guardado = await r.json().catch(() => null);
      const id = producto?.id ?? guardado?.id;
      if (id) {
        const datos = new FormData();
        datos.append("inventario_id", id);
        datos.append("foto", archivo);
        const rf = await fetch("/api/inventario/foto", { method: "POST", body: datos });
        if (!rf.ok) {
          setGuardando(false);
          const d = await rf.json().catch(() => ({}));
          setError(`El producto se guardó, pero la foto no: ${d.error ?? "probá de nuevo"}`);
          return;
        }
      }
    }

    setGuardando(false);
    onGuardado();
  };

  const borrar = async () => {
    if (!producto) return;
    if (!confirm(`¿Borrar ${producto.marca} ${producto.producto}? Las ventas que ya hiciste no se borran.`)) return;
    setGuardando(true);
    await fetch(`/api/inventario?id=${producto.id}`, { method: "DELETE" });
    onGuardado();
  };

  const campo = "mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 bg-tinta/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={producto ? "Editar producto" : "Nuevo producto"}
        className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-y-auto rounded-t-suave bg-crema p-5 sm:rounded-suave"
      >
        <h3 className="mb-4 font-display text-lg font-semibold text-tinta">
          {producto ? "Editar producto" : "Nuevo producto"}
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-tinta-suave">Marca</span>
            <input className={campo} value={f.marca} onChange={(e) => setF({ ...f, marca: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm text-tinta-suave">Producto</span>
            <input className={campo} value={f.producto} onChange={(e) => setF({ ...f, producto: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm text-tinta-suave">
              Código {!producto && <span className="text-tinta-suave">(se arma solo si lo dejás vacío)</span>}
            </span>
            <input className={campo} value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm text-tinta-suave">Medida</span>
            <input className={campo} placeholder="50 ml" value={f.medida} onChange={(e) => setF({ ...f, medida: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm text-tinta-suave">Categoría</span>
            <select className={campo} value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-tinta-suave">Unidades en stock</span>
            <input type="number" className={campo} value={f.cantidad} onChange={(e) => setF({ ...f, cantidad: Number(e.target.value) })} />
          </label>

          <label className="block">
            <span className="text-sm text-tinta-suave">Costo en dólares</span>
            <input
              type="number"
              step="0.01"
              className={campo}
              placeholder="vacío = sin cargar"
              value={f.costo_usd}
              onChange={(e) => setF({ ...f, costo_usd: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm text-tinta-suave">Costo en pesos</span>
            <input type="number" className={campo} value={f.costo} onChange={(e) => setF({ ...f, costo: Number(e.target.value) })} />
          </label>
          <label className="block">
            <span className="text-sm text-tinta-suave">Precio de venta</span>
            <input type="number" className={campo} value={f.precio_venta} onChange={(e) => setF({ ...f, precio_venta: Number(e.target.value) })} />
          </label>
          <label className="block">
            <span className="text-sm text-tinta-suave">Orden en su categoría</span>
            <input type="number" className={campo} value={f.orden} onChange={(e) => setF({ ...f, orden: Number(e.target.value) })} />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm text-tinta-suave">Descripción</span>
            <textarea rows={2} className={campo} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm text-tinta-suave">Beneficios, separados por coma</span>
            <input className={campo} placeholder="Poros, Uso diario" value={f.beneficios} onChange={(e) => setF({ ...f, beneficios: e.target.value })} />
          </label>
          {/*
            LA FOTO SE SUBE, NO SE ESCRIBE.

            Antes era un campo de texto donde habia que pegar una ruta del
            repo: ponerle imagen a un producto nuevo pedia un programador
            y un deploy. Ahora se elige desde el celular y el servidor la
            deja cuadrada y liviana, igual que las del catalogo.
          */}
          <div className="sm:col-span-2">
            <span className="text-sm text-tinta-suave">Foto</span>
            <div className="mt-1 flex items-center gap-3">
              {vistaPrevia || urlFoto(f.foto) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vistaPrevia ?? urlFoto(f.foto) ?? ""}
                  alt=""
                  className="size-20 shrink-0 rounded-lg border border-borde object-cover"
                />
              ) : (
                <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-vino/50 bg-vino-suave text-xs text-vino">
                  sin foto
                </div>
              )}
              <label className="cursor-pointer rounded-full border border-vino px-4 py-2 text-sm text-vino transition-colors hover:bg-vino-suave">
                {vistaPrevia || f.foto ? "Cambiar foto" : "Subir foto"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  className="sr-only"
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            {archivo && (
              <p className="mt-1 text-sm text-tinta-suave">
                Se sube al guardar. Queda cuadrada y liviana, como las demás.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-base text-tinta">
            <input type="checkbox" checked={f.publicado} onChange={(e) => setF({ ...f, publicado: e.target.checked })} />
            Mostrar en la web
          </label>
          <label className="flex items-center gap-2 text-base text-tinta">
            <input type="checkbox" checked={f.destacado} onChange={(e) => setF({ ...f, destacado: e.target.checked })} />
            Destacado en la portada
          </label>
        </div>

        {error && <p className="mt-3 text-base text-negativo">{error}</p>}

        <div className="mt-5 flex items-center justify-between gap-3">
          {producto ? (
            <button type="button" onClick={borrar} className="text-base text-negativo">
              Borrar
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onCerrar} className="rounded-full border border-borde px-5 py-2 text-base text-tinta">
              Cancelar
            </button>
            <button type="button" onClick={guardar} disabled={guardando} className="boton-principal disabled:opacity-60">
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
