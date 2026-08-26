import EditorCasos from "@/components/admin/EditorCasos";
import NavAdmin from "@/components/admin/NavAdmin";
import { URL_SUPABASE } from "@/lib/supabase";

export const metadata = {
  title: "Antes y después | Piel con Valen",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminCasos() {
  return (
    <main className="pantalla-admin mx-auto max-w-2xl px-5 py-10">
      <NavAdmin />
      <h2 className="mb-6 text-xl font-semibold text-tinta">Antes y después</h2>
      <EditorCasos urlBase={URL_SUPABASE} />
    </main>
  );
}
