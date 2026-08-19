import { CONSULTORIO } from "@/lib/config";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-borde bg-crema/90 backdrop-blur-md">
      <div className="contenedor flex h-16 items-center justify-between">
        <a
          href="#inicio"
          className="text-xl font-semibold tracking-tight text-vino"
        >
          {CONSULTORIO.nombre}
        </a>

        <a
          href="#reservar"
          className="rounded-full bg-vino px-6 py-3 text-base font-medium text-crema transition-colors hover:bg-vino-oscuro"
        >
          Reservar turno
        </a>
      </div>
    </header>
  );
}
