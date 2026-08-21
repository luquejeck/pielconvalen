import { CONSULTORIO } from "@/lib/config";
import { LogoMarca } from "./Logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-borde bg-crema/90 backdrop-blur-md">
      <div className="contenedor flex h-16 items-center justify-between gap-3">
        <a href="#inicio" className="flex min-w-0 items-center gap-2.5">
          <LogoMarca alto={26} />
          {/*
            En celular el nombre lo aporta el propio logo: repetirlo partia el
            titulo en dos lineas y empujaba al boton contra el borde.
          */}
          <span className="hidden text-xl font-semibold tracking-tight text-vino sm:inline">
            {CONSULTORIO.nombre}
          </span>
        </a>

        <a
          href="#reservar"
          className="boton-principal compacto shrink-0 whitespace-nowrap"
        >
          {/*
            Una etiqueta u otra, nunca partida en dos: el boton principal
            separa sus hijos con un gap, y "Reservar" + " turno" quedaban
            con doble espacio en el medio.
          */}
          <span className="sm:hidden">Reservar</span>
          <span className="hidden sm:inline">Reservar turno</span>
        </a>
      </div>
    </header>
  );
}
