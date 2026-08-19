import { IconoBrillo, IconoGota, IconoHoja } from "./iconos";

const BENEFICIOS = [
  {
    Icono: IconoHoja,
    titulo: "Piel más sana",
    texto: "Limpieza profunda que descongestiona y desinflama.",
  },
  {
    Icono: IconoBrillo,
    titulo: "Piel más luminosa",
    texto: "Renovación celular que devuelve el brillo natural.",
  },
  {
    Icono: IconoGota,
    titulo: "Piel más uniforme",
    texto: "Mejora la textura, los poros y las manchas.",
  },
];

export default function Beneficios() {
  return (
    <section id="beneficios" className="py-12 md:py-16">
      <div className="contenedor">
        <h2 className="text-center text-3xl font-semibold text-tinta sm:text-4xl">
          Qué vas a notar
        </h2>

        {/* En celular van en fila horizontal compacta; en pantallas
            grandes se despliegan con el texto completo. */}
        <ul className="mt-8 grid grid-cols-3 gap-4 sm:gap-6">
          {BENEFICIOS.map(({ Icono, titulo, texto }) => (
            <li key={titulo} className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-vino-suave text-vino sm:h-14 sm:w-14">
                <Icono className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <h3 className="mt-3 text-base leading-tight font-semibold text-tinta sm:text-xl">
                {titulo}
              </h3>
              <p className="mt-1 hidden text-lg text-tinta-suave sm:block">
                {texto}
              </p>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-8 max-w-2xl rounded-suave bg-crema-oscuro px-6 py-5 text-center text-lg leading-snug text-tinta">
          Todos los tratamientos son <strong>personalizados</strong> según tu
          tipo de piel, y duran <strong>entre 1.5 y 2 horas</strong>.
        </p>
      </div>
    </section>
  );
}
