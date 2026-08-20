import { CONSULTORIO } from "@/lib/config";
import { linkWhatsAppSimple } from "@/lib/whatsapp";
import { IconoFlecha, IconoInstagram, IconoPin, IconoWhatsApp } from "./iconos";

const CONTACTO = [
  {
    Icono: IconoWhatsApp,
    titulo: "Escribime",
    detalle: CONSULTORIO.whatsappVisible,
    href: linkWhatsAppSimple(),
  },
  {
    Icono: IconoInstagram,
    titulo: "Mirá mi trabajo",
    detalle: `@${CONSULTORIO.instagram}`,
    href: CONSULTORIO.instagramUrl,
  },
  {
    Icono: IconoPin,
    titulo: "Cómo llegar",
    detalle: "Riglos 531, Caballito",
    href: CONSULTORIO.mapsUrl,
  },
];

export default function Footer() {
  return (
    <footer id="contacto" className="bg-noche text-white">
      <div className="contenedor py-12 md:py-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
          {/* Identidad */}
          <div>
            <p className="text-2xl font-semibold tracking-tight">
              {CONSULTORIO.nombre}
            </p>
            <p className="mt-1 text-base text-white/55">
              {CONSULTORIO.profesional} · {CONSULTORIO.titulo}
            </p>
            <p className="mt-5 max-w-xs text-xl leading-snug text-white/85">
              {CONSULTORIO.eslogan}
            </p>
          </div>

          {/* Contacto: cada item es una accion, no un dato suelto */}
          <ul className="grid gap-2.5">
            {CONTACTO.map(({ Icono, titulo, detalle, href }) => (
              <li key={titulo}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 transition-colors hover:border-white/35 hover:bg-white/10"
                >
                  <Icono className="h-5 w-5 shrink-0 text-dorado/80" />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="text-sm text-dorado">{titulo}</span>
                    <span className="truncate text-base font-medium">
                      {detalle}
                    </span>
                  </span>
                  <IconoFlecha className="ml-auto h-4 w-4 shrink-0 text-white/35" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Barra inferior */}
        <div className="mt-10 flex flex-col items-center gap-2 border-t border-white/12 pt-5 text-sm text-white/40 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {CONSULTORIO.nombre} · Caballito, CABA
          </p>

          {/* Acceso de Valen a su agenda: discreto, pero siempre a mano. */}
          <a
            href="/admin"
            className="transition-colors hover:text-white/80"
          >
            Acceso profesional
          </a>
        </div>
      </div>
    </footer>
  );
}
