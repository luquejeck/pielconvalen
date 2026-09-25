import NavAdmin from "@/components/admin/NavAdmin";
import PanelGiftcards from "@/components/admin/PanelGiftcards";
import { obtenerAgenda, obtenerTratamientos } from "@/lib/catalogo";

export const metadata = {
  title: "Giftcards | Piel con Valen",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function GiftcardsPage() {
  /* Los tratamientos, para cargar una a mano con su precio de hoy; la
     agenda, para darle turno en un horario libre. */
  const [tratamientos, agenda] = await Promise.all([obtenerTratamientos(), obtenerAgenda()]);

  return (
    <main className="pantalla-admin mx-auto max-w-2xl px-5 py-10">
      <NavAdmin />
      <PanelGiftcards tratamientos={tratamientos} agenda={agenda} />
    </main>
  );
}
