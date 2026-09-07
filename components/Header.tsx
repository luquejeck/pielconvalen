import type { ConfiguracionWeb } from "@/lib/consultorio";
import { LogoMarca } from "./Logo";

export default function Header({
  consultorio: CONSULTORIO,
}: {
  consultorio: ConfiguracionWeb;
}) {
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
            Siempre "Reservar turno", tambien en celular.

            Antes decia "Reservar" a secas en pantalla angosta, el hero
            decia "Reservar turno" y la seccion de precios "Pedir un
            turno": tres nombres para el mismo boton en la misma pagina.
            Para una clienta de cincuenta y pico eso no son sinonimos,
            son tres cosas distintas que hay que ir a entender.
          */}
          Reservar turno
        </a>
      </div>
    </header>
  );
}
