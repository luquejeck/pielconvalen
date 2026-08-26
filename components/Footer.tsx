import type { ConfiguracionWeb } from "@/lib/consultorio";
import { LogoMarca } from "./Logo";
import { linkWhatsAppSimple } from "@/lib/whatsapp";
import {
  IconoFlecha,
  IconoInstagram,
  IconoPin,
  IconoTelefono,
  IconoWhatsApp,
} from "./iconos";

const contactoDe = (CONSULTORIO: ConfiguracionWeb) => [
  {
    Icono: IconoWhatsApp,
    titulo: "Escribime",
    detalle: CONSULTORIO.whatsappVisible,
    href: linkWhatsAppSimple(undefined, CONSULTORIO.whatsapp),
    externo: true,
  },
  /*
    Llamar, que hasta ahora no era una opcion.

    El numero figuraba tres veces y las tres colgaba de un link a
    WhatsApp. Buena parte de las clientas mayores no escribe para pedir
    un turno: llama. Tocaban el numero, se les abria WhatsApp otra vez, y
    la pagina las empujaba a un canal que no habian elegido.
  */
  {
    Icono: IconoTelefono,
    titulo: "Llamame",
    detalle: CONSULTORIO.whatsappVisible,
    href: `tel:${CONSULTORIO.telefono}`,
    externo: false,
  },
  {
    Icono: IconoInstagram,
    titulo: "Mirá mi trabajo",
    detalle: `@${CONSULTORIO.instagram}`,
    href: CONSULTORIO.instagramUrl,
    externo: true,
  },
  {
    Icono: IconoPin,
    titulo: "Cómo llegar",
    detalle: CONSULTORIO.direccion.split(",").slice(0, 2).join(",").trim(),
    href: CONSULTORIO.mapsUrl,
    externo: true,
  },
];

export default function Footer({
  consultorio: CONSULTORIO,
}: {
  consultorio: ConfiguracionWeb;
}) {
  const CONTACTO = contactoDe(CONSULTORIO);

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
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-chico bg-crema">
                <LogoMarca alto={24} />
              </span>

              <div className="min-w-0">
                <p className="text-2xl font-semibold tracking-tight">
                  {CONSULTORIO.nombre}
                </p>
                <p className="mt-0.5 text-lg text-crema/55">
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
            {CONTACTO.map(({ Icono, titulo, detalle, href, externo }) => (
              <li key={titulo}>
                <a
                  href={href}
                  /* `tel:` no abre una pestaña: la abre y la deja vacía. */
                  target={externo ? "_blank" : undefined}
                  rel={externo ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-4 rounded-chico border border-crema/15 bg-crema/5 px-4 py-3.5 transition-colors hover:border-crema/35 hover:bg-crema/10"
                >
                  <Icono className="h-5 w-5 shrink-0 text-crema/60" />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="text-sm text-crema/60">{titulo}</span>
                    <span className="truncate text-lg font-medium">
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
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-crema/15 pt-5 pb-20 text-sm text-crema/60 sm:flex-row sm:justify-between sm:pb-0 sm:pr-44">
          <p>
            © {new Date().getFullYear()} {CONSULTORIO.nombre} · Caballito, CABA
          </p>

          {/* Acceso de Valen a su agenda: discreto, pero siempre a mano. */}
          <a
            href="/admin"
            className="rounded-full border border-crema/30 px-4 py-2 transition-colors hover:border-crema/50 hover:text-crema/80"
          >
            Acceso profesional
          </a>
        </div>
      </div>
    </footer>
  );
}
