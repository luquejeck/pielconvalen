/*
  LOS CODIGOS CORTOS: el P-4K7M de los pedidos y el G-4K7M9P de las
  giftcards.

  Sin los caracteres que se confunden al leerlos en voz alta o en un
  telefono (0 y O, 1, I y L). Los arma el navegador porque tienen que ir
  adentro del mensaje de WhatsApp, que se abre en el mismo toque (ver
  app/api/pedidos/route.ts).
*/
const LETRAS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function codigoAlAzar(prefijo: string, largo: number): string {
  const n = new Uint32Array(largo);
  crypto.getRandomValues(n);
  return `${prefijo}-${Array.from(n, (x) => LETRAS[x % LETRAS.length]).join("")}`;
}
