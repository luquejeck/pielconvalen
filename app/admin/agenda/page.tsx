import EditorAgenda from "@/components/admin/EditorAgenda";
import NavAdmin from "@/components/admin/NavAdmin";
import { obtenerAgenda } from "@/lib/catalogo";

export const metadata = {
  title: "Horarios | Piel con Valen",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAgenda() {
  const agenda = await obtenerAgenda();

  return (
    <main className="pantalla-admin mx-auto max-w-2xl px-5 py-10">
      <NavAdmin />
      <EditorAgenda agenda={agenda} />
    </main>
  );
}
