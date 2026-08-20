"use client";

import { useState } from "react";
import { LogoMarca } from "@/components/Logo";
import { hayBaseDeDatos } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

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

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
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
        <h1 className="text-2xl font-semibold text-tinta">Agenda de Valen</h1>
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
            className="mt-2 min-h-13 w-full rounded-2xl border border-borde px-4 text-lg outline-none focus:border-vino"
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
            className="mt-2 min-h-13 w-full rounded-2xl border border-borde px-4 text-lg outline-none focus:border-vino"
          />
        </label>

        {error && (
          <p className="mt-4 rounded-xl bg-vino-suave px-4 py-3 text-base text-vino">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={entrando}
          className="boton-principal mt-6 w-full disabled:opacity-60"
        >
          {entrando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}

function SinConfigurar() {
  return (
    <main className="mx-auto max-w-md px-5 py-20 text-center">
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
