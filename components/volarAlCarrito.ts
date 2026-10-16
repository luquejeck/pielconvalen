/**
 * La foto del producto vuela hasta el pedido del encabezado.
 *
 * Es la confirmacion que se ve sin leer: la clienta toca "Agregar" y ve
 * el producto irse arriba a la derecha, donde despues lo va a buscar. El
 * aviso de abajo (AvisoPedido) sigue diciendolo con palabras.
 *
 * Va al costado izquierdo del grupo de botones del encabezado
 * (`data-destino-carrito`), que es donde aparece la bolsa: con el pedido
 * vacio la bolsa todavia no existe, y apuntarle a ella dejaria el primer
 * agregado sin vuelo.
 */
export function volarAlCarrito(desde: HTMLElement) {
  if (
    typeof window === "undefined" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const foto = desde.closest("li, article")?.querySelector("img");
  const destino = document.querySelector("[data-destino-carrito]");
  if (!foto || !destino || typeof foto.animate !== "function") return;

  const origen = foto.getBoundingClientRect();
  const final = destino.getBoundingClientRect();
  if (origen.width === 0) return;

  const copia = foto.cloneNode() as HTMLImageElement;
  copia.removeAttribute("srcset");
  copia.src = foto.currentSrc || foto.src;
  copia.alt = "";
  copia.setAttribute("aria-hidden", "true");
  Object.assign(copia.style, {
    position: "fixed",
    left: `${origen.left}px`,
    top: `${origen.top}px`,
    width: `${origen.width}px`,
    height: `${origen.height}px`,
    margin: "0",
    zIndex: "60",
    borderRadius: "1rem",
    objectFit: "cover",
    pointerEvents: "none",
    boxShadow: "0 12px 30px -10px rgb(30 16 21 / 0.45)",
  });
  document.body.appendChild(copia);

  const dx = final.left + 20 - (origen.left + origen.width / 2);
  const dy = final.top + final.height / 2 - (origen.top + origen.height / 2);

  copia
    .animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        // Primero sube un poco: una curva se sigue con la vista, una recta no.
        {
          transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 60}px) scale(0.55)`,
          opacity: 1,
          offset: 0.4,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0.4 },
      ],
      { duration: 750, easing: "cubic-bezier(0.45, 0, 0.3, 1)" },
    )
    .finished.catch(() => {})
    .finally(() => copia.remove());
}
