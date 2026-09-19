import NavAdmin from "@/components/admin/NavAdmin";
import PanelProductos from "@/components/admin/PanelProductos";

export const metadata = {
  title: "Productos | Piel con Valen",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * El control de productos, aparte de Economia.
 *
 * Podria haber sido una pestaña mas de PanelEconomia, que ya tiene una
 * de inventario. Va aparte porque no es lo mismo: Economia contesta
 * "como me fue este mes" y esto contesta "que tengo y que vendo". Y
 * porque ese archivo ya pasa las mil lineas.
 *
 * Mas ancho que el resto del panel: la tabla tiene codigo, stock, dos
 * costos, precio y margen, y a 2xl se lee sin apretar nada.
 */
export default function ProductosPage() {
  return (
    <main className="pantalla-admin mx-auto max-w-5xl px-5 py-10">
      <NavAdmin />
      <PanelProductos />
    </main>
  );
}
