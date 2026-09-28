"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Da vuelta la giftcard de la portada cuando llega a la pantalla.
 *
 * Solo marca el momento: el giro y el brillo estan en globals.css
 * (`.giftcard-escena`). Espera a que se vea la mayor parte de la
 * tarjeta; si gira apenas asoma por el borde, nadie la ve girar.
 */
export default function GiraAlVer({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [girada, setGirada] = useState(false);

  useEffect(() => {
    const el = ref.current;
    // Sin IntersectionObserver (navegadores muy viejos) queda de frente.
    if (!el || typeof IntersectionObserver === "undefined") {
      setGirada(true);
      return;
    }
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setGirada(true);
          observador.disconnect();
        }
      },
      { threshold: 0.8 },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden
      data-girada={girada ? "" : undefined}
      className={`giftcard-escena ${className}`}
    >
      {children}
    </span>
  );
}
