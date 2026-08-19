import PanelAdmin from "@/components/admin/PanelAdmin";
import { hayBaseDeDatos } from "@/lib/supabase";

export const metadata = {
  title: "Agenda | Piel con Valen",
  robots: { index: false, follow: false },
};

export default function Admin() {
  if (!hayBaseDeDatos) {
    return (
      <main className="mx-auto max-w-md px-5 py-20 text-center">
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

  return <PanelAdmin />;
}
