import TituloSeccion from "./TituloSeccion";
import type { ConfiguracionWeb } from "@/lib/consultorio";
import { IconoBrillo, IconoGota, IconoHoja } from "./iconos";

/*
  Los iconos siguen en el codigo: son dibujos, no texto. Los titulos y
  las frases salen de la configuracion, que Valen edita desde el panel.
  Van emparejados por posicion, y si algun dia carga mas de tres, los
  iconos se repiten en vez de dejar huecos.
*/
const ICONOS = [IconoHoja, IconoBrillo, IconoGota];

export default function Beneficios({
  consultorio: CONSULTORIO,
}: {
  consultorio: ConfiguracionWeb;
}) {
  const BENEFICIOS = CONSULTORIO.beneficios.map((b, i) => ({
    ...b,
    Icono: ICONOS[i % ICONOS.length],
  }));

  return (
    <section
      id="beneficios"
      /* Fondo mas oscuro que la seccion de al lado: alterna, y ademas
         las tarjetas blancas se despegan. Con crema quedaban casi
         invisibles sobre casi el mismo color. */
      className="border-t border-borde bg-crema-oscuro seccion"
    >
      <div className="contenedor">
        <TituloSeccion titulo="Qué vas a notar" />

        {/*
          EN CELULAR, TRES RENGLONES; DE 640 PARA ARRIBA, TRES COLUMNAS.

          En el telefono sigue siendo la lista compacta: tres frases de
          seis palabras no merecen media pantalla. En pantalla ancha esos
          mismos renglones dejaban dos tercios de la tarjeta vacios a la
          derecha; ahi cada beneficio toma su columna, con el icono arriba,
          y la seccion queda mas baja y mas pareja.
        */}
        <div className="tarjeta mx-auto mt-6 grid max-w-2xl divide-y divide-borde px-5 sm:max-w-4xl sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-0 sm:py-2">
          {BENEFICIOS.map(({ Icono, titulo, texto }) => (
            <div
              key={titulo}
              className="flex items-center gap-4 py-4 sm:flex-col sm:items-center sm:gap-3 sm:px-6 sm:py-6 sm:text-center"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-vino-suave text-vino sm:h-14 sm:w-14">
                <Icono className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <p className="text-lg leading-snug text-tinta-suave">
                <span className="font-semibold text-tinta sm:block">{titulo}.</span>{" "}
                {texto}
              </p>
            </div>
          ))}
        </div>

        {/*
          Las dos dudas que mas frenan a una clienta mayor: si su piel esta
          contemplada y si va a aguantar la camilla. Van juntas y cortas.
        */}
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-snug text-tinta-suave">
          Cada tratamiento se adapta a tu piel, incluso si es{" "}
          <span className="font-medium text-tinta">
            madura, sensible o con rosácea
          </span>
          . La camilla se acomoda como necesites y podés frenar cuando quieras.
        </p>
      </div>
    </section>
  );
}
