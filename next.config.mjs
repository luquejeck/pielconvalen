/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    /*
      Next solo genera las calidades que estan declaradas aca. La 45 es
      para los fondos de FondoImagen: van desenfocados y al 30% de
      opacidad, asi que bajarles la calidad no se nota y les saca la
      mayor parte del peso. La 75 es la que usa el resto por defecto.
    */
    qualities: [45, 75],
    formats: ["image/avif", "image/webp"],

    /*
      NO BORRAR: sin esto la galería se ve rota.

      Las fotos de la galería no viven en /public sino en Supabase
      Storage, y Next se niega a optimizar imágenes de un dominio que no
      esté declarado acá. Es su defensa para que nadie use tu optimizador
      como proxy gratis de imágenes ajenas.

      No falla en el build ni deja rastro en los registros del servidor:
      la comprobación pasa al pedir cada imagen, y devuelve
      400 INVALID_IMAGE_OPTIMIZE_REQUEST. En la pantalla eso se ve como
      la tarjeta armada, con su título, y el recuadro de la foto vacío.

      Solo se permite la carpeta pública de Storage: las fichas clínicas
      viven en un bucket privado y no tienen por qué pasar por acá.
    */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
