import NavAdmin from "@/components/admin/NavAdmin";
import PanelEconomia from "@/components/admin/PanelEconomia";

export const metadata = {
  title: "Caja | Piel con Valen",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function CajaPage() {
  return (
    <main className="pantalla-admin mx-auto max-w-2xl px-5 py-10">
      <NavAdmin />
      <h2 className="mb-6 text-xl font-semibold text-tinta">Caja</h2>
      <PanelEconomia />
    </main>
  );
}
