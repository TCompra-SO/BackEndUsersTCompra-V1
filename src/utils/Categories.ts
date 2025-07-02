export const categories = [
  // Construcción e Infraestructura - parentId: 1
  { id: 1, value: "Materiales de Construcción", parentId: 1, Icon: "🏗️" },
  {
    id: 2,
    value: "Maquinaria y Equipos de Construcción",
    parentId: 1,
    Icon: "🏭",
  },
  { id: 3, value: "Mano de Obra Especializada", parentId: 1, Icon: "👷" },
  { id: 4, value: "Arquitectura y Diseño", parentId: 1, Icon: "📐" },
  {
    id: 5,
    value: "Servicios de Ingeniería y Supervisión de Obras",
    parentId: 1,
    Icon: "📏",
  },
  {
    id: 6,
    value: "Mantenimiento y Reparación de Obras",
    parentId: 1,
    Icon: "🔧",
  },
  {
    id: 7,
    value: "Transporte de Materiales y Escombros",
    parentId: 1,
    Icon: "🚚",
  },
  { id: 8, value: "Limpieza de Obras y Post-Obra", parentId: 1, Icon: "🧹" },
  {
    id: 9,
    value: "Seguridad y Señalización de Obras",
    parentId: 1,
    Icon: "🛡️",
  },

  // Minería - parentId: 2
  {
    id: 10,
    value: "Maquinaria Pesada y Equipos Especializados",
    parentId: 2,
    Icon: "🏭",
  },
  {
    id: 11,
    value: "Insumos y Repuestos Industriales",
    parentId: 2,
    Icon: "🔩",
  },
  {
    id: 12,
    value: "Servicios Especializados para Minería",
    parentId: 2,
    Icon: "👷",
  },
  {
    id: 13,
    value: "Consultorías y Auditorías Ambientales y de Seguridad",
    parentId: 2,
    Icon: "🧑‍💼",
  },
  {
    id: 14,
    value: "Servicios de Transporte y Logística para Minería",
    parentId: 2,
    Icon: "🚜",
  },
  {
    id: 15,
    value: "Seguridad Industrial y Protección Personal",
    parentId: 2,
    Icon: "🔒",
  },
  {
    id: 16,
    value: "Mantenimiento de Maquinaria y Equipos",
    parentId: 2,
    Icon: "⚙️",
  },
  {
    id: 17,
    value: "Certificaciones, Permisos y Trámites",
    parentId: 2,
    Icon: "🗂️",
  },

  // Agricultura y Agroindustria - parentId: 3
  { id: 18, value: "Insumos Agrícolas", parentId: 3, Icon: "🌾" },
  { id: 19, value: "Maquinaria y Equipos Agrícolas", parentId: 3, Icon: "🚜" },
  {
    id: 20,
    value: "Servicios de Riego y Fertilización",
    parentId: 3,
    Icon: "💧",
  },
  { id: 21, value: "Ganadería y Cría de Animales", parentId: 3, Icon: "🐄" },
  {
    id: 22,
    value: "Procesamiento y Envasado de Alimentos",
    parentId: 3,
    Icon: "📦",
  },
  {
    id: 23,
    value: "Transporte y Logística Agroindustrial",
    parentId: 3,
    Icon: "🚚",
  },
  { id: 24, value: "Servicios Técnicos Agro", parentId: 3, Icon: "👨‍🌾" },

  // Manufactura e Industria - parentId: 4
  {
    id: 25,
    value: "Maquinaria y Equipos Industriales",
    parentId: 4,
    Icon: "⚙️",
  },
  { id: 26, value: "Insumos y Materias Primas", parentId: 4, Icon: "🔩" },
  { id: 27, value: "Producción, Maquila y Ensamble", parentId: 4, Icon: "🏭" },
  {
    id: 28,
    value: "Mantenimiento y Reparación Industrial",
    parentId: 4,
    Icon: "🔧",
  },
  {
    id: 29,
    value: "Logística y Almacenaje Industrial",
    parentId: 4,
    Icon: "🚚",
  },
  {
    id: 30,
    value: "Servicios de Certificación y Calidad",
    parentId: 4,
    Icon: "🧑‍💼",
  },

  // Comercio y Retail - parentId: 5
  { id: 31, value: "Tiendas, Boutiques y Bazar", parentId: 5, Icon: "🏪" },
  { id: 32, value: "Ferreterías y Suministros", parentId: 5, Icon: "🔧" },
  {
    id: 33,
    value: "Carnicerías, Verdulerías y Mercados",
    parentId: 5,
    Icon: "🥩",
  },
  { id: 34, value: "Venta y Alquiler de Vehículos", parentId: 5, Icon: "🚗" },
  {
    id: 35,
    value: "Mercados Mayoristas y Distribuidores",
    parentId: 5,
    Icon: "🛒",
  },
  { id: 36, value: "Servicios de Limpieza Comercial", parentId: 5, Icon: "🧹" },
  {
    id: 37,
    value: "Equipos de Punto de Venta y Software de Retail",
    parentId: 5,
    Icon: "💻",
  },

  // Transporte y Logística - parentId: 6
  { id: 38, value: "Transporte de Carga y Fletes", parentId: 6, Icon: "🚚" },
  {
    id: 39,
    value: "Transporte Aéreo de Carga y Pasajeros",
    parentId: 6,
    Icon: "✈️",
  },
  { id: 40, value: "Mensajería y Courier", parentId: 6, Icon: "📦" },
  {
    id: 41,
    value: "Almacenes y Centros de Distribución",
    parentId: 6,
    Icon: "🏢",
  },
  {
    id: 42,
    value: "Mantenimiento de Flotas y Vehículos",
    parentId: 6,
    Icon: "🛠️",
  },
  {
    id: 43,
    value: "Servicios de Aduanas y Comercio Exterior",
    parentId: 6,
    Icon: "🗂️",
  },

  // Tecnología e Informática - parentId: 7
  { id: 44, value: "Hardware y Equipos Informáticos", parentId: 7, Icon: "💻" },
  {
    id: 45,
    value: "Muebles y Equipos de Oficina Tecnológica",
    parentId: 7,
    Icon: "🖥️",
  },
  { id: 46, value: "Telecomunicaciones e Internet", parentId: 7, Icon: "📡" },
  {
    id: 47,
    value: "Desarrollo de Software y Aplicaciones",
    parentId: 7,
    Icon: "🧑‍💻",
  },
  { id: 48, value: "Ciberseguridad y Backups", parentId: 7, Icon: "🔒" },
  {
    id: 49,
    value: "Soporte Técnico y Mantenimiento IT",
    parentId: 7,
    Icon: "🛠️",
  },

  // Salud y Bienestar - parentId: 8
  { id: 50, value: "Servicios Médicos y Clínicas", parentId: 8, Icon: "🏥" },
  { id: 51, value: "Servicios Odontológicos", parentId: 8, Icon: "🦷" },
  { id: 52, value: "Estética, Spa y Belleza", parentId: 8, Icon: "💅" },
  { id: 53, value: "Farmacias y Droguerías", parentId: 8, Icon: "💊" },
  { id: 54, value: "Laboratorios y Equipos Médicos", parentId: 8, Icon: "🧪" },
  { id: 55, value: "Servicios Veterinarios", parentId: 8, Icon: "🐶" },

  // Educación y Cultura - parentId: 9
  {
    id: 56,
    value: "Colegios, Universidades e Institutos",
    parentId: 9,
    Icon: "🏫",
  },
  { id: 57, value: "Editoriales y Librerías", parentId: 9, Icon: "📚" },
  { id: 58, value: "Capacitación, Cursos y Talleres", parentId: 9, Icon: "👨‍🏫" },
  {
    id: 59,
    value: "Servicios Culturales y Artísticos",
    parentId: 9,
    Icon: "🎨",
  },
  {
    id: 60,
    value: "Servicios de Impresión y Editorial Gráfica",
    parentId: 9,
    Icon: "🖨️",
  },

  // Servicios Profesionales y Empresariales - parentId: 10
  {
    id: 61,
    value: "Asesoría Empresarial y Consultoría",
    parentId: 10,
    Icon: "👨‍💼",
  },
  {
    id: 62,
    value: "Contabilidad, Finanzas y Auditorías",
    parentId: 10,
    Icon: "📊",
  },
  { id: 63, value: "Publicidad, Marketing y Medios", parentId: 10, Icon: "📣" },
  { id: 64, value: "Estudios Contables y Legales", parentId: 10, Icon: "🗂️" },
  {
    id: 65,
    value: "Seguridad y Vigilancia Empresarial",
    parentId: 10,
    Icon: "🔐",
  },

  // Turismo y Entretenimiento - parentId: 11
  {
    id: 66,
    value: "Hoteles, Hostales y Alojamiento",
    parentId: 11,
    Icon: "🏨",
  },
  { id: 67, value: "Restaurantes, Bares y Catering", parentId: 11, Icon: "🍽️" },
  {
    id: 68,
    value: "Eventos, Espectáculos y Alquiler de Locales",
    parentId: 11,
    Icon: "🎉",
  },
  { id: 69, value: "Agencias de Viajes y Tours", parentId: 11, Icon: "✈️" },
  {
    id: 70,
    value: "Producción Audiovisual y Fotografía",
    parentId: 11,
    Icon: "🎬",
  },

  // Energía y Medio Ambiente - parentId: 12
  {
    id: 71,
    value: "Energías Renovables y Convencionales",
    parentId: 12,
    Icon: "🔋",
  },
  {
    id: 72,
    value: "Servicios Ambientales y Sostenibilidad",
    parentId: 12,
    Icon: "♻️",
  },
  { id: 73, value: "Reciclaje y Manejo de Residuos", parentId: 12, Icon: "🔧" },
  {
    id: 74,
    value: "Consultoría en Eficiencia Energética",
    parentId: 12,
    Icon: "🌿",
  },
];

export const parentCategories = [
  { id: 1, value: "Construcción e Infraestructura", Icon: "⚒️" },
  { id: 2, value: "Minería", Icon: "⛏️" },
  { id: 3, value: "Agricultura y Agroindustria", Icon: "🌱" },
  { id: 4, value: "Manufactura e Industria", Icon: "🏭" },
  { id: 5, value: "Comercio y Retail", Icon: "🛍️" },
  { id: 6, value: "Transporte y Logística", Icon: "🚚" },
  { id: 7, value: "Tecnología e Informática", Icon: "🧑‍💻" },
  { id: 8, value: "Salud y Bienestar", Icon: "❤️‍🩹" },
  { id: 9, value: "Educación y Cultura", Icon: "🎓" },
  { id: 10, value: "Servicios Profesionales y Empresariales", Icon: "💼" },
  { id: 11, value: "Turismo y Entretenimiento", Icon: "🌴" },
  { id: 12, value: "Energía y Medio Ambiente", Icon: "⚡️" },
];
