"use client";

import { useCallback, useEffect, useState } from "react";

type GastoFijo = {
  id: string;
  descripcion: string;
  categoria: string;
  monto: number;
  dia_del_mes: number;
  activo: boolean;
};

const VACIO = { descripcion: "", monto: "", dia_del_mes: "1" };
const fmt = (n: number) => `$${n.toLocaleString("es-AR")}`;

/**
 * Los gastos que se repiten todos los meses.
 *
 * El alquiler del gabinete se cargaba a mano cada treinta dias, igual que
 * internet o el contador. Se declaran una vez y despues se vuelcan al mes
 * con un boton.
 *
 * Volcar dos veces no duplica nada: la base tiene un indice unico por
 * (gasto fijo, mes), asi que el segundo intento se cuenta como "ya
 * estaba". Valen no tiene que llevar registro mental de si ya lo hizo.
 */
export default function TabGastosFijos({
  mes,
  onVolcado,
}: {
  mes: string;
  onVolcado: () => void;
}) {
  const [gastos, setGastos] = useState<GastoFijo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nuevo, setNuevo] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetch("/api/gastos-fijos");
    if (res.ok) {
      const data = await res.json();
      setGastos(Array.isArray(data) ? data : []);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const res = await fetch("/api/gastos-fijos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setGuardando(false);
    if (!res.ok) {
      setError("No se pudo guardar.");
      return;
    }
    setForm(VACIO);
    setNuevo(false);
    await cargar();
  };

  const eliminar = async (id: string) => {
    await fetch(`/api/gastos-fijos?id=${id}`, { method: "DELETE" });
    await cargar();
  };

  const alternarActivo = async (g: GastoFijo) => {
    await fetch(`/api/gastos-fijos?id=${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...g, activo: !g.activo }),
    });
    await cargar();
  };

  const volcar = async () => {
    setAviso(null);
    setError(null);

    const res = await fetch("/api/gastos-fijos/volcar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mes }),
    });

    if (!res.ok) {
      setError("No se pudieron cargar los gastos del mes.");
      return;
    }

    const { cargados, yaEstaban } = await res.json();
    setAviso(
      cargados === 0
        ? "Ya estaban todos cargados este mes."
        : `${cargados} gasto${cargados > 1 ? "s" : ""} cargado${cargados > 1 ? "s" : ""}` +
          (yaEstaban > 0 ? ` · ${yaEstaban} ya estaba${yaEstaban > 1 ? "n" : ""}` : "")
    );
    onVolcado();
  };

  const activos = gastos.filter((g) => g.activo);
  const totalMensual = activos.reduce((s, g) => s + g.monto, 0);

  if (cargando) return <p className="text-center text-tinta-suave">Cargando…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-tinta-suave">
          {activos.length === 0
            ? "Sin gastos fijos"
            : `${activos.length} activos · ${fmt(totalMensual)} por mes`}
        </p>
        <button
          onClick={() => setNuevo((v) => !v)}
          className="rounded-full border border-borde px-4 py-2 text-sm text-tinta-suave hover:border-vino hover:text-vino"
        >
          {nuevo ? "Cancelar" : "+ Agregar"}
        </button>
      </div>

      {nuevo && (
        <form onSubmit={guardar} className="rounded-2xl border border-borde bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block sm:col-span-3">
              <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Qué es</span>
              <input
                type="text"
                required
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Alquiler del gabinete"
                className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Cuánto</span>
              <input
                type="number"
                min="0"
                required
                value={form.monto}
                onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
                placeholder="35000"
                className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Qué día</span>
              <input
                type="number"
                min="1"
                max="28"
                required
                value={form.dia_del_mes}
                onChange={(e) => setForm((f) => ({ ...f, dia_del_mes: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={guardando}
            className="boton-principal mt-3 disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </form>
      )}

      {gastos.length > 0 && (
        <ul className="space-y-2">
          {gastos.map((g) => (
            <li
              key={g.id}
              className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-borde px-4 py-3 ${
                g.activo ? "bg-white" : "bg-crema-oscuro"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className={`font-medium ${g.activo ? "text-tinta" : "text-tinta-suave"}`}>
                  {g.descripcion}
                </p>
                <p className="text-sm text-tinta-suave">
                  {fmt(g.monto)} · el {g.dia_del_mes} de cada mes
                  {!g.activo && " · pausado"}
                </p>
              </div>
              <button
                onClick={() => alternarActivo(g)}
                className="rounded-full border border-borde px-4 py-1.5 text-xs text-tinta-suave hover:border-vino hover:text-vino"
              >
                {g.activo ? "Pausar" : "Reactivar"}
              </button>
              <button
                onClick={() => eliminar(g.id)}
                className="rounded-full px-3 py-1.5 text-xs text-tinta-suave hover:text-vino"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      {activos.length > 0 && (
        <div className="rounded-2xl border border-borde bg-crema-oscuro p-4">
          <p className="text-base text-tinta">
            Cargar los {activos.length} gastos fijos en el mes que estás viendo.
          </p>
          <button onClick={volcar} className="boton-principal mt-3">
            Cargar al mes
          </button>
          {aviso && <p className="mt-3 text-base text-positivo">✓ {aviso}</p>}
          {error && <p className="mt-3 text-base text-negativo">{error}</p>}
        </div>
      )}
    </div>
  );
}
