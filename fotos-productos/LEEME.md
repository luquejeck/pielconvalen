# Fotos de los productos

**Acá van las fotos de los productos, tal como salen de la cámara.**

Esta carpeta es la de los originales. Poné el archivo acá, corrés un
comando, y el sitio se queda con una versión chica y pareja. Los
originales no se suben a internet: solo viven en tu máquina.

---

## Cómo cambiar una foto

**1. Ponela acá con el nombre del producto.**

El nombre del archivo es lo único que identifica al producto. Si la foto
se llama `joseon-glow-serum.jpg`, es la del Glow Serum. No hay que anotar
nada en ningún otro lado.

Para ver la lista completa de nombres:

```bash
npm run fotos:lista
```

La extensión puede ser `.jpg`, `.jpeg`, `.png`, `.webp` o `.heic` (la de
los iPhone). Lo que importa es la parte de antes del punto.

**2. Corré el comando.**

```bash
npm run fotos
```

Te dice cuántas quedaron listas, cuáles productos siguen sin foto, y si
algún archivo tiene un nombre que no coincide con ningún producto — que
es el error más común, y sin ese aviso la foto simplemente no aparecía en
la web sin que nada dijera por qué.

**3. Listo.** Las fotos procesadas quedan en `public/imagenes/productos/`
y ya se ven en el sitio. Esas sí se suben.

Podés reemplazar una sola o las dieciséis: el comando procesa lo que
encuentre y no toca el resto.

---

## Las imágenes de marca van en otra carpeta

En `fotos-marcas/` (al lado de esta) van las piezas de marca que usa el
mosaico de la portada: el banner de Medicube, la línea completa de Beauty
of Joseon, el logo de AHC. Son otra cosa que las fotos de producto —traen
su propio fondo y su propia luz— así que el comando no las aclara ni les
funde los bordes: solo las recorta a cuadrado y las achica.

El nombre del archivo es la marca en minúscula y con guiones:
`beauty-of-joseon.jpg`, `d-alba.jpg`, `medicube.jpg`. El mismo
`npm run fotos:lista` te imprime la lista al final.

Si una marca no tiene imagen propia, el mosaico usa la foto de su
producto más caro y se ve bien igual: nunca queda un hueco.

---

## Ojo con Windows

El explorador a veces esconde la extensión, así que un archivo que se ve
como `joseon-glow-serum` puede ser en realidad `joseon-glow-serum.jpg.jpg`.
Conviene activar **"Extensiones de nombre de archivo"** en la pestaña
Vista del explorador antes de renombrar nada.

Todo en minúscula y con guiones, como sale en la lista. `Joseon-Glow-Serum.jpg`
no funciona.

---

## Qué foto conviene sacar

**El peso no importa.** Subila como salga de la cámara, aunque pese 8 MB:
el comando la achica a unos 25 KB.

Lo que sí importa:

- **Cuadrada o casi.** La ficha es cuadrada y el recorte va al centro, así
  que lo que quede en los bordes se pierde. Poné el envase en el medio.
- **Fondo claro y parejo.** Una hoja blanca o la mesada, de día, cerca de
  una ventana. Sin flash.
- **Todas iguales.** Misma distancia, misma altura, mismo fondo en las
  dieciséis. La consistencia es lo que hace que una grilla parezca un
  catálogo y no dieciséis fotos sueltas.
- **El envase entero**, sin cortar, y sin la mano sosteniéndolo.

## Las fotos de ahora son provisorias

Las que están son las que mandó Valen por WhatsApp: cajas en la mano,
de noche y con flash. Se ven aceptables porque el sitio las apoya sobre
una base oscura que disimula el fondo negro, pero es un rodeo.

Con fotos sobre fondo claro se puede sacar esa base y la ficha queda
blanca entera, que es como se ve una tienda de verdad. **Si sacás fotos
nuevas con luz de día, avisá**: hay que bajar `AJUSTE` a `0` en
`scripts/preparar-fotos.mjs` para que no las aclare de más, y cambiar la
ficha para que no dibuje la base oscura.

Se probó pasar estas fotos a fondo claro de tres maneras y ninguna sirve:
levantar las sombras quema la caja y saca a la luz la mesa de atrás;
recortar el fondo por brillo deja la mano fantasma, porque la piel con
flash mide lo mismo que el envase; y agregarle un peso por posición
arregla la mano pero recorta los envases altos.
