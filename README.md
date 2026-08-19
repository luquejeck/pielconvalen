# Piel con Valen — Web de reservas

Single page en **Next.js 15 (App Router) + Tailwind CSS v4**, mobile-first, con módulo de
turnos que termina en un mensaje prearmado de WhatsApp.

---

## 1. Estructura de carpetas

```
piel-con-valen/
├── app/
│   ├── layout.tsx                    # fuentes, metadata SEO, <html lang="es-AR">
│   ├── page.tsx                      # ensambla las 5 secciones
│   ├── globals.css                   # tokens de color (@theme de Tailwind v4)
│   └── api/
│       └── disponibilidad/
│           └── route.ts              # ÚNICO punto a cambiar al conectar la DB
├── components/
│   ├── Header.tsx                    # nav sticky + CTA
│   ├── Hero.tsx                      # 1. Hero
│   ├── Beneficios.tsx                # 2. Info + aclaración de duración
│   ├── Tratamientos.tsx              # 3. Cards de tratamientos
│   ├── Reservas.tsx                  # 4. Módulo de reservas (pasos 1-2-3)
│   ├── Calendario.tsx                #    └─ calendario, estado libre/ocupado
│   ├── ReservaContext.tsx            # estado compartido cards ↔ reservas
│   ├── Footer.tsx                    # 5. Dirección, WA, IG
│   └── iconos.tsx                    # SVGs inline (sin librerías)
├── lib/
│   ├── config.ts                     # datos del consultorio + agenda (horarios, días)
│   ├── tratamientos.ts               # catálogo: precios y pasos
│   ├── disponibilidad.ts             # tipos + mock + fetch + reglas de reserva
│   ├── fechas.ts                     # helpers de fecha (sin dependencias)
│   └── whatsapp.ts                   # armado del mensaje y del link wa.me
├── public/
├── .env.example
├── next.config.mjs
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

**Regla de oro:** para cambiar precios, pasos, horarios de atención o datos de contacto
sólo se tocan archivos de `lib/`. La UI no se toca.

---

## 2. Correr el proyecto

```bash
npm install
```

```bash
npm run dev
```

Abrir http://localhost:3000

> Requiere Node.js 18.18+ (recomendado 20 LTS). En esta máquina todavía no está instalado:
> descargarlo de https://nodejs.org antes del `npm install`.

---

## 3. Cómo funciona el módulo de reservas

Flujo en 3 pasos, todo del lado del cliente:

1. **Tratamiento** → `ReservaContext` guarda el `tratamientoId` (las cards de la sección 3
   escriben en el mismo estado, por eso "Reservar este" te lleva al módulo ya seleccionado).
2. **Fecha y hora** → `<Calendario />` pide la disponibilidad a `/api/disponibilidad`,
   pinta la grilla del mes y los horarios del día elegido.
3. **Confirmar** → `linkWhatsApp()` arma `https://wa.me/<número>?text=<mensaje>` y el botón
   abre WhatsApp con todo escrito.

### Estados de un turno

| Estado | De dónde sale | Cómo se ve |
|---|---|---|
| `libre` | la API lo devuelve como libre | botón blanco con borde, clickeable |
| `ocupado` | bloqueado por la admin o ya reservado | tachado, gris, `disabled` |
| fuera de agenda | día no hábil según `AGENDA.diasHabiles` | el día no aparece disponible |
| muy sobre la hora | `AGENDA.anticipacionMinimaHs` (24 hs) | se muestra como ocupado |
| fuera de ventana | más de `AGENDA.ventanaDias` (60 días) | navegación de mes bloqueada |

### La simulación

`lib/disponibilidad.ts` genera el mock con un **hash determinístico** de `fecha|hora`: el
mismo día siempre da el mismo resultado (no parpadea entre renders) y ~40% de los turnos
aparecen ocupados. También hay un objeto `BLOQUEOS_MANUALES` para probar bloqueos concretos:

```ts
const BLOQUEOS_MANUALES: Record<string, string[]> = {
  "2026-08-25": ["09:00", "11:30"], // dos turnos tomados
  "2026-08-26": ["*"],              // día cerrado completo
};
```

---

## 4. Backend: conectar Vercel con una base de datos

### Recomendación: **Vercel + Supabase (Postgres)**

Es la combinación con menos fricción para este caso: plan gratuito suficiente para un
consultorio, panel web para cargar turnos a mano desde el celular (Table Editor), auth
incluida si más adelante querés un panel propio, e integración nativa con Vercel
(las variables de entorno se inyectan solas).

Alternativas válidas: **Neon** (Postgres serverless, mismo esquema) o **Vercel KV/Redis**
si sólo se guardan bloqueos y no historial.

### Esquema mínimo

```sql
-- Turnos ocupados / bloqueos cargados por la admin
create table turnos (
  id          uuid primary key default gen_random_uuid(),
  fecha       date not null,
  hora        text not null,                    -- "09:00"
  estado      text not null default 'ocupado',  -- 'ocupado' | 'bloqueado'
  cliente     text,
  tratamiento text,
  notas       text,
  creado_en   timestamptz default now(),
  unique (fecha, hora)                          -- evita dobles reservas
);

-- Días cerrados completos (vacaciones, feriados)
create table dias_cerrados (
  fecha  date primary key,
  motivo text
);

alter table turnos enable row level security;
alter table dias_cerrados enable row level security;

-- El front sólo lee; la escritura queda para la admin (service role / panel de Supabase)
create policy "lectura publica" on turnos for select using (true);
create policy "lectura publica" on dias_cerrados for select using (true);
```

### Cambio en el código (un solo archivo)

En `app/api/disponibilidad/route.ts`, reemplazar la línea del mock por:

```ts
import { createClient } from "@supabase/supabase-js";
import { AGENDA } from "@/lib/config";
import { claveFecha, sumarDias } from "@/lib/fechas";
import type { MapaDisponibilidad } from "@/lib/disponibilidad";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const hasta = sumarDias(desde, dias);

const [{ data: turnos }, { data: cerrados }] = await Promise.all([
  supabase
    .from("turnos")
    .select("fecha, hora")
    .gte("fecha", claveFecha(desde))
    .lte("fecha", claveFecha(hasta)),
  supabase
    .from("dias_cerrados")
    .select("fecha")
    .gte("fecha", claveFecha(desde))
    .lte("fecha", claveFecha(hasta)),
]);

const ocupados = new Set((turnos ?? []).map((t) => `${t.fecha}|${t.hora}`));
const diasCerrados = new Set((cerrados ?? []).map((d) => d.fecha));

const mapa: MapaDisponibilidad = {};
for (let i = 0; i < dias; i++) {
  const fecha = sumarDias(desde, i);
  if (!AGENDA.diasHabiles.includes(fecha.getDay())) continue;

  const clave = claveFecha(fecha);
  if (diasCerrados.has(clave)) continue;

  mapa[clave] = AGENDA.horarios.map((hora) => ({
    hora,
    estado: ocupados.has(`${clave}|${hora}`) ? "ocupado" : "libre",
  }));
}

return NextResponse.json(mapa);
```

El resto del front (calendario, resumen, link de WhatsApp) **no cambia**: el contrato de la
API sigue siendo el mismo objeto `{ "YYYY-MM-DD": [{ hora, estado }] }`.

### Deploy en Vercel

1. Subir el repo a GitHub → *Import Project* en Vercel (detecta Next.js solo).
2. Storage → *Connect Store* → Supabase/Neon: Vercel inyecta las variables de entorno.
3. Agregar a mano `NEXT_PUBLIC_WHATSAPP=5491122943672`.
4. Deploy. La API route corre en el edge/serverless sin configuración extra.

### Cómo carga los turnos la admin

- **Etapa 1 (hoy mismo):** Valen entra al Table Editor de Supabase desde el celular y agrega
  filas en `turnos` cuando confirma un turno por WhatsApp. Cero código.
- **Etapa 2 (cuando haga falta):** ruta `/admin` protegida con Supabase Auth, que muestre el
  mismo `<Calendario />` en modo edición: tocar un horario hace toggle libre/ocupado con un
  `POST /api/turnos`. El componente ya está aislado, así que se reutiliza tal cual.

### Próximo paso natural

Cerrar el ciclo: en vez de sólo abrir WhatsApp, hacer un `POST /api/turnos` que cree la fila
en estado `pendiente` **y** abra WhatsApp. Así el horario queda bloqueado en el momento y no
depende de que Valen lo cargue después. La restricción `unique (fecha, hora)` evita que dos
personas tomen el mismo turno.
