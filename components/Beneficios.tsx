const BENEFICIOS = [
  {
    titulo: "Piel más sana",
    texto:
      "Limpieza profunda que descongestiona, desinflama y equilibra la barrera cutánea.",
  },
  {
    titulo: "Piel más luminosa",
    texto:
      "Renovación celular con ácidos y activos que devuelven el brillo natural.",
  },
  {
    titulo: "Piel más uniforme",
    texto: "Mejora la textura, los poros dilatados, las marcas y las manchas.",
  },
];

export default function Beneficios() {
  return (
    <section id="beneficios" className="py-12 md:py-16">
      <div className="contenedor max-w-3xl">
        <h2 className="text-center text-3xl font-semibold text-tinta sm:text-4xl">
          Qué vas a notar
        </h2>

        {/* Formato editorial: titulo a la izquierda, explicacion a la derecha,
            separados por lineas finas. Se lee de corrido y sin adornos. */}
        <ul className="mt-8 border-y border-borde">
          {BENEFICIOS.map(({ titulo, texto }, i) => (
            <li
              key={titulo}
              className={`flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-8 ${
                i > 0 ? "border-t border-borde" : ""
              }`}
            >
              <h3 className="text-xl font-semibold text-vino sm:w-56 sm:shrink-0">
                {titulo}
              </h3>
              <p className="text-lg leading-snug text-tinta-suave">{texto}</p>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-lg leading-snug text-tinta-suave">
          Todos los tratamientos son{" "}
          <strong className="font-medium text-tinta">personalizados</strong>{" "}
          según tu tipo de piel, y duran{" "}
          <strong className="font-medium text-tinta">
            entre 1.5 y 2 horas
          </strong>
          .
        </p>
      </div>
    </section>
  );
}
