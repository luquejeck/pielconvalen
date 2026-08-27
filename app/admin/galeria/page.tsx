import EditorGaleria from "@/components/admin/EditorGaleria";
import NavAdmin from "@/components/admin/NavAdmin";
import { URL_SUPABASE } from "@/lib/supabase";

export const metadata = {
  title: "Galería | Piel con Valen",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminGaleria() {
  return (
    <main className="pantalla-admin mx-auto max-w-2xl px-5 py-10">
      <NavAdmin />
      <h2 className="mb-6 text-xl font-semibold text-tinta">Galería</h2>
      <EditorGaleria urlBase={URL_SUPABASE} />
    </main>
  );
}
