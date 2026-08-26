/**
 * Bajar hasta el paso siguiente, pero solo si hace falta.
 *
 * En celular cada paso de la reserva queda fuera de pantalla: la clienta
 * toca, no pasa nada visible, y se queda esperando. En PC el paso
 * siguiente suele estar ya a la vista, y ahi mover la pagina es peor que
 * no hacer nada — parece que se movio sola.
 *
 * Por eso se mira donde ARRANCA el destino y no si entra entero: el
 * calendario es mas alto que muchas pantallas, y pidiendo que entre
 * completo terminaba saltando siempre, tambien en PC.
 */
export function bajarA(
  nodo: HTMLElement | null,
  margen = 150,
  /**
   * Mover la pagina solo cuando los pasos van uno abajo del otro.
   *
   * De 1024px para arriba la reserva se abre en dos columnas —los pasos
   * 1 y 2 a la izquierda, el resumen fijo a la derecha— justamente para
   * que se vea todo junto sin saltar. Ahi bajar hace daño: el panel de
   * la derecha solo puede viajar lo que mide su columna, y con dos
   * saltos seguidos se pasa de largo y el boton de confirmar desaparece
   * justo cuando hace falta.
   */
  soloApilado = false
) {
  if (!nodo) return;
  if (soloApilado && window.matchMedia("(min-width: 1024px)").matches) return;

  requestAnimationFrame(() => {
    const arranque = nodo.getBoundingClientRect().top;

    /*
      Solo baja, nunca sube. Cubre los dos casos en los que mover la
      pagina esta de mas:

        - el destino ya esta a la vista (arranque entre 0 y el margen);
        - el destino quedo por ARRIBA (arranque negativo), que en PC pasa
          con el paso 3: vive en la columna pegajosa del costado y ya se
          ve, asi que llevarlo al tope daba un salto de medio scroll
          hacia atras, como si la pagina se hubiera movido sola.
    */
    if (arranque < margen) return;

    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nodo.scrollIntoView({
      behavior: suave ? "smooth" : "auto",
      block: "start",
    });
  });
}
