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
  /** Ya se leyo lo guardado. Antes de esto no hay que dibujar numeros. */
  listo: boolean;
};

const Contexto = createContext<Carrito | null>(null);

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [listo, setListo] = useState(false);

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
              l.cantidad > 0 && PRODUCTOS.some((p) => p.id === l.id && !p.borrador)
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

  const valor = useMemo<Carrito>(() => {
    const detalle = lineas.flatMap((l) => {
      const producto = PRODUCTOS.find((p) => p.id === l.id);
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
    };
  }, [lineas, agregar, quitar, poner, vaciar, listo]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCarrito() {
  const carrito = useContext(Contexto);
  if (!carrito) {
    throw new Error("useCarrito necesita estar dentro de <CarritoProvider>");
  }
  return carrito;
}
