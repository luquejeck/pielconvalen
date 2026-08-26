"use client";

import { useEffect, useState } from "react";
import { formatearFechaLarga } from "@/lib/fechas";

type TurnoDeClienta = {
  id: string;
  fecha: string;
  hora: string;
  estado: string;
  tratamiento: string | null;
  precio: number | null;
};

type Historial = {
  turnos: TurnoDeClienta[];
  resumen: {
    visitas: number;
    gastado: number;
    ultimaVisita: string | null;
    diasSinVenir: number | null;
    proximoTurno: TurnoDeClienta | null;
  };
};

const fmt = (n: number) => `$${n.toLocaleString("es-AR")}`;

/**
 * Lo que la ficha nunca habia mostrado: sus turnos y su plata.
 *
 * `turnos.cliente_id` y `movimientos.cliente_id` se escribian desde
 * siempre y no los leia nadie. El boton "Vincular clienta" guardaba una
 * relacion que despues no se consultaba en ningun lado, asi que la ficha
 * solo tenia las sesiones cargadas a mano y no habia forma de saber
 * cuando vino por ultima vez ni cuanto dejo.
 */
export default function ResumenClienta({ clienteId }: { clienteId: string }) {
  const [datos, setDatos] = useState<Historial | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    setCargando(true);

    fetch(`/api/clientes/historial?cliente_id=${clienteId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (vigente) {
          setDatos(d);
          setCargando(false);
        }
      })
      .catch(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [clienteId]);

  if (cargando) {
    return <p className="mt-4 text-base text-tinta-suave">Cargando historial…</p>;
  }
  if (!datos) return null;

  const { visitas, gastado, ultimaVisita, diasSinVenir, proximoTurno } = datos.resumen;

  /* Tres meses sin venir es la señal de que conviene escribirle. No es
     un reproche a la clienta: es el dato que se le pierde a Valen. */
  const haceMucho = diasSinVenir !== null && diasSinVenir >= 90;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-3 gap-2">
        <Dato titulo="Vino" valor={visitas === 1 ? "1 vez" : `${visitas} veces`} />
        <Dato titulo="Dejó" valor={fmt(gastado)} />
        <Dato
          titulo="Última vez"
          valor={
            ultimaVisita === null
              ? "—"
              : diasSinVenir === 0
                ? "hoy"
                : diasSinVenir === 1
                  ? "ayer"
                  : `hace ${diasSinVenir} días`
          }
          alerta={haceMucho}
        />
      </div>

      {proximoTurno && (
        <p className="mt-3 rounded-chico bg-vino-suave px-4 py-2.5 text-base text-vino">
          Próximo turno: {formatearFechaLarga(proximoTurno.fecha)} ·{" "}
          {proximoTurno.hora} hs
          {proximoTurno.estado === "pendiente" && " · falta que se lo confirmes"}
        </p>
      )}

      {haceMucho && !proximoTurno && (
        <p className="mt-3 rounded-chico bg-crema-oscuro px-4 py-2.5 text-base text-tinta">
          Hace {Math.floor((diasSinVenir ?? 0) / 30)} meses que no viene y no
          tiene turno.
        </p>
      )}

      {datos.turnos.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-base text-tinta-suave hover:text-vino">
            Ver sus {datos.turnos.length} turnos
          </summary>
          <ul className="mt-2 space-y-1.5">
            {datos.turnos.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-baseline justify-between gap-x-3 rounded-chico bg-crema-oscuro px-3 py-2 text-base"
              >
                <span className="text-tinta">
                  {formatearFechaLarga(t.fecha)} · {t.hora} hs
                </span>
                <span className="text-tinta-suave">
                  {t.tratamiento ?? "—"}
                  {t.estado === "realizado" && t.precio ? ` · ${fmt(t.precio)}` : ""}
                  {t.estado === "no_vino" ? " · no vino" : ""}
                  {t.estado === "pendiente" ? " · a confirmar" : ""}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Dato({
  titulo,
  valor,
  alerta = false,
}: {
  titulo: string;
  valor: string;
  alerta?: boolean;
}) {
  return (
    <div
      className={`rounded-chico px-3 py-2.5 ${
        alerta ? "bg-negativo-suave" : "bg-crema-oscuro"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-tinta-suave">{titulo}</p>
      <p
        className={`mt-0.5 text-lg font-semibold ${
          alerta ? "text-negativo" : "text-tinta"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}
