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
    <section id="beneficios" className="py-20 md:py-24">
      <div className="contenedor">
        <h2 className="text-center text-3xl font-semibold text-tinta sm:text-4xl">
          Qué vas a notar
        </h2>

        <ul className="mt-12 grid gap-8 sm:grid-cols-3">
          {BENEFICIOS.map(({ Icono, titulo, texto }) => (
            <li key={titulo} className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-vino-suave text-vino">
                <Icono className="h-7 w-7" />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-tinta">{titulo}</h3>
              <p className="mt-2 text-lg text-tinta-suave">{texto}</p>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-14 max-w-2xl rounded-suave bg-crema-oscuro p-7 text-center text-lg leading-relaxed text-tinta">
          Todos los tratamientos son <strong>personalizados</strong> según tu
          tipo de piel. Reservá con tiempo: cada sesión dura{" "}
          <strong>entre 1.5 y 2 horas</strong>.
        </p>
      </div>
    </section>
  );
}
