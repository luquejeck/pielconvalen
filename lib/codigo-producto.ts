/**
 * El codigo con el que Valen identifica cada producto.
 *
 * Tiene forma MARCA-PRODUCTO-MEDIDA: `BOJ-GLOW-30ML`, `MDC-PDRN-55G`.
 * Se lee de un vistazo, se dicta por telefono y se escribe en la caja
 * sin tener que buscarlo en ninguna tabla, que es para lo que sirve.
 *
 * NO ES LA CLAVE DE NADA. La clave sigue siendo el `id` de la fila; el
 * codigo es un rotulo para humanos y Valen lo puede editar. Por eso se
 * genera una sola vez al crear el producto y despues no se recalcula
 * solo: si ella le cambia el nombre al producto, el codigo que ya
 * anoto en un cuaderno tiene que seguir siendo el mismo.
 *
 * LO DIFICIL SON LOS PRODUCTOS PARECIDOS.
 * Beauty of Joseon vende tres Relief Sun de 50 ml. Con la primera
 * palabra sola los tres dan `BOJ-RELI-50ML`, y resolverlo con un sufijo
 * —`-2`, `-3`— rompe justo lo que el codigo venia a dar: mirando
 * `BOJ-RELI-50ML-2` nadie sabe cual es. Por eso, cuando dos chocan,
 * cada uno se queda con su primera palabra PROPIA, la que el otro no
 * tiene:
 *
 *   BOJ-RELINIAC-50ML   Relief Sun Rice + Niacinamide
 *   BOJ-RELIAQUA-50ML   Relief Sun Aqua-fresh Rice + B5
 *   BOJ-RELIPROB-50ML   Relief Sun Rice + Probiotics
 *
 * Que es, palabra por palabra, como los distingue ella leyendo el
 * envase.
 */

export type ParaCodigo = {
  marca: string;
  nombre: string;
  medida?: string;
};

/**
 * Las marcas que Valen ya nombra abreviadas al hablar.
 *
 * Estan a mano y no salen de las iniciales porque las iniciales darian
 * cosas que nadie usa: "Beauty of Joseon" es BOJ para cualquiera que
 * venda coreana, no BEA. Una marca que no este en la lista cae en sus
 * tres primeras letras, que alcanza hasta que valga la pena sumarla.
 */
const MARCAS: Record<string, string> = {
  "Beauty of Joseon": "BOJ",
  Medicube: "MDC",
  Ariul: "ARL",
  AHC: "AHC",
  Anua: "ANU",
  "d'Alba": "ALB",
  "CICA × HYALON": "VT",
  "JM Solution": "JMS",
};

/**
 * Palabras que no distinguen nada y solo gastan lugar.
 *
 * "REAL" esta porque el AHC se llama "Time Rewind Real Eye Cream" y la
 * palabra no separa de nada. Los numeros sueltos tambien se van: el
 * "80" de Heartleaf 80 o el "100" del Reedle Shot 100 ya viajan en la
 * medida o no aportan.
 */
const VACIAS = new Set([
  "DE", "DEL", "LA", "EL", "Y", "THE", "OF", "FOR", "CON", "SIN", "X", "REAL",
]);

const limpiar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ");

const abreviarMarca = (marca: string) =>
  MARCAS[marca] ?? limpiar(marca).replace(/ /g, "").slice(0, 3);

const palabrasDe = (p: ParaCodigo) =>
  limpiar(p.nombre)
    .split(/\s+/)
    .filter((w) => w && !VACIAS.has(w) && !/^\d+$/.test(w));

/** "Caja x10" -> X10, "50 ml" -> 50ML. Vacio si no hay medida. */
const medidaDe = (p: ParaCodigo) =>
  p.medida ? limpiar(p.medida).replace(/\s+/g, "").replace("CAJAX", "X") : "";

const armar = (p: ParaCodigo, cuerpo: string) =>
  [abreviarMarca(p.marca), cuerpo, medidaDe(p)].filter(Boolean).join("-");

/** El codigo de una palabra sola: el que sirve mientras nadie choque. */
export const codigoBase = (p: ParaCodigo) =>
  armar(p, palabrasDe(p)[0]?.slice(0, 4) || "PROD");

/**
 * El codigo de UN producto nuevo, esquivando los que ya existen.
 *
 * `otros` son los productos que ya estan cargados. Se necesitan
 * enteros y no solo sus codigos porque, para separarse de ellos, hay
 * que mirarles el nombre y buscar que palabra no comparten.
 *
 * Los codigos de `otros` NO se tocan: el que llega tarde es el que se
 * estira. Cambiarle el codigo a un producto que Valen ya anoto en
 * algun lado seria peor que un codigo largo.
 */
export function codigoDe(nuevo: ParaCodigo, otros: (ParaCodigo & { codigo?: string })[]): string {
  const base = codigoBase(nuevo);
  const ocupados = new Set(otros.map((o) => o.codigo).filter(Boolean) as string[]);
  if (!ocupados.has(base)) return base;

  /* Los que ya tienen ese codigo: contra ellos hay que diferenciarse. */
  const chocan = otros.filter((o) => o.codigo === base);
  const ajenas = new Set(chocan.flatMap(palabrasDe));
  const propia = palabrasDe(nuevo).find((w) => !ajenas.has(w));

  if (propia) {
    const conPropia = armar(nuevo, palabrasDe(nuevo)[0].slice(0, 4) + propia.slice(0, 4));
    if (!ocupados.has(conPropia)) return conPropia;
  }

  /* Red de seguridad. Deberia no usarse nunca, pero un codigo repetido
     en la columna unica de la base seria un error al guardar. */
  let n = 2;
  while (ocupados.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/**
 * Los codigos de TODO el catalogo de una, para la carga inicial.
 *
 * No es lo mismo que llamar `codigoDe` en un bucle: ahi el primer
 * Relief Sun se quedaria con `BOJ-RELI-50ML` y los otros dos con el
 * codigo largo, y quedarian tres hermanos con criterios distintos.
 * Aca, cuando un grupo choca, se estiran TODOS sus integrantes.
 */
export function codigosParaLote<T extends ParaCodigo>(productos: T[]): Map<T, string> {
  const grupos = new Map<string, T[]>();
  for (const p of productos) {
    const b = codigoBase(p);
    if (!grupos.has(b)) grupos.set(b, []);
    grupos.get(b)!.push(p);
  }

  const salida = new Map<T, string>();
  const vistos = new Set<string>();

  for (const [base, grupo] of grupos) {
    for (const p of grupo) {
      let codigo = base;
      if (grupo.length > 1) {
        const ajenas = new Set(grupo.filter((o) => o !== p).flatMap(palabrasDe));
        const propia = palabrasDe(p).find((w) => !ajenas.has(w));
        /* El que no tiene ninguna palabra propia se queda con el codigo
           corto: es el producto base de la familia. Pasa con "Revive
           Serum" contra "Revive Eye Serum", donde el primero es un
           subconjunto del segundo. */
        if (propia) {
          codigo = armar(p, palabrasDe(p)[0].slice(0, 4) + propia.slice(0, 4));
        }
      }
      let final = codigo;
      let n = 2;
      while (vistos.has(final)) final = `${codigo}-${n++}`;
      vistos.add(final);
      salida.set(p, final);
    }
  }
  return salida;
}
