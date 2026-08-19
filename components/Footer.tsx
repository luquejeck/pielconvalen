import { CONSULTORIO } from "@/lib/config";
import { linkWhatsAppSimple } from "@/lib/whatsapp";
import { IconoInstagram, IconoPin, IconoWhatsApp } from "./iconos";

const CONTACTO = [
  {
    Icono: IconoPin,
    titulo: "Consultorio",
    detalle: CONSULTORIO.direccion,
    href: CONSULTORIO.mapsUrl,
  },
  {
    Icono: IconoWhatsApp,
    titulo: "WhatsApp",
    detalle: CONSULTORIO.whatsappVisible,
    href: linkWhatsAppSimple(),
  },
  {
    Icono: IconoInstagram,
    titulo: "Instagram",
    detalle: `@${CONSULTORIO.instagram}`,
    href: CONSULTORIO.instagramUrl,
  },
];

export default function Footer() {
  return (
    <footer id="contacto" className="bg-vino text-crema">
      <div className="contenedor py-16">
        <p className="text-center text-2xl font-semibold">
          {CONSULTORIO.nombre}
        </p>
        <p className="mt-2 text-center text-lg text-crema/70">
          {CONSULTORIO.profesional} · {CONSULTORIO.titulo}
        </p>

        <ul className="mx-auto mt-12 grid max-w-2xl gap-8 sm:grid-cols-3">
          {CONTACTO.map(({ Icono, titulo, detalle, href }) => (
            <li key={titulo} className="text-center">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-col items-center gap-2 transition-opacity hover:opacity-70"
              >
                <Icono className="h-7 w-7" />
                <span className="text-lg font-medium">{titulo}</span>
                <span className="text-base text-crema/70">{detalle}</span>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-14 text-center text-base text-crema/50">
          © {new Date().getFullYear()} {CONSULTORIO.nombre} · Caballito, CABA
        </p>

        {/* Acceso de Valen a su agenda. Discreto a proposito: no le dice
            nada a una clienta, pero esta siempre a mano desde el celular. */}
        <p className="mt-4 text-center">
          <a
            href="/admin"
            className="text-sm text-crema/40 underline underline-offset-4 transition-colors hover:text-crema/80"
          >
            Acceso profesional
          </a>
        </p>
      </div>
    </footer>
  );
}
