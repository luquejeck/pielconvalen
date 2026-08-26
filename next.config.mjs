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
      Las fotos de antes/despues viven en Supabase Storage, no en
      /public. Sin declarar el host, <Image> las rechaza: es la defensa
      de Next para que nadie use tu optimizador con imagenes de
      cualquier lado.
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
