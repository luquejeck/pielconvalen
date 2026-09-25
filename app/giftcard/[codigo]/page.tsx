import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { IconoWhatsApp } from "@/components/iconos";
import TarjetaGiftcard from "@/components/TarjetaGiftcard";
import { obtenerConfiguracion } from "@/lib/consultorio";
import { hoyEnArgentina } from "@/lib/fechas";
import { CODIGO_GIFTCARD, estaVencida, fechaConAnio, queRegala, type Giftcard } from "@/lib/giftcards";
import { hayBaseDeDatos } from "@/lib/supabase";
import { clienteServidor } from "@/lib/supabase-servidor";
import { linkWhatsAppSimple } from "@/lib/whatsapp";

type Ruta = { params: Promise<{ codigo: string }> };

/** Lo que devuelve `giftcard_publica`: solo lo que muestra la tarjeta. */
type Publica = Pick<
  Giftcard,
  "codigo" | "estado" | "para" | "de" | "mensaje" | "tratamiento" | "monto" | "vence_el"
>;

/**
 * Una sola giftcard, por su codigo. Se lee con una funcion de la base y
 * no con un `select`: la web puede ver UNA sabiendo el codigo, pero no
 * listarlas (ver schema-22).
 */
async function buscar(crudo: string): Promise<Publica | null> {
  const codigo = decodeURIComponent(crudo).trim().toUpperCase();
  if (!hayBaseDeDatos || !CODIGO_GIFTCARD.test(codigo)) return null;

  const supabase = await clienteServidor();
  const { data } = await supabase.rpc("giftcard_publica", { p_codigo: codigo });
  return (data as Publica[] | null)?.[0] ?? null;
}

export async function generateMetadata({ params }: Ruta): Promise<Metadata> {
  const [g, CONSULTORIO] = await Promise.all([
    params.then((p) => buscar(p.codigo)),
    obtenerConfiguracion(),
  ]);
  return {
    title: g?.para ? `Una giftcard para ${g.para} | ${CONSULTORIO.nombre}` : `Giftcard | ${CONSULTORIO.nombre}`,
    description: `Un regalo para cuidar tu piel con ${CONSULTORIO.profesional}.`,
    /* Es de una persona: no tiene nada que hacer en Google. */
    robots: { index: false, follow: false },
  };
}

/**
 * La giftcard que abre quien la recibe: el link que Valen le manda a
 * quien la compro, y que esa persona reenvia.
 *
 * Tiene que contestar dos cosas, y nada mas: que me regalaron, y como
 * lo uso. La tarjeta dice lo primero; lo segundo son dos pasos y el
 * boton de reservar, que es el mismo de toda la web.
 *
 * Cada estado dice la verdad: una sin pagar no muestra la tarjeta (se
 * podria reenviar antes de pagarla), una usada lo dice, y una vencida
 * tambien, con la salida de escribirle a Valen.
 */
export default async function PaginaTarjeta({ params }: Ruta) {
  const [g, CONSULTORIO] = await Promise.all([
    params.then((p) => buscar(p.codigo)),
    obtenerConfiguracion(),
  ]);

  const activa = g?.estado === "vigente" || g?.estado === "usada";
  const vencida = g ? estaVencida(g, hoyEnArgentina()) : false;
  const escribir = (texto: string) => linkWhatsAppSimple(texto, CONSULTORIO.whatsapp);

  return (
    <>
      <Header consultorio={CONSULTORIO} enPortada={false} />

      <main className="bg-crema">
        <div className="contenedor py-8 md:py-14">
          <div className="mx-auto max-w-xl">
            {g && activa ? (
              <>
                <p className="text-center font-display text-sm font-semibold tracking-[0.12em] text-vino uppercase">
                  Un regalo para vos
                </p>
                <h1 className="mt-2 mb-6 text-center text-4xl leading-tight text-tinta">
                  {g.de} te regaló una sesión
                </h1>

                <TarjetaGiftcard
                  para={g.para}
                  de={g.de}
                  regalo={queRegala(g)}
                  codigo={g.codigo}
                  apagada={g.estado === "usada" || vencida}
                />

                {g.mensaje && (
                  <p className="mt-5 px-2 text-center text-xl leading-snug text-tinta italic">
                    “{g.mensaje}”
                  </p>
                )}

                {g.estado === "usada" ? (
                  <Aviso titulo="Esta giftcard ya se usó">
                    Esperamos que la hayas disfrutado. Cuando quieras volver, el turno se saca
                    desde la web.
                  </Aviso>
                ) : vencida ? (
                  <Aviso titulo={`Venció el ${fechaConAnio(g.vence_el!)}`}>
                    Escribile a Valen con el código y fijate con ella si todavía la podés usar.
                    <a
                      href={escribir(
                        `Hola Valen! Tengo una giftcard que venció 🎁\nCódigo: ${g.codigo}\n\n¿La puedo usar igual?`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="boton-principal mt-4 w-full"
                    >
                      <IconoWhatsApp className="h-5 w-5" />
                      Escribirle a Valen
                    </a>
                  </Aviso>
                ) : (
                  <section className="tarjeta mt-6 px-6 py-6">
                    <h2 className="font-display text-lg font-semibold text-tinta">Cómo usarla</h2>
                    <ol className="mt-3 space-y-3 text-lg leading-snug text-tinta">
                      <li className="flex gap-3">
                        <Numero n={1} />
                        <span>Reservá tu turno desde la web, como cualquier turno.</span>
                      </li>
                      <li className="flex gap-3">
                        <Numero n={2} />
                        <span>
                          Cuando Valen te responda, avisale que venís con la giftcard{" "}
                          <b className="font-display tracking-[0.06em] whitespace-nowrap">{g.codigo}</b>.
                        </span>
                      </li>
                    </ol>
                    {g.vence_el && (
                      <p className="mt-4 text-base text-tinta-suave">
                        Vale hasta el {fechaConAnio(g.vence_el)}.
                      </p>
                    )}
                    <Link href="/#reservar" className="boton-principal mt-5 w-full">
                      Reservar turno
                    </Link>
                  </section>
                )}
              </>
            ) : (
              <>
                <h1 className="text-center text-4xl leading-tight text-tinta">
                  {g?.estado === "nueva"
                    ? "Esta giftcard todavía no está activa"
                    : "No encontramos esta giftcard"}
                </h1>
                <p className="mx-auto mt-4 max-w-md text-center text-xl leading-snug text-tinta-suave">
                  {g?.estado === "nueva"
                    ? "Se activa cuando Valen confirma el pago. Ahí te llega el link para verla y regalarla."
                    : "Revisá que el link esté completo, o escribile a Valen con el código."}
                </p>
                <a
                  href={escribir("Hola Valen! Te escribo por una giftcard 🎁")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="boton-secundario mx-auto mt-6 flex w-full max-w-sm"
                >
                  <IconoWhatsApp className="h-5 w-5" />
                  Escribirle a Valen
                </a>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer consultorio={CONSULTORIO} />
    </>
  );
}

function Aviso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="tarjeta mt-6 px-6 py-6 text-center">
      <h2 className="font-display text-xl font-semibold text-tinta">{titulo}</h2>
      <p className="mt-2 text-lg leading-snug text-tinta-suave">{children}</p>
    </section>
  );
}

function Numero({ n }: { n: number }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-vino-suave font-display text-base font-semibold text-vino">
      {n}
    </span>
  );
}
