"use client";

import { useEffect, useState } from "react";
import { hoyEnArgentina } from "@/lib/fechas";
import { linkWhatsAppA, mensajeLesToca } from "@/lib/whatsapp";

type Clienta = {
  id: string;
  nombre: string;
  telefono: string | null;
  ultimaVisita?: string | null;
  proximo?: string | null;
};

/*
  CUANDO LE TOCA: entre 35 y 89 dias desde la ultima visita.

  Las preguntas frecuentes de la web dicen "cada 30 a 45 dias"; 35 le
  da unos dias de margen para sacar el turno sola. Desde los 90 ya no
  es "le toca": es una clienta que se fue, y esas estan en Clientas
  ("sin venir hace meses").
*/
const DESDE_DIAS = 35;
const HASTA_DIAS = 90;

/** Dias entre dos "YYYY-MM-DD", sin que la zona horaria corra el dia. */
const diasEntre = (desde: string, hasta: string) => {
  const utc = (f: string) => {
    const [y, m, d] = f.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(hasta) - utc(desde)) / 86400000);
};

/*
  A QUIEN YA SE LE ESCRIBIO: se guarda en el telefono de Valen, con la
  fecha. Sin esto la misma clienta apareceria todos los dias hasta que
  saque turno. Deja de aparecer hasta que vuelva a venir: ahi su ultima
  visita pasa a ser posterior al aviso y el ciclo arranca de nuevo.
*/
const CLAVE = "les-toca-avisadas";

function leerAvisadas(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? "{}");
  } catch {
    return {};
  }
}

/**
 * "A estas clientas les toca volver", en Turnos.
 *
 * La mejora mas chica posible sobre lo que ya hay: las visitas y los
 * turnos ya estan en la base (es lo que usa Clientas), asi que no hay
 * tabla nueva ni nada que configurar. Una lista plegada con el WhatsApp
 * escrito; Valen toca y manda, como en los recordatorios de mañana.
 *
 * Plegada y abajo de todo lo demas: nadie esta esperando una respuesta.
 * Se muestra solo si hay alguna.
 */
export default function LesToca() {
  const [clientas, setClientas] = useState<Clienta[]>([]);
  const [avisadas, setAvisadas] = useState<Record<string, string>>({});
  const [origen, setOrigen] = useState("");

  useEffect(() => {
    setAvisadas(leerAvisadas());
    setOrigen(window.location.origin);
    fetch("/api/clientes")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setClientas(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const hoy = hoyEnArgentina();
  const lesToca = clientas
    .filter((c) => {
      if (!c.telefono || !c.ultimaVisita || c.proximo) return false;
      const dias = diasEntre(c.ultimaVisita, hoy);
      const avisada = avisadas[c.id];
      return dias >= DESDE_DIAS && dias < HASTA_DIAS && !(avisada && avisada >= c.ultimaVisita);
    })
    /* Primero la que hace mas que vino. */
    .sort((a, b) => a.ultimaVisita!.localeCompare(b.ultimaVisita!));

  const avisar = (id: string) => {
    /* Se marca al tocar, un instante despues: si la fila desapareciera
       en el mismo toque, en algunos telefonos WhatsApp no se abriria. */
    setTimeout(() => {
      const nuevas = { ...leerAvisadas(), [id]: hoy };
      try {
        localStorage.setItem(CLAVE, JSON.stringify(nuevas));
      } catch {
        /* Sin almacenamiento, se marca solo por esta vez. */
      }
      setAvisadas(nuevas);
    }, 300);
  };

  if (lesToca.length === 0) return null;

  return (
    <details className="mb-8 rounded-suave border border-borde bg-crema-oscuro p-5">
      <summary className="min-h-8 cursor-pointer text-xl font-semibold text-tinta">
        {lesToca.length === 1
          ? "A 1 clienta le toca volver"
          : `A ${lesToca.length} clientas les toca volver`}
      </summary>
      <p className="mt-2 text-base text-tinta-suave">
        {lesToca.length === 1
          ? "Vino hace más de un mes y no tiene turno. Tocá para escribirle."
          : "Vinieron hace más de un mes y no tienen turno. Tocá para escribirles."}
      </p>

      <ul className="mt-4 space-y-2">
        {lesToca.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-chico bg-white px-4 py-3"
          >
            <span className="min-w-0 flex-1 text-base text-tinta">
              <span className="font-semibold">{c.nombre}</span>
              <span className="text-tinta-suave">
                {" "}
                · vino hace {Math.floor(diasEntre(c.ultimaVisita!, hoy) / 7)} semanas
              </span>
            </span>
            <a
              href={linkWhatsAppA(c.telefono!, mensajeLesToca(c.nombre, `${origen}/#reservar`))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => avisar(c.id)}
              className="min-h-11 rounded-full bg-vino px-5 py-2.5 text-base font-medium text-crema"
            >
              Escribirle
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
