import EditorWeb from "@/components/admin/EditorWeb";
import NavAdmin from "@/components/admin/NavAdmin";
import { obtenerConfiguracion } from "@/lib/consultorio";

export const metadata = {
  title: "Mi web | Piel con Valen",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminWeb() {
  const configuracion = await obtenerConfiguracion();

  return (
    <main className="pantalla-admin mx-auto max-w-2xl px-5 py-10">
      <NavAdmin />
      <h2 className="mb-6 text-xl font-semibold text-tinta">Mi web</h2>
      <EditorWeb inicial={configuracion} />
    </main>
  );
}
