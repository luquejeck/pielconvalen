# Imágenes

## ⚠ El nombre del archivo importa, y mucho

Los archivos tienen que llamarse **exactamente** como dice esta guía:
todo en minúscula y con la extensión que figura acá.

- `valen.jpg` ✅
- `Valen.jpeg` ❌ (mayúscula y extensión distinta)
- `valen.JPG` ❌

Si el nombre no coincide, **el sitio no compila y el deploy falla**. No es
un descuido del código: es a propósito. La foto se importa por su nombre
para que, cuando la cambies, la dirección lleve un código nuevo y ninguna
caché pueda seguir mostrando la anterior. El precio de esa garantía es que
el nombre no puede variar.

Si tenés una foto que se llama distinto, renombrala antes de copiarla acá.
En Windows: clic derecho → Cambiar nombre. Ojo que Windows a veces esconde
la extensión; conviene activar "Extensiones de nombre de archivo" en la
pestaña Vista del explorador.

**El peso no importa.** Podés subir la foto tal como sale de la cámara,
aunque pese varios MB: el sitio la achica solo y a la clienta le llegan
unos 10 KB. No hace falta que la comprimas.

---

Poné acá las fotos con EXACTAMENTE estos nombres y aparecen solas en la web.
Si un archivo no está, esa sección muestra el degradado y se ve bien igual.

| Archivo      | Dónde se ve                  | Qué conviene que muestre                       |
|--------------|------------------------------|------------------------------------------------|
| `hero.jpg`   | detrás del nombre de Valen   | el consultorio, la camilla, textura de piel    |
| `reservas.jpg` | detrás del calendario      | algo suave: toallas, frascos, luz natural      |

## Fotos que se ven nítidas (no son fondo)

Estas dos van en la sección "Quién te va a atender", sin desenfoque.
**Si no están, la sección no aparece** y la web se ve bien igual; el día
que las subas aparece sola, sin tocar código.

| Archivo           | Qué conviene que muestre                                  |
|-------------------|-----------------------------------------------------------|
| `valen.jpg`       | Valen sonriendo, de frente, con buena luz                 |
| `consultorio.jpg` | la camilla y el espacio, que se vea limpio y luminoso     |

Acá sí importa la calidad: son las únicas fotos que se ven con detalle.
Horizontales, 800 x 600 px o más, menos de 500 KB. Sacadas con el celular
de día, cerca de una ventana, alcanza y sobra.

## Recomendaciones

- **Formato:** .jpg (o .webp si querés que pese menos)
- **Tamaño:** 1600 x 1000 px aprox, horizontal
- **Peso:** menos de 500 KB cada una. Si pesan más, la web tarda en abrir
  en datos móviles, que es como entra la mayoría.
- Las fotos van **difuminadas y con un velo encima**, así que no importa
  si no son perfectas: se ve la atmósfera, no el detalle.
- Evitá fotos con texto o caras muy nítidas: al desenfocarse quedan raras.

## Cómo se ajusta la intensidad

En `components/Hero.tsx` y `components/Reservas.tsx`, la prop `intensidad`
va de 0 a 100. Más alto = foto más visible, texto menos legible.
Valores actuales: hero 45, reservas 22.

## Fotos actuales (provisorias)

Son de banco, bajadas de Unsplash bajo su licencia (uso comercial permitido,
sin atribución obligatoria). Están para que la web no se vea vacía:
**conviene reemplazarlas por fotos reales del consultorio** apenas se pueda.

| Archivo | Qué muestra | Origen |
|---|---|---|
| `hero.jpg` | aplicación de máscara facial | unsplash.com/photos/photo-1570172619644-dfd03ed5d881 (Rosa Rafael) |
| `reservas.jpg` | toalla, velas y difusor | unsplash.com/photos/photo-1620733723572-11c53f73a416 (Mediamodifier) |

Para reemplazarlas: borrá el archivo y poné el tuyo con el mismo nombre.

---

## Fotos de la galería (provisorias)

Estas NO van en esta carpeta: viven en Supabase y se cargan desde el panel,
en `/admin/galeria`. Se anotan acá para que quede asentado que son de banco
y hay que reemplazarlas.

Son de Pexels, licencia de uso comercial libre y sin atribución obligatoria.
Están **sin publicar**: no se ven en la web hasta que alguien las publique.

| Título en el panel | Qué muestra | Origen |
|---|---|---|
| La cabina, durante una sesión | cosmetóloga trabajando con espátula ultrasónica | pexels.com/photo/7446659 |
| Aplicación de máscara | manos con guantes aplicando producto | pexels.com/photo/12115040 |
| Con qué se trabaja | gua sha, rodillo y frasco sobre mármol | pexels.com/photo/5928033 |
| Aparatología | equipo de radiofrecuencia en uso | pexels.com/photo/3865548 |

**Reemplazarlas es lo primero que conviene hacer.** La sección se llama "El
consultorio por dentro" y dice "dónde vas a estar": mientras sean de banco,
le está mostrando a la clienta un lugar que no es el de Valen. Con cinco
fotos sacadas con el celular cerca de una ventana alcanza. Se borran y se
suben las nuevas desde el mismo panel.
