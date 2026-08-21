# Imágenes de fondo

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
