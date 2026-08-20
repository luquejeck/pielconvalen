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
    <header className="mb-6" style={{ fontFamily: "var(--font-admin)" }}>
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            className="shrink-0 rounded-full border border-borde px-3 py-1.5 text-xs text-tinta-suave hover:border-vino hover:text-vino"
          >
            ← Sitio
          </Link>
          <h1 className="truncate text-lg font-semibold text-tinta sm:text-xl">
            Panel de Valen
          </h1>
        </div>
        <button
          type="button"
          onClick={salir}
          className="shrink-0 rounded-full border border-borde px-4 py-1.5 text-sm text-tinta-suave hover:border-vino hover:text-vino"
        >
          Salir
        </button>
      </div>

      {/* Tabs — scroll horizontal en mobile */}
      <nav className="mt-4 -mx-5 overflow-x-auto px-5">
        <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
          {SECCIONES.map(({ href, texto }) => {
            const activo = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activo
                    ? "bg-vino text-white"
                    : "border border-borde bg-white text-tinta-suave hover:border-vino hover:text-vino"
                }`}
              >
                {texto}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
