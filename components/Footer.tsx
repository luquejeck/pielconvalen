import { CONSULTORIO } from "@/lib/config";
import { linkWhatsAppSimple } from "@/lib/whatsapp";
import { IconoInstagram, IconoPin, IconoWhatsApp } from "./iconos";

export default function Footer() {
  return (
    <footer id="contacto" className="bg-vino text-crema">
      <div className="contenedor py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="font-display text-3xl tracking-wide">
              {CONSULTORIO.nombre}
            </p>
            <p className="mt-3 max-w-sm font-display text-xl italic text-crema/70">
              «{CONSULTORIO.eslogan}»
            </p>
            <p className="mt-6 text-sm text-crema/60">
              {CONSULTORIO.profesional} · {CONSULTORIO.titulo}
            </p>
          </div>

          <ul className="space-y-5 text-sm">
            <li>
              <a
                href={CONSULTORIO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 transition-colors hover:text-crema/70"
              >
                <IconoPin className="mt-0.5 h-5 w-5 shrink-0 text-crema/60" />
                <span>
                  <span className="block font-medium">Consultorio</span>
                  <span className="text-crema/70">{CONSULTORIO.direccion}</span>
                </span>
              </a>
            </li>

            <li>
              <a
                href={linkWhatsAppSimple()}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 transition-colors hover:text-crema/70"
              >
                <IconoWhatsApp className="mt-0.5 h-5 w-5 shrink-0 text-crema/60" />
                <span>
                  <span className="block font-medium">WhatsApp</span>
                  <span className="text-crema/70">
                    {CONSULTORIO.whatsappVisible}
                  </span>
                </span>
              </a>
            </li>

            <li>
              <a
                href={CONSULTORIO.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 transition-colors hover:text-crema/70"
              >
                <IconoInstagram className="mt-0.5 h-5 w-5 shrink-0 text-crema/60" />
                <span>
                  <span className="block font-medium">Instagram</span>
                  <span className="text-crema/70">@{CONSULTORIO.instagram}</span>
                </span>
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-crema/15 pt-6 text-xs text-crema/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {CONSULTORIO.nombre}. Todos los derechos
            reservados.
          </p>
          <p>Caballito, Ciudad de Buenos Aires</p>
        </div>
      </div>
    </footer>
  );
}
