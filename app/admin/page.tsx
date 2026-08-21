import NavAdmin from "@/components/admin/NavAdmin";
import PanelAdmin from "@/components/admin/PanelAdmin";
import { obtenerAgenda, obtenerTratamientos } from "@/lib/catalogo";
import { hayBaseDeDatos } from "@/lib/supabase";

export const metadata = {
  title: "Agenda | Piel con Valen",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Admin() {
  if (!hayBaseDeDatos) {
    return (
      <main className="pantalla-admin mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="text-2xl font-semibold text-tinta">
          Panel no configurado
        </h1>
        <p className="mt-4 text-lg text-tinta-suave">
          Falta conectar la base de datos. Cargá las variables{" "}
          <code className="text-tinta">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code className="text-tinta">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en
          Vercel y volvé a entrar.
        </p>
      </main>
    );
  }

  const [tratamientos, agenda] = await Promise.all([
    obtenerTratamientos(),
    obtenerAgenda(),
  ]);

  return (
    <main className="pantalla-admin mx-auto max-w-2xl px-5 py-10">
      <NavAdmin />
      <PanelAdmin tratamientos={tratamientos} agenda={agenda} />
    </main>
  );
}
