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

/**
 * Seccion oscura: corta el crema de toda la pagina y le da peso.
 * Es puro texto, sin nada que tocar, asi que el fondo oscuro no
 * complica la lectura ni el uso.
 */
export default function Beneficios() {
  return (
    <section id="beneficios" className="bg-noche py-14 text-white md:py-20">
      <div className="contenedor max-w-3xl">
        <p className="text-center text-base text-dorado">Resultados</p>

        <h2 className="mt-2 text-center text-3xl font-semibold sm:text-4xl">
          Qué vas a notar
        </h2>

        <ul className="mt-10 border-y border-white/12">
          {BENEFICIOS.map(({ titulo, texto }, i) => (
            <li
              key={titulo}
              className={`flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-8 ${
                i > 0 ? "border-t border-white/12" : ""
              }`}
            >
              <h3 className="text-xl font-semibold text-dorado sm:w-56 sm:shrink-0">
                {titulo}
              </h3>
              <p className="text-lg leading-snug text-white/75">{texto}</p>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-lg leading-snug text-white/70">
          Todos los tratamientos son{" "}
          <strong className="font-medium text-white">personalizados</strong>{" "}
          según tu tipo de piel, y duran{" "}
          <strong className="font-medium text-white">
            entre 1.5 y 2 horas
          </strong>
          .
        </p>
      </div>
    </section>
  );
}
