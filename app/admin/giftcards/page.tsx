import NavAdmin from "@/components/admin/NavAdmin";
import PanelGiftcards from "@/components/admin/PanelGiftcards";
import { obtenerTratamientos } from "@/lib/catalogo";

export const metadata = {
  title: "Giftcards | Piel con Valen",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function GiftcardsPage() {
  /* Los tratamientos, para cargar una a mano con su precio de hoy. */
  const tratamientos = await obtenerTratamientos();

  return (
    <main className="pantalla-admin mx-auto max-w-2xl px-5 py-10">
      <NavAdmin />
      <PanelGiftcards tratamientos={tratamientos} />
    </main>
  );
}
