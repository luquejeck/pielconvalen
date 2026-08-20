const BENEFICIOS = [
  {
    numero: "01",
    titulo: "Piel más sana",
    texto:
      "Limpieza profunda que descongestiona, desinflama y equilibra la barrera cutánea.",
  },
  {
    numero: "02",
    titulo: "Piel más luminosa",
    texto:
      "Renovación celular con ácidos y activos que devuelven el brillo natural.",
  },
  {
    numero: "03",
    titulo: "Piel más uniforme",
    texto: "Mejora la textura, los poros dilatados, las marcas y las manchas.",
  },
];

export default function Beneficios() {
  return (
    <section id="beneficios" className="bg-crema-oscuro py-14 md:py-20 xl:py-24">
      <div className="contenedor">
        <p className="text-center text-sm font-medium uppercase tracking-widest text-vino">
          Resultados
        </p>
        <h2 className="mt-3 text-center text-3xl font-semibold text-tinta sm:text-4xl">
          Qué vas a notar
        </h2>
        <p className="mx-auto mt-4 max-w-md text-center text-lg text-tinta-suave">
          Todos los tratamientos son personalizados según tu tipo de piel y duran entre 1.5 y 2 horas.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {BENEFICIOS.map(({ numero, titulo, texto }) => (
            <div
              key={titulo}
              className="rounded-2xl border border-borde bg-white p-6 shadow-suave"
            >
              <span className="text-4xl font-bold text-vino/15">{numero}</span>
              <h3 className="mt-3 text-xl font-semibold text-tinta">{titulo}</h3>
              <p className="mt-2 text-base leading-relaxed text-tinta-suave">{texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
