-- =====================================================================
--  Piel con Valen — horarios día por día + cómo trabaja
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  Dos cambios sobre la tabla `agenda`, los dos en la misma fila:
--
--  1. HORARIOS DÍA POR DÍA. Hasta ahora había una sola lista de horas
--     para toda la semana. Valen no atiende en la misma franja todos los
--     días —un día entra más tarde, el sábado corta al mediodía— y la
--     única salida era cargar la unión de todas las horas y después ir
--     cerrando a mano las que no correspondían.
--
--  2. CÓMO TRABAJA. En la web había siete pasos numerados, iguales para
--     todo el mundo, que decían algo que no es cierto: que toda sesión
--     es igual a la anterior. Lo reemplaza un texto en primera persona.
--
--  NO borra nada. `horarios` y `pasos_base` quedan donde están: si hay
--  que volver a la versión anterior del sitio, sigue leyendo de ahí.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. COLUMNAS NUEVAS
--
--    `horarios_por_dia` es un objeto { "1": ["09:00", ...] }, donde la
--    clave es el día de la semana con domingo = 0, igual que el resto
--    del código. jsonb y no un array porque los días no son correlativos
--    ni empiezan en 1.
-- ---------------------------------------------------------------------
alter table agenda
  add column if not exists horarios_por_dia jsonb not null default '{}'::jsonb;

alter table agenda
  add column if not exists como_trabajo text not null default '';


-- ---------------------------------------------------------------------
-- 2. TRAER LO QUE YA HABÍA
--
--    Cada día hábil arranca con los horarios que hoy usa toda la semana:
--    después de correr esto la agenda funciona EXACTAMENTE igual que
--    antes, y recién cuando Valen toque un día ese día se separa del
--    resto.
-- ---------------------------------------------------------------------
update agenda
set horarios_por_dia = (
  select coalesce(jsonb_object_agg(dia::text, to_jsonb(agenda.horarios)), '{}'::jsonb)
  from unnest(agenda.dias_habiles) as dia
)
where id = 1
  and horarios_por_dia = '{}'::jsonb;


-- ---------------------------------------------------------------------
-- 3. TEXTO DE ARRANQUE
--
--    El mismo que trae el código como respaldo. Cada renglón es un
--    párrafo en la web.
--
--    VALEN: reescribilo con tus palabras desde el panel, en Horarios.
-- ---------------------------------------------------------------------
update agenda
set como_trabajo =
  'No hay dos pieles iguales, así que no hago siempre lo mismo. Antes de empezar te miro la piel de cerca, te pregunto qué usás, qué te molesta y qué esperás de la sesión.
Con eso armo el tratamiento de ese día: cuánto profundizo la limpieza, qué activos uso, hasta dónde llego con las extracciones. Si algo te incomoda, frenamos y lo cambiamos ahí mismo.
Por eso dos sesiones del mismo tratamiento no son idénticas: lo que cambia es tu piel, y el trabajo se acomoda a eso.'
where id = 1
  and btrim(como_trabajo) = '';


-- ---------------------------------------------------------------------
-- 4. CONTROL
--    Debería devolver una fila con un horario por cada día hábil.
-- ---------------------------------------------------------------------
select dias_habiles, horarios_por_dia, como_trabajo from agenda where id = 1;
