/**
 * Los reels de Instagram que Valen quiere mostrar en la web.
 *
 * Lo que se guarda es el link entero, tal como lo copia la aplicacion.
 * El codigo se saca al momento de mostrarlo, y por eso hay que aguantar
 * las tres formas en que Instagram lo entrega: `/reel/`, `/reels/` en
 * plural (que es lo que copia la version de escritorio) y `/p/` cuando
 * el video se publico como posteo. Ademas viene con la barra final y,
 * casi siempre, con un `?igsh=...` pegado atras.
 *
 * Pedirle a Valen que "pegue solo el codigo" seria trasladarle a ella un
 * trabajo de dos renglones de codigo.
 */
export function codigoDeReel(link: string): string | null {
  const encontrado = link
    .trim()
    .match(/instagram\.com\/(?:reels?|p)\/([A-Za-z0-9_-]+)/);

  return encontrado ? encontrado[1] : null;
}

/**
 * El embebido oficial de Instagram. No necesita clave, ni cuenta de
 * desarrollador, ni la libreria que Instagram ofrece para incrustar: es
 * una direccion que devuelve el reel listo para meter en un <iframe>.
 */
export const urlEmbebido = (codigo: string) =>
  `https://www.instagram.com/reel/${codigo}/embed/`;
