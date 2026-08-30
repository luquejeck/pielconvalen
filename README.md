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
[`supabase/schema-12-agenda-por-dia.sql`](supabase/schema-12-agenda-por-dia.sql):
los horarios de cada día y el texto de cómo trabaja.

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

---

## 5. Circuito de una reserva

1. La clienta elige tratamiento, día y horario en la web.
2. Toca *Confirmar por WhatsApp* → `POST /api/turnos` guarda el turno como
   **pendiente** y ese horario desaparece de la web al instante.
3. Se abre WhatsApp con el mensaje escrito.
4. Valen responde y marca **Confirmado** en el panel.

Si la clienta nunca escribe, Valen cancela el turno y el horario vuelve a estar libre.

---

## 6. Pendientes

- Fotos reales del consultorio (hoy hay dos de banco, ver `public/imagenes/LEEME.md`).
- Recordatorio automático 24 hs antes del turno.
- Historial por clienta (los datos ya se guardan; falta la vista).
