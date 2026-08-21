import TituloSeccion from "./TituloSeccion";
import { IconoBrillo, IconoGota, IconoHoja } from "./iconos";

const BENEFICIOS = [
  {
    Icono: IconoHoja,
    titulo: "Piel más sana",
    texto: "Limpia, descongestionada y desinflamada.",
  },
  {
    Icono: IconoBrillo,
    titulo: "Piel más luminosa",
    texto: "Recupera el brillo natural.",
  },
  {
    Icono: IconoGota,
    titulo: "Piel más uniforme",
    texto: "Mejor textura, menos marcas y manchas.",
  },
];

export default function Beneficios() {
  return (
    <section
      id="beneficios"
      className="border-t border-borde bg-crema py-16 md:py-20 xl:py-24"
    >
      <div className="contenedor">
        <TituloSeccion titulo="Qué vas a notar" />

        {/* Un icono por idea: la tarjeta se reconoce antes de leerla. */}
        <div className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-3">
          {BENEFICIOS.map(({ Icono, titulo, texto }) => (
            /* En celular van apaisadas: apiladas y centradas ocupaban
               tres pantallas para decir tres renglones. */
            <div
              key={titulo}
              className="tarjeta flex items-center gap-4 px-5 py-5 transition-shadow hover:shadow-lg hover:shadow-tinta/5 sm:flex-col sm:px-6 sm:py-8 sm:text-center"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-vino-suave text-vino">
                <Icono className="h-7 w-7" />
              </span>
              <div className="sm:contents">
                <h3 className="text-xl font-semibold text-tinta sm:mt-5">
                  {titulo}
                </h3>
                <p className="mt-1 text-lg leading-relaxed text-tinta-suave sm:mt-2">
                  {texto}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/*
          Las dos dudas que mas frenan a una clienta mayor: si su piel esta
          contemplada y si va a aguantar la camilla. Van juntas y cortas.
        */}
        <p className="mx-auto mt-10 max-w-2xl text-center text-lg leading-relaxed text-tinta-suave">
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
