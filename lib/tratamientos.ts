export type Tratamiento = {
  id: string;
  nombre: string;
  nombreCorto: string;
  precio: number;
  duracion: string;
  destacado?: boolean;
  descripcion: string;
  pasos: string[];
};

const PASOS_HFP = [
  "Preparación de la piel",
  "Exfoliación mecánica",
  "Máscara de ácidos o enzimática",
  "Extracciones",
  "Descongestión + Alta frecuencia",
  "Hidratación",
  "Protector solar (FPS)",
];

export const TRATAMIENTOS: Tratamiento[] = [
  {
    id: "hfp",
    nombre: "Higiene Facial Profunda",
    nombreCorto: "HFP",
    precio: 34000,
    duracion: "1.5 a 2 hs",
    descripcion:
      "El protocolo base: limpieza profunda, extracciones y descongestión para una piel más sana y luminosa.",
    pasos: PASOS_HFP,
  },
  {
    id: "hfp-acidos",
    nombre: "HFP con Ácidos",
    nombreCorto: "HFP + Ácidos",
    precio: 37000,
    duracion: "1.5 a 2 hs",
    descripcion:
      "Suma topicación de ácidos para renovar la piel y trabajar textura, manchas y marcas.",
    pasos: [...PASOS_HFP, "Topicación de ácidos"],
  },
  {
    id: "hf-dermaplaning",
    nombre: "HF con Dermaplaning",
    nombreCorto: "HF + Dermaplaning",
    precio: 39500,
    duracion: "1.5 a 2 hs",
    descripcion:
      "Incorpora dermaplaning: remueve vello y células muertas, dejando la piel uniforme y con efecto glow inmediato.",
    pasos: [...PASOS_HFP, "Dermaplaning", "Topicación de ácidos"],
  },
  {
    id: "hf-microneedling",
    nombre: "HF con Microneedling",
    nombreCorto: "HF + Microneedling",
    precio: 42000,
    duracion: "1.5 a 2 hs",
    descripcion:
      "Suma microneedling para potenciar la penetración de activos y estimular la producción de colágeno.",
    pasos: [
      ...PASOS_HFP,
      "Topicación de ácidos",
      "Activos con Microneedling",
    ],
  },
  {
    id: "full-glow",
    nombre: "Full Glow",
    nombreCorto: "Full Glow",
    precio: 47000,
    duracion: "1.5 a 2 hs",
    destacado: true,
    descripcion:
      "El tratamiento más completo: combina todos los pasos en una sola sesión para el máximo resultado.",
    pasos: [
      ...PASOS_HFP,
      "Dermaplaning",
      "Topicación de ácidos",
      "Activos con Microneedling",
    ],
  },
];

export const formatearPrecio = (precio: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(precio);

export const buscarTratamiento = (id: string | null) =>
  TRATAMIENTOS.find((t) => t.id === id) ?? null;
