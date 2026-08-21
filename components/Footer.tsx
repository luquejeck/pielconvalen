import { CONSULTORIO } from "@/lib/config";
import { LogoMarca } from "./Logo";
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
    <footer id="contacto" className="bg-tinta text-crema">
      <div className="contenedor py-12 md:py-14 xl:py-16">
        <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
          {/* Identidad */}
          <div>
            <div className="flex items-center gap-4">
              {/*
                El logo es un JPG con fondo blanco que se integra con
                mix-blend-multiply: eso solo funciona sobre fondos claros,
                y aca el fondo es tinta. Por eso va sobre una placa crema,
                que ademas lo convierte en marca y no en un texto mas.
              */}
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-crema">
                <LogoMarca alto={24} />
              </span>

              <div className="min-w-0">
                <p className="text-2xl font-semibold tracking-tight">
                  {CONSULTORIO.nombre}
                </p>
                <p className="mt-0.5 text-base text-crema/55">
                  {CONSULTORIO.profesional} · {CONSULTORIO.titulo}
                </p>
              </div>
            </div>

            <p className="mt-6 max-w-xs text-xl leading-snug text-crema/85">
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
                  className="flex items-center gap-4 rounded-2xl border border-crema/15 bg-crema/5 px-4 py-3.5 transition-colors hover:border-crema/35 hover:bg-crema/10"
                >
                  <Icono className="h-5 w-5 shrink-0 text-crema/60" />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="text-sm text-crema/60">{titulo}</span>
                    <span className="truncate text-base font-medium">
                      {detalle}
                    </span>
                  </span>
                  <IconoFlecha className="ml-auto h-4 w-4 shrink-0 text-crema/35" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/*
          Barra inferior. El padding de abajo deja libre la esquina donde flota
          el boton de WhatsApp: sin el, tapa el acceso de Valen a su agenda.
        */}
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-crema/15 pt-5 pb-20 text-sm text-crema/40 sm:flex-row sm:justify-between sm:pb-0 sm:pr-44">
          <p>
            © {new Date().getFullYear()} {CONSULTORIO.nombre} · Caballito, CABA
          </p>

          {/* Acceso de Valen a su agenda: discreto, pero siempre a mano. */}
          <a
            href="/admin"
            className="rounded-full border border-crema/20 px-4 py-2 transition-colors hover:border-crema/50 hover:text-crema/80"
          >
            Acceso profesional
          </a>
        </div>
      </div>
    </footer>
  );
}
