-- =====================================================================
--  Piel con Valen — borrar los datos de prueba
--
--  ESTO NO SE PUEDE DESHACER. Supabase no guarda una papelera.
--
--  Correr en Supabase → SQL Editor, UN PASO POR VEZ.
--  El paso 1 no borra nada: es para mirar antes de tocar.
-- =====================================================================


-- ---------------------------------------------------------------------
--  PASO 1 — MIRAR QUE HAY (no borra nada)
--
--  Pegar SOLO esto y darle Run. Devuelve una tabla con los conteos.
-- ---------------------------------------------------------------------
select 'turnos'          as tabla, count(*) as cuantos from turnos
union all select 'clientes',       count(*) from clientes
union all select 'sesiones',       count(*) from sesiones
union all select 'movimientos',    count(*) from movimientos
union all select 'inventario',     count(*) from inventario
union all select 'gastos fijos',   count(*) from gastos_fijos
union all select 'dias cerrados',  count(*) from dias_cerrados
order by tabla;


-- ---------------------------------------------------------------------
--  PASO 2 — LO QUE PEDISTE: TURNOS Y CLIENTAS
--
--  Pegar SOLO esto, en una consulta nueva.
--
--  Ojo con lo que se lleva puesto sin que lo nombres:
--
--    · Borrar CLIENTAS borra tambien su historial de SESIONES, sus fotos
--      y sus consentimientos. La base los tiene atados en cascada.
--
--    · Los MOVIMIENTOS de economia NO se borran. Los que hayan salido de
--      un "Atendida y cobrada" quedan, y se van a seguir viendo como
--      plata que entro. Si eran de prueba, mira el paso 3.
-- ---------------------------------------------------------------------
delete from turnos;
delete from clientes;   -- arrastra sesiones, fotos y consentimientos


-- ---------------------------------------------------------------------
--  PASO 3 — OPCIONAL: LA PLATA DE PRUEBA
--
--  Solo si tambien cargaste ventas, gastos o productos para probar.
--  Correr una linea por vez, la que corresponda.
--
--  NO borra: tratamientos, precios, horarios ni la configuracion de la
--  web. Eso es lo que Valen cargo de verdad y no se toca.
-- ---------------------------------------------------------------------
-- delete from movimientos;    -- ingresos y gastos cargados en Economia
-- delete from inventario;     -- productos de reventa
-- delete from gastos_fijos;   -- alquiler, internet, lo que se repite
-- delete from dias_cerrados;  -- vacaciones o feriados de prueba


-- ---------------------------------------------------------------------
--  LO QUE SIGUE INTACTO PASE LO QUE PASE
--
--    tratamientos    los nombres, precios y extras del catalogo
--    agenda          dias, horarios de cada dia, anticipacion, como trabaja
--    configuracion   todo lo de "Mi web": textos, contacto, preguntas
--
--  Ninguna de esas tablas se toca en este archivo.
-- =====================================================================
