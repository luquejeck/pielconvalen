"use client";

import { useState } from "react";
import { LogoMarca } from "@/components/Logo";
import { hayBaseDeDatos } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  /* Sin esto, perder la contraseña significaba quedarse afuera de la
     propia agenda hasta que alguien entrara a Supabase a resetearla. */
  const [avisoReset, setAvisoReset] = useState<string | null>(null);

  if (!hayBaseDeDatos) return <SinConfigurar />;

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntrando(true);
    setError(null);

    /**
     * La sesion se abre en el servidor, no aca. Escribir la cookie desde el
     * navegador fallaba en celulares que restringen cookies: el ingreso
     * andaba pero la sesion no sobrevivia y la pagina volvia al login.
     */
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: clave }),
    });

    if (!res.ok) {
      const { error: mensaje } = await res.json().catch(() => ({ error: null }));
      setError(mensaje ?? "No se pudo entrar. Probá de nuevo.");
      setEntrando(false);
      return;
    }

    // Navegacion real para que el navegador mande la cookie recien recibida.
    window.location.assign("/admin");
  };

  /** Manda el mail de recuperacion al correo que este escrito arriba. */
  const recuperar = async () => {
    setError(null);
    setAvisoReset(null);

    if (!email.trim()) {
      setError("Escribí tu mail arriba y volvé a tocar acá.");
      return;
    }

    const { clienteNavegador } = await import("@/lib/supabase");
    const { error: fallo } = await clienteNavegador().auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/admin/login` }
    );

    setAvisoReset(
      fallo
        ? "No se pudo enviar el mail. Probá de nuevo en un rato."
        : "Listo: te mandamos un mail con el enlace para cambiar la contraseña. Fijate también en el correo no deseado."
    );
  };

  return (
    <main className="pantalla-admin flex min-h-dvh items-center justify-center px-5 py-16">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm rounded-suave border border-borde bg-white p-8"
      >
        <a
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-tinta-suave hover:text-vino"
        >
          ← Volver al sitio
        </a>
        <LogoMarca alto={34} className="mb-5" />
        <h1 className="text-3xl font-semibold text-tinta">Agenda de Valen</h1>
        <p className="mt-2 text-base text-tinta-suave">
          Ingresá para gestionar los turnos.
        </p>

        <label className="mt-7 block">
          <span className="text-base text-tinta">Mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-2 min-h-13 w-full px-4 text-lg"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-base text-tinta">Contraseña</span>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-2 min-h-13 w-full px-4 text-lg"
          />
        </label>

        {error && (
          <p className="mt-4 rounded-xl bg-vino-suave px-4 py-3 text-base text-vino">
            {error}
          </p>
        )}

        {avisoReset && (
          <p className="mt-4 rounded-xl bg-crema-oscuro px-4 py-3 text-base leading-snug text-tinta">
            {avisoReset}
          </p>
        )}

        <button
          type="submit"
          disabled={entrando}
          className="boton-principal mt-6 w-full disabled:opacity-60"
        >
          {entrando ? "Entrando…" : "Entrar"}
        </button>

        <button
          type="button"
          onClick={recuperar}
          className="mt-4 w-full text-base text-tinta-suave underline hover:text-vino"
        >
          Me olvidé la contraseña
        </button>
      </form>
    </main>
  );
}

function SinConfigurar() {
  return (
    <main className="pantalla-admin mx-auto max-w-md px-5 py-20 text-center">
      <h1 className="text-2xl font-semibold text-tinta">Panel no configurado</h1>
      <p className="mt-4 text-lg text-tinta-suave">
        Falta conectar la base de datos. Cargá{" "}
        <code className="text-tinta">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
        <code className="text-tinta">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en las
        variables de entorno de Vercel.
      </p>
    </main>
  );
}
