"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PRODUCTOS, type Producto } from "@/lib/productos";

/**
 * El pedido que arma la clienta antes de escribirle a Valen.
 *
 * NO ES UN CARRITO DE COMPRA: no hay pago, no hay stock ni reserva. Es
 * una lista que se arma tocando, y que al final se convierte en UN
 * mensaje de WhatsApp con todo junto. Antes cada producto abria su
 * propio chat, asi que llevarse tres cosas eran tres conversaciones que
 * Valen tenia que juntar a mano.
 *
 * SE GUARDA EN EL NAVEGADOR
 * La clienta arma el pedido en la portada, entra al catalogo, vuelve: si
 * el pedido no sobrevive a eso, no sirve para nada. Se guarda en
 * localStorage, que vive en SU telefono y no viaja a ningun lado.
 *
 * Solo se guardan `id` y `cantidad`, nunca el precio ni el nombre. Si se
 * guardara el precio, un pedido viejo mostraria el numero de la semana
 * pasada; asi, los datos siempre salen del catalogo de ahora.
 */

const CLAVE = "pcv-pedido";

export type Linea = { id: string; cantidad: number };

/** Lo que acaba de entrar al pedido, para el aviso de abajo. */
export type Aviso = {
  nombre: string;
  /* Cambia en cada toque: dos "Agregar" seguidos al mismo producto
     tienen que reiniciar el aviso, no dejarlo como estaba. */
  vez: number;
};

type Carrito = {
  lineas: Linea[];
  /** Las lineas con el producto resuelto y el subtotal, listas para mostrar. */
  detalle: { producto: Producto; cantidad: number; subtotal: number }[];
  unidades: number;
  total: number;
  /** Cuantas unidades hay de un producto. 0 si no esta. */
  cantidadDe: (id: string) => number;
  agregar: (id: string) => void;
  quitar: (id: string) => void;
  poner: (id: string, cantidad: number) => void;
  vaciar: () => void;
  /* El panel se abre desde el encabezado y se cierra desde adentro, asi
     que el estado no puede vivir en ninguno de los dos. */
  abierto: boolean;
  abrir: () => void;
  cerrar: () => void;
  /*
    EL AVISO DE "AGREGASTE AL PEDIDO".

    Va aparte de `agregar` a proposito: el "+" del pedido abierto o el
    de una ficha que ya estaba sumada no tienen que avisar nada, porque
    la clienta esta mirando el numero que cambio. Avisa solo el primer
    "Agregar" de una ficha y el boton del combo.
  */
  aviso: Aviso | null;
  avisar: (nombre: string) => void;
  cerrarAviso: () => void;
  /** Ya se leyo lo guardado. Antes de esto no hay que dibujar numeros. */
  listo: boolean;
};

const Contexto = createContext<Carrito | null>(null);

export function CarritoProvider({
  children,
  catalogo = PRODUCTOS,
}: {
  children: React.ReactNode;
  /*
    EL CATALOGO LLEGA DESDE EL SERVIDOR.

    Antes se leia PRODUCTOS directo de lib/productos.ts, y eso alcanzaba
    mientras el catalogo vivia en el codigo. Ahora los productos los
    carga Valen en la base, asi que el que vale es el que baja armado
    desde el layout: si no, un producto que ella agrego no se podria
    poner en el pedido, y uno que saco seguiria sumando al total.

    El valor por defecto es el del codigo, por lo mismo que en todo el
    resto: si algo falla, el carrito anda con los de siempre en vez de
    quedarse vacio.
  */
  catalogo?: Producto[];
}) {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [listo, setListo] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  /*
    Se lee DESPUES del primer dibujo y no durante.

    El servidor no tiene localStorage, asi que si el primer render del
    navegador ya trajera el pedido guardado, React encontraria un HTML
    distinto al que mando el servidor y tiraria todo abajo. Arranca
    vacio en los dos lados y el pedido entra en el efecto.
  */
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado) {
        const leidas = JSON.parse(guardado) as Linea[];
        /* Se filtra contra el catalogo de ahora: un producto que Valen
           saco no puede quedar en el pedido de alguien que lo cargo la
           semana pasada. */
        setLineas(
          leidas.filter(
            (l) =>
              l.cantidad > 0 && catalogo.some((p) => p.id === l.id && !p.borrador)
          )
        );
      }
    } catch {
      /* Modo incognito o almacenamiento bloqueado: se sigue sin guardar. */
    }
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(lineas));
    } catch {
      /* Si no se puede guardar, el pedido igual funciona en esta visita. */
    }
  }, [lineas, listo]);

  const poner = useCallback((id: string, cantidad: number) => {
    setLineas((antes) => {
      if (cantidad <= 0) return antes.filter((l) => l.id !== id);
      if (antes.some((l) => l.id === id)) {
        return antes.map((l) => (l.id === id ? { ...l, cantidad } : l));
      }
      return [...antes, { id, cantidad }];
    });
  }, []);

  const agregar = useCallback(
    (id: string) =>
      setLineas((antes) =>
        antes.some((l) => l.id === id)
          ? antes.map((l) =>
              l.id === id ? { ...l, cantidad: l.cantidad + 1 } : l
            )
          : [...antes, { id, cantidad: 1 }]
      ),
    []
  );

  /*
    Sumar y restar van por el actualizador de estado y NO leyendo la
    cantidad de afuera.

    Con `poner(id, cantidad + 1)`, dos toques rapidos al "+" calculaban
    los dos sobre la misma cantidad —la del render anterior, que todavia
    no se habia actualizado— y la segunda pisaba a la primera: se tocaba
    dos veces y subia uno solo. Medido en el panel antes de cambiarlo.
  */
  const quitar = useCallback(
    (id: string) =>
      setLineas((antes) =>
        antes.flatMap((l) =>
          l.id !== id ? [l] : l.cantidad > 1 ? [{ ...l, cantidad: l.cantidad - 1 }] : []
        )
      ),
    []
  );

  const vaciar = useCallback(() => setLineas([]), []);
  /* Abrir el pedido saca el aviso: ya se esta viendo lo que anunciaba. */
  const abrir = useCallback(() => {
    setAbierto(true);
    setAviso(null);
  }, []);
  const cerrar = useCallback(() => setAbierto(false), []);
  const avisar = useCallback(
    (nombre: string) => setAviso((antes) => ({ nombre, vez: (antes?.vez ?? 0) + 1 })),
    []
  );
  const cerrarAviso = useCallback(() => setAviso(null), []);

  const valor = useMemo<Carrito>(() => {
    const detalle = lineas.flatMap((l) => {
      const producto = catalogo.find((p) => p.id === l.id);
      if (!producto) return [];
      return [
        {
          producto,
          cantidad: l.cantidad,
          subtotal: producto.precio * l.cantidad,
        },
      ];
    });

    return {
      lineas,
      detalle,
      unidades: lineas.reduce((n, l) => n + l.cantidad, 0),
      total: detalle.reduce((n, d) => n + d.subtotal, 0),
      cantidadDe: (id) => lineas.find((l) => l.id === id)?.cantidad ?? 0,
      agregar,
      quitar,
      poner,
      vaciar,
      listo,
      abierto,
      abrir,
      cerrar,
      aviso,
      avisar,
      cerrarAviso,
    };
  }, [lineas, agregar, quitar, poner, vaciar, listo, abierto, abrir, cerrar, aviso, avisar, cerrarAviso]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCarrito() {
  const carrito = useContext(Contexto);
  if (!carrito) {
    throw new Error("useCarrito necesita estar dentro de <CarritoProvider>");
  }
  return carrito;
}
