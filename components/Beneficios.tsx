import { IconoBrillo, IconoGota, IconoHoja, IconoReloj } from "./iconos";

const BENEFICIOS = [
  {
    Icono: IconoHoja,
    titulo: "Piel más sana",
    texto:
      "Limpieza profunda real: descongestionamos, desinflamamos y equilibramos la barrera cutánea.",
  },
  {
    Icono: IconoBrillo,
    titulo: "Piel más luminosa",
    texto:
      "Renovación celular con ácidos, dermaplaning y activos que devuelven el brillo natural.",
  },
  {
    Icono: IconoGota,
    titulo: "Piel más uniforme",
    texto:
      "Trabajamos textura, poros dilatados, marcas y manchas para emparejar el tono.",
  },
];

export default function Beneficios() {
  return (
    <section id="beneficios" className="bg-crema py-20 md:py-28">
      <div className="contenedor">
        <header className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-vino/70">
            Por qué tratarte
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-tinta md:text-5xl">
            La piel se cuida, no se tapa
          </h2>
          <p className="mt-5 text-base leading-relaxed text-tinta-suave">
            Cada sesión se piensa a partir de tu piel: su tipo, su momento y lo que
            necesita hoy. El resultado no es un efecto pasajero, es una piel que
            funciona mejor.
          </p>
        </header>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFICIOS.map(({ Icono, titulo, texto }) => (
            <li
              key={titulo}
              className="rounded-suave border border-borde bg-white/60 p-8 transition-colors hover:border-vino/25"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-vino-suave text-vino">
                <Icono className="h-6 w-6" />
              </span>
              <h3 className="mt-6 font-display text-2xl text-tinta">{titulo}</h3>
              <p className="mt-3 text-sm leading-relaxed text-tinta-suave">
                {texto}
              </p>
            </li>
          ))}
        </ul>

        {/* Aclaracion importante */}
        <aside className="mt-10 flex flex-col gap-4 rounded-suave bg-rosa/70 p-7 sm:flex-row sm:items-center sm:gap-6">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-crema text-vino">
            <IconoReloj className="h-5 w-5" />
          </span>
          <p className="text-sm leading-relaxed text-tinta">
            <strong className="font-medium">Importante:</strong> todos los
            tratamientos son{" "}
            <strong className="font-medium">personalizados</strong> según tu tipo
            de piel y su estado en el momento de la consulta. Reservá con tiempo:
            cada sesión dura{" "}
            <strong className="font-medium">entre 1.5 y 2 horas</strong>.
          </p>
        </aside>
      </div>
    </section>
  );
}
