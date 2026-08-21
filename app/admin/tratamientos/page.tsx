import EditorTratamientos from "@/components/admin/EditorTratamientos";
import NavAdmin from "@/components/admin/NavAdmin";
import { obtenerTratamientos } from "@/lib/catalogo";

export const metadata = {
  title: "Tratamientos | Piel con Valen",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminTratamientos() {
  const tratamientos = await obtenerTratamientos();

  return (
    <main className="pantalla-admin mx-auto max-w-2xl px-5 py-10">
      <NavAdmin />
      <EditorTratamientos tratamientos={tratamientos} />
    </main>
  );
}
