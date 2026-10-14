"use client";

import { useRef, type ReactNode } from "react";

/**
 * Una tarjeta que se inclina siguiendo el mouse, como si se la tuviera en
 * la mano: la giftcard grande de /giftcard y la que abre quien la recibe.
 *
 * TRES CAPAS ENCIMA DE LA TARJETA, todas en globals.css (`.tarjeta3d`):
 *   - el brillo: una luz que sigue al puntero, como el reflejo de una
 *     lampara sobre un papel metalizado
 *   - el tornasol: un velo crema y rosa que corre al inclinarla. Nada de
 *     arco iris: los colores son los de la casa, diluidos
 *   - la textura: un grano muy fino, para que el vino se lea como papel
 *     y no como pantalla
 *
 * QUIETA, TAMBIEN SE MUEVE. En el celular no hay mouse, asi que la
 * tarjeta se mece sola, despacio, y el brillo la recorre. Al tocarla o
 * pasarle el mouse, deja de mecerse y sigue al puntero.
 *
 * Con "reducir movimiento" no se inclina ni se mece: quedan la textura y
 * un brillo fijo.
 *
 * El movimiento se escribe en variables CSS dentro de un
 * requestAnimationFrame, sin pasar por React: son decenas de cambios por
 * segundo y no hace falta volver a dibujar nada.
 */
export default function Tarjeta3D({
  children,
  quieta = false,
  className = "",
}: {
  children: ReactNode;
  /** Usada o vencida: no invita a jugar con ella. */
  quieta?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cuadro = useRef(0);

  const mover = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || quieta) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - left) / width, 0), 1);
    const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);
    cancelAnimationFrame(cuadro.current);
    cuadro.current = requestAnimationFrame(() => {
      el.dataset.activa = "";
      /* Hasta 12 grados para cada lado: mas, y la tarjeta parece que se cae. */
      el.style.setProperty("--rx", `${(0.5 - y) * 24}deg`);
      el.style.setProperty("--ry", `${(x - 0.5) * 24}deg`);
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
    });
  };

  const soltar = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(cuadro.current);
    delete el.dataset.activa;
    for (const v of ["--rx", "--ry", "--mx", "--my"]) el.style.removeProperty(v);
  };

  return (
    <div
      className={`tarjeta3d ${className}`}
      data-quieta={quieta ? "" : undefined}
      onPointerMove={mover}
      onPointerLeave={soltar}
      onPointerCancel={soltar}
    >
      <div ref={ref} className="tarjeta3d-cuerpo">
        {children}
        <span aria-hidden className="tarjeta3d-luz">
          <span className="tarjeta3d-tornasol" />
          <span className="tarjeta3d-textura" />
          <span className="tarjeta3d-brillo" />
        </span>
      </div>
    </div>
  );
}
