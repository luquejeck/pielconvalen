"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/admin", texto: "Turnos" },
  { href: "/admin/clientes", texto: "Clientas" },
  { href: "/admin/tratamientos", texto: "Tratamientos" },
  { href: "/admin/agenda", texto: "Horarios" },
  { href: "/admin/economia", texto: "Economía" },
];

export default function NavAdmin() {
  const pathname = usePathname();

  /** La cookie la escribe el servidor, asi que es el servidor quien la borra. */
  const salir = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/admin/login");
  };

  return (
    <header className="mb-8">
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            className="shrink-0 rounded-full bg-crema-oscuro px-3 py-1.5 text-xs font-medium text-tinta-suave transition-colors hover:text-vino"
          >
            ← Sitio
          </Link>
          <h1 className="truncate text-2xl font-semibold text-tinta sm:text-3xl">
            Panel de Valen
          </h1>
        </div>
        <button
          type="button"
          onClick={salir}
          className="shrink-0 rounded-full bg-crema-oscuro px-4 py-1.5 text-sm font-medium text-tinta-suave transition-colors hover:text-vino"
        >
          Salir
        </button>
      </div>

      {/* Tabs — scroll horizontal en mobile */}
      <nav className="mt-4 -mx-5 overflow-x-auto px-5">
        <div className="segmentado" style={{ width: "max-content" }}>
          {SECCIONES.map(({ href, texto }) => (
            <Link
              key={href}
              href={href}
              data-activo={pathname === href}
              aria-current={pathname === href ? "page" : undefined}
            >
              {texto}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
