export const UtilData = [
  {
    currency: {
      value: "Moneda",
      currencies: [
        {
          id: 1,
          value: "Soles",
          alias: "PEN",
        },
        {
          id: 2,
          value: "Dólares",
          alias: "USD",
        },
        {
          id: 3,
          value: "Peso Colombiano",
          alias: "COP",
        },
      ],
    },
    method_payment: {
      value: "Forma de Pago",
      methods: [
        {
          id: 1,
          value: "Efectivo",
        },
        {
          id: 2,
          value: "Trans. Bancaria",
        },
        {
          id: 3,
          value: "Crédito",
        },
        {
          id: 4,
          value: "Contra Entrega",
        },
        {
          id: 5,
          value: "Intercambio",
        },
      ],
    },
    delivery_time: {
      value: "Tiempo de Entrega",
      times: [
        {
          id: 1,
          value: "Inmediato",
          days: 0,
        },
        {
          id: 2,
          value: "2 Días",
          days: 2,
        },
        {
          id: 3,
          value: "4 Días",
          days: 4,
        },
        {
          id: 4,
          value: "7 Días",
          days: 7,
        },
        {
          id: 5,
          value: "15 Días",
          days: 15,
        },
        {
          id: 6,
          value: "Mas de 15 Días",
          days: 999,
        },
      ],
    },
    type_bidders: {
      value: "Tipo de Postores",
      bidders: [
        {
          id: 1,
          value: "Cualquier Usuario",
        },
        {
          id: 2,
          value: "Empresas Premium",
        },
        {
          id: 3,
          value: "Empresas Certificadas",
        },
      ],
    },
    types_plans: {
      value: "Tipos de Plan",
      plans: [
        {
          id: 1,
          value: "Free",
        },
        {
          id: 2,
          value: "Premium",
        },
      ],
    },
    requeriment_state: {
      value: "Estados del Requerimiento",
      states: [
        {
          id: 1,
          value: "Publicado",
        },
        {
          id: 2,
          value: "Atendido",
        },
        {
          id: 3,
          value: "Culminado",
        },
        {
          id: 4,
          value: "Desierto",
        },
        {
          id: 5,
          value: "Expirado",
        },
        {
          id: 6,
          value: "Cancelado",
        },
        {
          id: 7,
          value: "Eliminado",
        },
        {
          id: 8,
          value: "En Disputa",
        },
      ],
    },
    TimeMeasurement: {
      value: "Medición del Tiempo",
      types: [
        {
          id: 1,
          value: "Dias",
        },
        {
          id: 2,
          value: "Meses",
        },
        {
          id: 3,
          value: "Años",
        },
      ],
    },
    stateProduct: {
      value: "Estado del Producto",
      states: [
        {
          id: 1,
          value: "Nuevo",
        },
        {
          id: 2,
          value: "Usado",
        },
      ],
    },
    stateOffer: {
      value: "Estado de la Oferta",
      states: [
        {
          id: 1,
          value: "Activo",
        },
        {
          id: 2,
          value: "Ganador",
        },
        {
          id: 3,
          value: "Finalizado",
        },
        {
          id: 4,
          value: "En Disputa",
        },
        {
          id: 5,
          value: "Cancelado",
        },
        {
          id: 7,
          value: "Eliminado",
        },
      ],
    },
  },
];
