import { CONSULTORIO } from "@/lib/config";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-borde/60 bg-crema/85 backdrop-blur-md">
      <div className="contenedor flex h-16 items-center justify-between">
        <a href="#inicio" className="flex flex-col leading-none">
          <span className="font-display text-xl tracking-wide text-vino">
            {CONSULTORIO.nombre}
          </span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-tinta-suave">
            Cosmetología
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-tinta-suave md:flex">
          <a href="#beneficios" className="transition-colors hover:text-vino">
            Beneficios
          </a>
          <a href="#tratamientos" className="transition-colors hover:text-vino">
            Tratamientos
          </a>
          <a href="#contacto" className="transition-colors hover:text-vino">
            Contacto
          </a>
        </nav>

        <a
          href="#reservar"
          className="rounded-full bg-vino px-5 py-2 text-sm font-medium text-crema transition-colors hover:bg-vino-oscuro"
        >
          Reservar
        </a>
      </div>
    </header>
  );
}
