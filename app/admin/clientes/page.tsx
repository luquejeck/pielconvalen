import NavAdmin from "@/components/admin/NavAdmin";
import PanelClientes from "@/components/admin/PanelClientes";

export const metadata = {
  title: "Clientas | Piel con Valen",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function ClientesPage() {
  return (
    <main className="pantalla-admin mx-auto max-w-2xl px-5 py-10">
      <NavAdmin />
      <h2 className="mb-6 text-xl font-semibold text-tinta">Mis clientas</h2>
      <PanelClientes />
    </main>
  );
}
