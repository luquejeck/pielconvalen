"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clienteNavegador } from "@/lib/supabase";

const SECCIONES = [
  { href: "/admin", texto: "Turnos" },
  { href: "/admin/tratamientos", texto: "Tratamientos" },
  { href: "/admin/agenda", texto: "Horarios" },
];

export default function NavAdmin() {
  const pathname = usePathname();
  const router = useRouter();

  const salir = async () => {
    await clienteNavegador().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-tinta">Panel de Valen</h1>
        <button
          type="button"
          onClick={salir}
          className="rounded-full border border-borde px-5 py-2.5 text-base text-tinta-suave hover:border-vino hover:text-vino"
        >
          Salir
        </button>
      </div>

      <nav className="mt-4 flex gap-2">
        {SECCIONES.map(({ href, texto }) => {
          const activo = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-full px-5 py-2.5 text-base transition-colors ${
                activo
                  ? "bg-vino text-white"
                  : "border border-borde bg-white text-tinta-suave hover:border-vino hover:text-vino"
              }`}
            >
              {texto}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
