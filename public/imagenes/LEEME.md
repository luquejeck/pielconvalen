# Imágenes de fondo

Poné acá las fotos con EXACTAMENTE estos nombres y aparecen solas en la web.
Si un archivo no está, esa sección muestra el degradado y se ve bien igual.

| Archivo      | Dónde se ve                  | Qué conviene que muestre                       |
|--------------|------------------------------|------------------------------------------------|
| `hero.jpg`   | detrás del nombre de Valen   | el consultorio, la camilla, textura de piel    |
| `reservas.jpg` | detrás del calendario      | algo suave: toallas, frascos, luz natural      |

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
