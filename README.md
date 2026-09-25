# Piel con Valen — Web de reservas

Single page en **Next.js 16 (App Router) + Tailwind CSS v4** con módulo de turnos,
panel de administración y base de datos en Supabase.

- **Web pública:** https://pielconvalenn.vercel.app
- **Panel de Valen:** https://pielconvalenn.vercel.app/admin

---

## 1. Estructura

```
piel-con-valen/
├── app/
│   ├── layout.tsx                    # tipografia (SF Pro / Inter) y metadata SEO
│   ├── page.tsx                      # la landing completa
│   ├── globals.css                   # colores y tipografia (@theme de Tailwind v4)
│   ├── admin/
│   │   ├── page.tsx                  # panel de turnos (protegido)
│   │   └── login/page.tsx            # ingreso con mail y contraseña
│   └── api/
│       ├── disponibilidad/route.ts   # que horarios estan libres (lectura publica)
│       └── turnos/route.ts           # reserva un horario en estado pendiente
├── components/
│   ├── Header · Hero · Beneficios · Tratamientos · Reservas · Footer
│   ├── Calendario.tsx                # calendario con estados libre/ocupado
│   ├── BotonWhatsApp.tsx             # boton flotante de consulta
│   ├── ReservaContext.tsx            # estado compartido entre secciones
│   └── admin/PanelAdmin.tsx          # agenda diaria de Valen
├── lib/
│   ├── config.ts                     # datos del consultorio + agenda
│   ├── tratamientos.ts               # precios, tratamientos y extras
│   ├── disponibilidad.ts             # armado del mapa de turnos
│   ├── fechas.ts                     # helpers de fecha sin dependencias
│   ├── whatsapp.ts                   # mensaje y link de wa.me
│   ├── supabase.ts                   # cliente de navegador
│   └── supabase-servidor.ts          # cliente de servidor (cookies)
├── supabase/schema.sql               # tablas, vista y permisos
└── proxy.ts                          # protege /admin
```

**Para cambiar precios, horarios o datos de contacto sólo se tocan archivos de `lib/`.**

---

## 2. Correr en local

```bash
npm install
```

```bash
npm run dev
```

Requiere Node 18.18+ (probado en Node 24).

---

## 3. Conectar la base de datos

Sin variables de entorno la web funciona igual, con una **agenda simulada**.
Para que los turnos sean reales:

### 3.1 Crear el proyecto en Supabase

1. https://supabase.com → *Start your project* → entrar con GitHub.
2. *New project*. Region: **South America (São Paulo)**, la más cercana.
3. Guardar la contraseña de la base que te genera (no se usa en el código, pero
   sirve para recuperar el proyecto).

### 3.2 Crear las tablas

Supabase → **SQL Editor** → *New query* → pegar todo el contenido de
[`supabase/schema.sql`](supabase/schema.sql) → **Run**. Después repetir con
[`supabase/schema-2-catalogo.sql`](supabase/schema-2-catalogo.sql).

Los archivos `schema-3-…` en adelante son los cambios que vinieron después.
Se corren igual, **en orden y una sola vez cada uno**. El último es
[`supabase/schema-22-giftcards.sql`](supabase/schema-22-giftcards.sql):
las giftcards.

Eso crea:

| Objeto | Para qué |
|---|---|
| `turnos` | cada turno: fecha, hora, estado, clienta, tratamiento, precio |
| `tratamientos` | el catálogo: nombres, precios y qué suma cada uno |
| `agenda` | días, los horarios de cada día, anticipación mínima y cómo trabaja |
| `dias_cerrados` | vacaciones y feriados |
| `turnos_publicos` | vista que expone **sólo fecha y hora** — la web nunca ve nombres |
| políticas RLS | nadie lee datos de clientas sin estar logueado |

La restricción `unique (fecha, hora)` hace **imposible** que dos personas tomen
el mismo turno: lo impide la base, no el código.

### 3.3 Crear la usuaria de Valen

Supabase → **Authentication** → *Users* → **Add user** → mail y contraseña,
tildando *Auto Confirm User*.

### 3.4 Cargar las variables en Vercel

Supabase → *Project Settings* → **API**, y copiar:

| Variable en Vercel | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | *Project URL* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *anon public* |

Vercel → *Settings* → *Environment Variables* → agregar las dos → **Redeploy**.

> La clave `anon` es pública por diseño: viaja al navegador. Lo que protege los
> datos son las políticas RLS del paso 3.2, no el secreto de la clave.
> La clave `service_role` **no se usa en este proyecto** y no debe cargarse.

---

## 4. Cómo trabaja Valen

Entra a `/admin` con su mail y contraseña, desde el celular. Tiene tres solapas:

### Turnos (`/admin`)

- **Ver el día.** Flechas para moverse o calendario para saltar a una fecha.
- **Turnos que entran por la web** aparecen como *A confirmar* (ámbar). El horario
  ya está bloqueado para las demás. Ella confirma o cancela.
- **Cargar turno a mano.** Para quien reserva por Instagram o teléfono.
- **Bloquear un horario.** Médico, trámite, lo que sea.
- **Cerrar el día completo.** Vacaciones o feriados: desaparece de la web.
- **Mover un turno** a otro día u horario sin perder los datos de la clienta.
- El teléfono de la clienta es un link directo a su WhatsApp.

### Tratamientos (`/admin/tratamientos`)

Cambiar precios, editar nombres, agregar o eliminar tratamientos. Lo que
guarda se ve en la web al instante, sin tocar código ni redeployar.

### Horarios (`/admin/agenda`)

Días que atiende, horarios de cada día (agregar o quitar turnos),
anticipación mínima para reservar, cuántos días adelante se abre la agenda
y los pasos que incluyen todos los tratamientos.

### Giftcards (`/admin/giftcards`)

- **Para cobrar:** las que se pidieron por la web, con el mismo código que
  llega en el WhatsApp (G-4K7M9P). *Me la pagaron* → cómo pagó, y queda
  vigente por 6 meses. En Turnos aparece un aviso mientras haya alguna.
- **Vigentes:** *Mandar la tarjeta* abre WhatsApp con el link de la tarjeta
  para mandárselo a quien la compró, que se lo reenvía a quien la recibe.
- **Asociar turno:** cuando quien la recibe saca turno, se le asocia desde
  acá (aparecen primero los turnos con el mismo nombre). En Turnos, ese
  turno muestra la giftcard y el cobro ya viene con ella puesta. Si
  reserva desde su tarjeta, el código le llega en el mensaje de WhatsApp.
- **Cargar una a mano:** para las que se venden en el consultorio o por
  Instagram.
- **Borrar:** solo las anuladas o las que nunca se cobraron (las de prueba).
- **Se usan al cobrar el turno:** en *Cómo pagó* se elige *Giftcard* y se
  pone el código. El turno se cobra y la giftcard queda usada en el mismo
  paso. Si se deshace el cobro, la giftcard vuelve a estar vigente.

La plata de una giftcard **entra en la Caja cuando se usa**, no cuando se
vende: es un tratamiento pagado por adelantado. Lo cobrado y sin usar se ve
arriba de todo en Giftcards.

---

## 5. Circuito de una reserva

1. La clienta elige tratamiento, día y horario en la web.
2. Toca *Confirmar por WhatsApp* → `POST /api/turnos` guarda el turno como
   **pendiente** y ese horario desaparece de la web al instante.
3. Se abre WhatsApp con el mensaje escrito.
4. Valen responde y marca **Confirmado** en el panel.

Si la clienta nunca escribe, Valen cancela el turno y el horario vuelve a estar libre.

### Circuito de una giftcard

1. Quien regala la arma en `/giftcard`: un tratamiento o un monto, para
   quién, de parte de quién y un mensaje.
2. Toca *Pedir por WhatsApp* → `POST /api/giftcards` la registra como
   **nueva** y se abre WhatsApp con el código.
3. Valen cobra por el chat y la marca cobrada en el panel: queda **vigente**.
4. Valen le manda el link (`/giftcard/G-4K7M9P`) a quien la compró, que se
   lo reenvía a quien la recibe.
5. Quien la recibe reserva su turno y avisa que viene con la giftcard. Al
   cobrar, Valen elige *Giftcard* y pone el código: queda **usada**.

---

## 6. Pendientes

- Fotos reales del consultorio (hoy hay dos de banco, ver `public/imagenes/LEEME.md`).
- Recordatorio automático 24 hs antes del turno.
- Historial por clienta (los datos ya se guardan; falta la vista).
