"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Una tarjeta que se inclina siguiendo el mouse, como si se la tuviera en
 * la mano: la giftcard grande de /giftcard y la que abre quien la recibe.
 *
 * TRES CAPAS ENCIMA DE LA TARJETA, todas en globals.css (`.tarjeta3d`):
 *   - el brillo: una luz que sigue al puntero, como el reflejo de una
 *     lampara sobre un papel metalizado
 *   - el tornasol: un velo crema y rosa que corre al inclinarla. Nada de
 *     arco iris: los colores son los de la casa, diluidos
 *   - la textura: un grano muy fino, para que el papel se lea como papel
 *     y no como pantalla
 *
 * QUIETA, TAMBIEN SE MUEVE. En el celular no hay mouse, asi que la
 * tarjeta se mece sola, despacio, y el brillo la recorre. Al tocarla o
 * pasarle el mouse, deja de mecerse y sigue al puntero.
 *
 * CON `dorso`, LLEGA DE ESPALDAS: es la sorpresa de quien la recibe. Al
 * tocarla se da vuelta con un rebote y salen unos destellos. Antes se
 * probo un envoltorio con moño que se abria, y no gusto (Lucas,
 * 14-10-2026): darla vuelta es el mismo gesto de la giftcard de la
 * portada.
 *
 * Con "reducir movimiento" no se inclina, no se mece y no hay destellos:
 * se da vuelta sin animacion, y quedan la textura y un brillo fijo.
 *
 * El movimiento se escribe en variables CSS dentro de un
 * requestAnimationFrame, sin pasar por React: son decenas de cambios por
 * segundo y no hace falta volver a dibujar nada.
 */

type Destello = { id: number; estilo: CSSProperties };

const COLORES = ["#ffffff", "#faf5f6", "#f7c8dc", "#e9b7c9"];

/** Unas chispas que salen del centro hacia afuera, cada una a su ritmo. */
function armarDestellos(): Destello[] {
  return Array.from({ length: 24 }, (_, i) => {
    const angulo = Math.random() * Math.PI * 2;
    const distancia = 90 + Math.random() * 140;
    return {
      id: i,
      estilo: {
        left: `${50 + Math.cos(angulo) * 18}%`,
        top: `${50 + Math.sin(angulo) * 18}%`,
        color: COLORES[i % COLORES.length],
        "--x": `${Math.cos(angulo) * distancia}px`,
        "--y": `${Math.sin(angulo) * distancia * 0.7}px`,
        "--t": `${8 + Math.random() * 12}px`,
        "--d": `${900 + Math.random() * 700}ms`,
        "--r": `${Math.random() * 250}ms`,
      } as CSSProperties,
    };
  });
}

export default function Tarjeta3D({
  children,
  dorso,
  quieta = false,
  className = "",
}: {
  children: ReactNode;
  /** La cara de atras. Con ella, la tarjeta llega dada vuelta. */
  dorso?: ReactNode;
  /** Usada o vencida: no invita a jugar con ella. */
  quieta?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cuadro = useRef(0);
  const [deEspaldas, setDeEspaldas] = useState(Boolean(dorso));
  const [destellos, setDestellos] = useState<Destello[]>([]);

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

  const darVuelta = () => {
    setDeEspaldas(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    /* Los destellos salen cuando el frente ya esta casi de cara. */
    setTimeout(() => setDestellos(armarDestellos()), 650);
    setTimeout(() => setDestellos([]), 2900);
  };

  return (
    <div
      className={`tarjeta3d ${className}`}
      data-quieta={quieta ? "" : undefined}
      onPointerMove={mover}
      onPointerLeave={soltar}
      onPointerCancel={soltar}
      onPointerUp={(e) => e.pointerType !== "mouse" && soltar()}
    >
      <div ref={ref} className="tarjeta3d-cuerpo">
        <div className="tarjeta3d-volteo" data-espalda={deEspaldas ? "" : undefined}>
          {/* Mientras esta de espaldas, el frente no existe para el lector
              de pantalla: se anuncia el boton de darla vuelta. */}
          <div className="tarjeta3d-cara relative" aria-hidden={deEspaldas || undefined}>
            {children}
            <span aria-hidden className="tarjeta3d-luz">
              <span className="tarjeta3d-tornasol" />
              <span className="tarjeta3d-textura" />
              <span className="tarjeta3d-brillo" />
            </span>
          </div>
          {dorso && (
            <button
              type="button"
              onClick={darVuelta}
              disabled={!deEspaldas}
              aria-hidden={!deEspaldas || undefined}
              aria-label="Dar vuelta la giftcard"
              className="tarjeta3d-cara tarjeta3d-dorso"
            >
              {dorso}
            </button>
          )}
        </div>
      </div>
      {destellos.length > 0 && (
        <span aria-hidden className="tarjeta3d-destellos">
          {destellos.map((d) => (
            <span key={d.id} className="tarjeta3d-destello" style={d.estilo}>
              <svg viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 0c.6 6.3 5.7 11.4 12 12-6.3.6-11.4 5.7-12 12-.6-6.3-5.7-11.4-12-12C6.3 11.4 11.4 6.3 12 0z"
                />
              </svg>
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
