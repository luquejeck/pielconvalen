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
          Tres renglones, no tres tarjetas.

          Eran tres tarjetas apiladas con un circulo de 56px cada una,
          media pantalla de celular para decir tres frases de seis
          palabras. La promesa no necesita tanto lugar: se lee de un
          vistazo o no se lee.

          El icono baja a 44 y el titulo entra en el mismo renglon que su
          explicacion, separado por el punto. Asi cada beneficio ocupa una
          linea y los tres se leen como una lista, que es lo que son.
        */}
        <div className="tarjeta mx-auto mt-6 max-w-2xl divide-y divide-borde px-5 sm:px-7 xl:max-w-3xl">
          {BENEFICIOS.map(({ Icono, titulo, texto }) => (
            <div key={titulo} className="flex items-center gap-4 py-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-vino-suave text-vino">
                <Icono className="h-6 w-6" />
              </span>
              <p className="text-lg leading-snug text-tinta-suave">
                <span className="font-semibold text-tinta">{titulo}.</span>{" "}
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
