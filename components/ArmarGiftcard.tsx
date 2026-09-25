"use client";

import { useEffect, useState } from "react";
import { fechaConAnio, GIFTCARD, nuevoCodigoGiftcard, sumarMeses } from "@/lib/giftcards";
import { hoyEnArgentina } from "@/lib/fechas";
import { formatearPrecio, type Tratamiento } from "@/lib/tratamientos";
import { linkGiftcard } from "@/lib/whatsapp";
import { IconoBillete, IconoCheck, IconoWhatsApp } from "./iconos";
import TarjetaGiftcard from "./TarjetaGiftcard";

/** Lo que muestra la pagina despues de tocar "Pedir por WhatsApp". */
type Enviado = {
  codigo: string;
  para: string;
  /** El mismo link, por si WhatsApp no se abrio. */
  link: string;
  estado: "registrando" | "registrada" | "sin-registrar";
};

const MONTO = "monto";

/** "$ 50.000" -> 50000. Solo los digitos: se escribe con o sin puntos. */
const leerMonto = (texto: string) => Number(texto.replace(/\D/g, "")) || 0;

/**
 * Armar una giftcard: que se regala, para quien, de parte de quien y un
 * mensaje. Arriba se ve la tarjeta, que se va completando mientras se
 * escribe: quien regala ve exactamente lo que va a recibir la otra
 * persona.
 *
 * NO SE PAGA ACA, igual que los productos: la web no cobra. El boton
 * abre WhatsApp con todo escrito y la registra con un codigo, y Valen
 * cobra por el chat. Recien ahi la tarjeta se activa y ella manda el
 * link para reenviarla.
 *
 * TRATAMIENTO O MONTO. El tratamiento es el regalo que se entiende
 * solo ("te regalo un Full Glow"). El monto es para quien no sabe cual
 * le corresponde a la otra persona, que es lo mas comun: el que va lo
 * define Valen mirando la piel, igual que en cualquier turno.
 */
export default function ArmarGiftcard({
  tratamientos,
  whatsapp,
  mediosDePago,
  inicial,
}: {
  /** Los del catalogo con precio, de menor a mayor. */
  tratamientos: Tratamiento[];
  whatsapp: string;
  mediosDePago: string;
  /** El tratamiento que viene elegido desde su pagina. */
  inicial?: string;
}) {
  const [regalo, setRegalo] = useState(
    tratamientos.some((t) => t.id === inicial) ? inicial! : ""
  );
  const [monto, setMonto] = useState("");
  const [para, setPara] = useState("");
  const [de, setDe] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [codigo, setCodigo] = useState("");
  const [enviado, setEnviado] = useState<Enviado | null>(null);

  /* El codigo se arma al montar y no al dibujar: el servidor y el
     navegador sacarian dos distintos. Tiene que ser el mismo desde que
     se arma el link hasta que se toca. */
  useEffect(() => {
    if (!codigo) setCodigo(nuevoCodigoGiftcard());
  }, [codigo]);

  const tratamiento = tratamientos.find((t) => t.id === regalo) ?? null;
  const importe = tratamiento ? tratamiento.precio : regalo === MONTO ? leerMonto(monto) : 0;
  const montoValido =
    importe >= GIFTCARD.montoMinimo && importe <= GIFTCARD.montoMaximo;

  /* Que falta, en el orden en que se completa. El boton esta siempre a
     la vista y dice que le falta, como en la reserva. */
  const falta = !regalo
    ? "Falta elegir qué regalás"
    : !montoValido
      ? `Poné un monto desde ${formatearPrecio(GIFTCARD.montoMinimo)}`
      : !para.trim()
        ? "Falta para quién es"
        : !de.trim()
          ? "Falta de parte de quién"
          : null;

  const datos = {
    codigo,
    para,
    de,
    mensaje,
    tratamiento: tratamiento?.nombre ?? null,
    monto: importe,
  };
  const link = falta || !codigo ? "" : linkGiftcard(datos, whatsapp);

  /* Todo pasa un instante despues del toque, por lo mismo que en el
     pedido (ver Carrito.tsx): si el formulario desapareciera en el mismo
     toque, en algunos telefonos WhatsApp no se abriria. */
  const enviar = () => {
    const este = codigo;
    const cuerpo = JSON.stringify({
      codigo: este,
      para,
      de,
      mensaje,
      ...(tratamiento ? { tratamientoId: tratamiento.id } : { monto: importe }),
    });
    setTimeout(() => {
      setEnviado({ codigo: este, para: para.trim(), link, estado: "registrando" });
      window.scrollTo({ top: 0, behavior: "smooth" });
      fetch("/api/giftcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: cuerpo,
        keepalive: true,
      })
        .then((r) => r.ok)
        .catch(() => false)
        .then((ok) =>
          setEnviado((e) =>
            e && e.codigo === este ? { ...e, estado: ok ? "registrada" : "sin-registrar" } : e
          )
        );
    }, 0);
  };

  const armarOtra = () => {
    setEnviado(null);
    setRegalo("");
    setMonto("");
    setPara("");
    setDe("");
    setMensaje("");
    setCodigo(nuevoCodigoGiftcard());
  };

  /* "Efectivo, transferencia..." se lee dentro de una frase. */
  const comoSePaga = mediosDePago.charAt(0).toLowerCase() + mediosDePago.slice(1);

  const tarjeta = (
    <TarjetaGiftcard
      para={para.trim() || "quien la recibe"}
      de={de.trim() || "vos"}
      regalo={
        tratamiento
          ? tratamiento.nombre
          : regalo === MONTO && importe > 0
            ? formatearPrecio(importe)
            : "Tu regalo"
      }
      codigo={enviado?.codigo}
    />
  );

  if (enviado) {
    return (
      <div className="animar-entrada">
        {tarjeta}
        <Confirmacion enviado={enviado} onArmarOtra={armarOtra} />
      </div>
    );
  }

  return (
    <>
      {tarjeta}

      {mensaje.trim() && (
        <p className="mt-3 px-2 text-center text-lg leading-snug text-tinta-suave italic">
          “{mensaje.trim()}”
        </p>
      )}

      <div className="tarjeta mt-6 px-4 py-6 sm:px-6">
        <fieldset>
          <legend className="font-display text-lg font-semibold text-tinta">¿Qué regalás?</legend>
          <div className="mt-3 space-y-2">
            {tratamientos.map((t) => (
              <Opcion
                key={t.id}
                valor={t.id}
                elegida={regalo === t.id}
                onElegir={setRegalo}
                titulo={t.nombre}
                detalle={formatearPrecio(t.precio)}
              />
            ))}
            <Opcion
              valor={MONTO}
              elegida={regalo === MONTO}
              onElegir={setRegalo}
              titulo="Un monto"
              detalle="Para el tratamiento que le toque"
            />
          </div>

          {regalo === MONTO && (
            <label className="mt-3 block">
              <span className="text-base text-tinta">¿Cuánto?</span>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                value={monto ? formatearPrecio(leerMonto(monto)) : ""}
                onChange={(e) => setMonto(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 7))}
                placeholder={`Desde ${formatearPrecio(GIFTCARD.montoMinimo)}`}
                className="mt-1.5 min-h-13 w-full rounded-chico border border-borde bg-white px-4 text-lg text-tinta tabular-nums outline-none transition-colors placeholder:text-tinta-suave focus:border-vino"
              />
            </label>
          )}
        </fieldset>

        <label className="mt-6 block">
          <span className="font-display text-lg font-semibold text-tinta">¿Para quién es?</span>
          <input
            type="text"
            value={para}
            onChange={(e) => setPara(e.target.value)}
            maxLength={GIFTCARD.largoNombre}
            placeholder="Su nombre, como va en la tarjeta"
            className="mt-2 min-h-13 w-full rounded-chico border border-borde bg-white px-4 text-lg text-tinta outline-none transition-colors placeholder:text-tinta-suave focus:border-vino"
          />
        </label>

        <label className="mt-5 block">
          <span className="font-display text-lg font-semibold text-tinta">¿De parte de quién?</span>
          <input
            type="text"
            value={de}
            onChange={(e) => setDe(e.target.value)}
            maxLength={GIFTCARD.largoNombre}
            autoComplete="given-name"
            placeholder="Tu nombre"
            className="mt-2 min-h-13 w-full rounded-chico border border-borde bg-white px-4 text-lg text-tinta outline-none transition-colors placeholder:text-tinta-suave focus:border-vino"
          />
        </label>

        <label className="mt-5 block">
          <span className="font-display text-lg font-semibold text-tinta">
            Un mensaje <span className="font-normal text-tinta-suave">· si querés</span>
          </span>
          <textarea
            rows={3}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            maxLength={GIFTCARD.largoMensaje}
            placeholder="¡Feliz cumple! Para que te regales un mimo."
            className="mt-2 w-full rounded-chico border border-borde bg-white px-4 py-3 text-lg leading-snug text-tinta outline-none transition-colors placeholder:text-tinta-suave focus:border-vino"
          />
        </label>

        {/*
          QUE PASA DESPUES DE TOCAR EL BOTON, como en el pedido: la web
          no cobra, y "¿y donde pago?" es lo que frena el ultimo toque.
        */}
        <ul className="mt-6 space-y-1.5 rounded-chico bg-crema px-3.5 py-3 text-[0.9375rem] leading-snug text-tinta-suave">
          <li className="flex gap-2.5">
            <IconoWhatsApp className="mt-0.5 h-4 w-4 shrink-0 text-vino" />
            <span>Se abre WhatsApp con la giftcard ya escrita.</span>
          </li>
          <li className="flex gap-2.5">
            <IconoBillete className="mt-0.5 h-4 w-4 shrink-0 text-vino" />
            <span>Pagás en {comoSePaga}.</span>
          </li>
          <li className="flex gap-2.5">
            <IconoCheck className="mt-0.5 h-4 w-4 shrink-0 text-vino" />
            <span>
              Valen te manda la tarjeta para reenviar. Vale {GIFTCARD.vigenciaMeses} meses: hasta el{" "}
              {fechaConAnio(sumarMeses(hoyEnArgentina(), GIFTCARD.vigenciaMeses))} si la pagás hoy.
            </span>
          </li>
        </ul>

        {falta ? (
          /* Un <button disabled> y no un <a> apagado: un link no se puede
             deshabilitar de verdad (ver Reservas.tsx). */
          <>
            <button
              type="button"
              disabled
              aria-describedby="falta-giftcard"
              className="boton-principal mt-4 w-full cursor-not-allowed opacity-45 shadow-none"
            >
              <IconoWhatsApp className="h-5 w-5" />
              Pedir por WhatsApp
            </button>
            <p id="falta-giftcard" className="mt-2.5 text-center text-lg text-tinta-suave">
              {falta}
            </p>
          </>
        ) : (
          <a
            href={link}
            onClick={enviar}
            target="_blank"
            rel="noopener noreferrer"
            className="boton-principal mt-4 w-full"
          >
            <IconoWhatsApp className="h-5 w-5" />
            Pedir por WhatsApp
          </a>
        )}
      </div>
    </>
  );
}

/**
 * Una fila elegible: el nombre y, debajo, el precio.
 *
 * El precio iba a la derecha y en un celular de 375 px le dejaba al
 * nombre 140 px: "Higiene Facial con Dermaplaning" quedaba en tres
 * renglones. Abajo, el nombre tiene la fila entera.
 */
function Opcion({
  valor,
  elegida,
  onElegir,
  titulo,
  detalle,
}: {
  valor: string;
  elegida: boolean;
  onElegir: (valor: string) => void;
  titulo: string;
  detalle: string;
}) {
  return (
    <label
      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-chico border px-4 py-3 transition-colors ${
        elegida ? "border-vino bg-vino-suave" : "border-borde bg-white hover:border-vino/50"
      }`}
    >
      <input
        type="radio"
        name="regalo"
        value={valor}
        checked={elegida}
        onChange={() => onElegir(valor)}
        className="size-5 shrink-0 accent-vino"
      />
      <span className="min-w-0 flex-1 leading-snug">
        <span className="block text-lg text-tinta">{titulo}</span>
        <span
          className={`block ${
            valor === MONTO
              ? "text-base text-tinta-suave"
              : "font-display text-base font-semibold text-tinta tabular-nums"
          }`}
        >
          {detalle}
        </span>
      </span>
    </label>
  );
}

/**
 * Despues del toque: el codigo que tambien va en el WhatsApp, que pasa
 * ahora, y una salida por si WhatsApp no se abrio.
 */
function Confirmacion({ enviado, onArmarOtra }: { enviado: Enviado; onArmarOtra: () => void }) {
  const registrada = enviado.estado !== "sin-registrar";
  return (
    <div className="tarjeta mt-6 px-6 pt-8 pb-6 text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-positivo-suave text-positivo">
        <IconoCheck className="h-8 w-8" />
      </span>

      <h2 className="mt-4 font-display text-2xl font-semibold text-tinta">
        {registrada ? "¡Listo! Tu giftcard quedó registrada" : "Tu giftcard salió por WhatsApp"}
      </h2>

      <p className="mt-3 text-lg text-tinta-suave">
        Código{" "}
        <span className="font-display font-semibold tracking-[0.08em] text-tinta">
          {enviado.codigo}
        </span>
      </p>

      <p className="mx-auto mt-3 max-w-sm text-base leading-snug text-tinta-suave">
        {registrada
          ? `Valen la ve con este mismo código. Cuando te confirme el pago, te manda la tarjeta para que se la reenvíes a ${enviado.para}.`
          : "No la pudimos registrar en la web, pero si enviaste el mensaje, Valen lo recibe igual."}
      </p>

      <a
        href={enviado.link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex min-h-11 items-center gap-2 text-base font-semibold text-vino underline decoration-vino/30 underline-offset-4 hover:decoration-vino"
      >
        <IconoWhatsApp className="h-5 w-5" />
        ¿No se abrió WhatsApp? Tocá acá
      </a>

      <button type="button" onClick={onArmarOtra} className="boton-secundario mt-5 w-full">
        Armar otra giftcard
      </button>
    </div>
  );
}
