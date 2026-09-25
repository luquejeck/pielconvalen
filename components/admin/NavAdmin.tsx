"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * La navegacion del panel, ordenada por lo que Valen usa.
 *
 * ESTABA EN EL ORDEN EN QUE SE FUERON CONSTRUYENDO LAS COSAS, no en el
 * que se usan: ocho pestañas, con Horarios en el medio y Videos al lado
 * de Economia. El 21-09-2026 se miro que tiene datos cada tabla:
 *
 *   turnos, sesiones, cobros   se usan TODOS LOS DIAS
 *   clientas                   si
 *   gastos fijos               nunca (cero filas)
 *   videos                     nunca (cero filas)
 *
 * O sea que el panel es, en la practica, una agenda con caja. El orden
 * lo refleja, en tres grupos:
 *
 *   HOY          Turnos y Caja: lo que abre cada dia.
 *   MI NEGOCIO   Productos, Tratamientos, Clientas y Giftcards: lo que
 *                administra.
 *   MI WEB       Todo lo que es de la pagina publica, junto, al final.
 *
 * Los grupos se separan con aire y no con titulos: en el telefono la
 * barra se desliza al costado, y un rotulo "HOY" en el medio de la fila
 * ocuparia el lugar de una pestaña.
 */
type Seccion = {
  href: string;
  texto: string;
  /** Otras rutas que cuentan como esta seccion para marcarla activa. */
  tambien?: string[];
};

const GRUPOS: Seccion[][] = [
  [
    { href: "/admin", texto: "Turnos" },
    /*
      "Caja" y no "Economia": es donde entran y salen los pesos del dia.
      La ruta sigue siendo /admin/economia para no romper un marcador
      que Valen tenga guardado en el telefono.
    */
    { href: "/admin/economia", texto: "Caja" },
  ],
  [
    { href: "/admin/productos", texto: "Productos" },
    { href: "/admin/tratamientos", texto: "Tratamientos" },
    { href: "/admin/clientes", texto: "Clientas" },
    /* Al final del grupo: se vende de a rachas (cumpleaños, el Dia de
       la Madre, fin de año) y el resto del tiempo se mira poco. */
    { href: "/admin/giftcards", texto: "Giftcards" },
  ],
  [
    /*
      Una sola entrada para lo de la pagina publica. Horarios y Videos
      siguen existiendo en sus rutas —nada se borro—, pero se llega desde
      aca adentro, con la sub-barra de abajo. Videos nunca se uso y
      Horarios se configura una vez: no tienen por que estar a la vista
      al lado de la caja.
    */
    { href: "/admin/web", texto: "Mi web", tambien: ["/admin/agenda", "/admin/galeria"] },
  ],
];

/** Lo que se ve adentro de "Mi web". */
const MI_WEB: Seccion[] = [
  { href: "/admin/web", texto: "Textos" },
  { href: "/admin/agenda", texto: "Horarios" },
  { href: "/admin/galeria", texto: "Videos" },
];

const activa = (s: Seccion, ruta: string) =>
  ruta === s.href || Boolean(s.tambien?.includes(ruta));

export default function NavAdmin() {
  const pathname = usePathname();
  const enMiWeb = MI_WEB.some((s) => s.href === pathname);

  /** La cookie la escribe el servidor, asi que es el servidor quien la borra. */
  const salir = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/admin/login");
  };

  return (
    <header className="mb-8">
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

      {/* Tres grupos, separados por aire. Se desliza en el telefono. */}
      <nav aria-label="Secciones del panel" className="mt-4 -mx-5 overflow-x-auto px-5">
        <div className="flex items-center gap-3" style={{ width: "max-content" }}>
          {GRUPOS.map((grupo, i) => (
            <div key={i} className="segmentado">
              {grupo.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  data-activo={activa(s, pathname)}
                  aria-current={activa(s, pathname) ? "page" : undefined}
                >
                  {s.texto}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </nav>

      {/* Adentro de "Mi web": las tres partes de la pagina publica. */}
      {enMiWeb && (
        <nav aria-label="Mi web" className="mt-3 flex gap-4 border-b border-borde">
          {MI_WEB.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              aria-current={pathname === s.href ? "page" : undefined}
              className={`-mb-px border-b-2 px-1 pb-2 text-sm transition-colors ${
                pathname === s.href
                  ? "border-vino font-semibold text-vino"
                  : "border-transparent text-tinta-suave hover:text-vino"
              }`}
            >
              {s.texto}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
