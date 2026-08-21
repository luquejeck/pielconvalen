const BENEFICIOS = [
  { titulo: "Piel más sana", texto: "Limpia, descongestionada y desinflamada." },
  { titulo: "Piel más luminosa", texto: "Recupera el brillo natural." },
  { titulo: "Piel más uniforme", texto: "Mejor textura, menos marcas y manchas." },
];

export default function Beneficios() {
  return (
    <section id="beneficios" className="bg-crema py-14 md:py-16">
      <div className="contenedor">
        <h2 className="text-center text-3xl font-semibold text-tinta sm:text-4xl">
          Qué vas a notar
        </h2>

        {/* Tres ideas, un renglon cada una. Lo que importa se lee de un vistazo. */}
        <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
          {BENEFICIOS.map(({ titulo, texto }) => (
            <div
              key={titulo}
              className="rounded-2xl border border-borde bg-white p-6 text-center shadow-suave"
            >
              <h3 className="text-xl font-semibold text-tinta">{titulo}</h3>
              <p className="mt-2 text-base leading-relaxed text-tinta-suave">
                {texto}
              </p>
            </div>
          ))}
        </div>

        {/*
          Las dos dudas que mas frenan a una clienta mayor: si su piel esta
          contemplada y si va a aguantar la camilla. Van juntas y cortas.
        */}
        <p className="mx-auto mt-6 max-w-3xl rounded-2xl border border-borde bg-crema-oscuro px-6 py-5 text-center text-base leading-relaxed text-tinta-suave">
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
