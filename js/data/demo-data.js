export const PRODUCT_CATEGORIES = [
  { id: 'entradas', label: 'Entradas' },
  { id: 'fuertes', label: 'Platos fuertes' },
  { id: 'hamburguesas', label: 'Hamburguesas' },
  { id: 'brasa', label: 'Brasa' },
  { id: 'postres', label: 'Postres' },
  { id: 'bebidas', label: 'Bebidas' }
];

export const ORDER_STATUSES = {
  pending: { label: 'Recibido', tone: 'warning' },
  preparing: { label: 'En preparación', tone: 'info' },
  ready: { label: 'Listo', tone: 'success' },
  on_the_way: { label: 'En camino', tone: 'info' },
  completed: { label: 'Entregado', tone: 'neutral' },
  cancelled: { label: 'Cancelado', tone: 'danger' }
};

export const ORDER_TYPES = {
  table: { label: 'Pedido en mesa', short: 'Mesa' },
  takeaway: { label: 'Para llevar', short: 'Llevar' },
  delivery: { label: 'Domicilio', short: 'Domicilio' }
};

export const ORDER_FLOWS = {
  table: ['pending', 'preparing', 'ready', 'completed'],
  takeaway: ['pending', 'preparing', 'ready', 'completed'],
  delivery: ['pending', 'preparing', 'ready', 'on_the_way', 'completed']
};

// Un mismo estado se comunica distinto según el canal: "Listo" en mesa es
// "listo para recoger" en barra y "listo para despacho" en domicilio.
export const STATUS_LABELS_BY_TYPE = {
  table: { ready: 'Listo en cocina', completed: 'Servido' },
  takeaway: { ready: 'Listo para recoger', completed: 'Entregado' },
  delivery: { ready: 'Listo para despacho', completed: 'Entregado' }
};

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Efectivo contra entrega', needsChange: true },
  { id: 'transfer', label: 'Transferencia (Nequi / Bancolombia)', needsChange: false },
  { id: 'card', label: 'Datáfono al entregar', needsChange: false }
];

export const DELIVERY_ZONES = [
  { id: 'getsemani', name: 'Getsemaní', fee: 6000, etaMinutes: 25 },
  { id: 'centro', name: 'Centro Histórico', fee: 7000, etaMinutes: 30 },
  { id: 'manga', name: 'Manga', fee: 10000, etaMinutes: 40 },
  { id: 'bocagrande', name: 'Bocagrande', fee: 12000, etaMinutes: 45 },
  { id: 'crespo', name: 'Crespo / Marbella', fee: 16000, etaMinutes: 55 }
];

export const DEFAULT_SETTINGS = {
  restaurantName: 'Brasa Marina',
  description: 'Cocina caribeña contemporánea en Getsemaní, Cartagena.',
  phone: '+57 300 000 0000',
  whatsapp: '573000000000',
  address: 'Calle de la Media Luna #10-42, Getsemaní, Cartagena',
  hours: 'Lun-Jue 12:00 p.m. - 10:00 p.m. | Vie-Sáb 12:00 p.m. - 11:30 p.m. | Dom 12:00 p.m. - 9:00 p.m.',
  instagram: '@brasamarina.co',
  tableCount: 20,
  deliveryEnabled: true,
  deliveryMinOrder: 45000,
  deliveryZones: DELIVERY_ZONES
};

export const DEMO_PRODUCTS = [
  {
    id: 'prod-ceviche-camaron',
    name: 'Ceviche de camarón y mango biche',
    description: 'Camarón curado en limón criollo, mango biche, cebolla morada, cilantro, ají dulce y chips de plátano.',
    price: 38000,
    image: 'assets/images/menu-ceviche-camaron.jpg',
    category: 'entradas',
    filters: ['entradas'],
    tag: 'Entrada fría',
    available: true,
    featured: false
  },
  {
    id: 'prod-empanadas-jaiba',
    name: 'Empanadas de jaiba y ají de coco',
    description: 'Masa de maíz crocante, jaiba especiada, sofrito costeño y emulsión suave de coco ahumado.',
    price: 29000,
    image: 'assets/images/menu-empanada-jaiba.jpg',
    category: 'entradas',
    filters: ['entradas'],
    tag: 'Para picar',
    available: true,
    featured: false
  },
  {
    id: 'prod-patacones-hogao',
    name: 'Patacones con hogao de camarón',
    description: 'Patacones crocantes, hogao costeño, camarón salteado, suero atollabuey y cilantro fresco.',
    price: 32000,
    image: 'assets/images/menu-ceviche-camaron.jpg',
    category: 'entradas',
    filters: ['entradas'],
    tag: 'Compartir',
    available: true,
    featured: false
  },
  {
    id: 'prod-pulpo-carbon',
    name: 'Pulpo al carbón con puré de maduro',
    description: 'Pulpo tierno terminado a la brasa, puré de plátano maduro, aceite de cilantro y ensalada cítrica.',
    price: 72000,
    image: 'assets/images/menu-pulpo-carbon.jpg',
    category: 'brasa',
    filters: ['entradas', 'brasa'],
    tag: 'Brasa',
    available: true,
    featured: false
  },
  {
    id: 'prod-pescado-brasa',
    name: 'Pescado entero a la brasa',
    description: 'Pesca del día con salsa de coco, mantequilla de limón, ensalada de tomate y yuca dorada.',
    price: 74000,
    image: 'assets/images/plato-pescado-brasa-coco.jpg',
    category: 'brasa',
    filters: ['brasa', 'fuertes'],
    tag: 'Pesca del día',
    available: true,
    featured: true
  },
  {
    id: 'prod-arroz-mariscos',
    name: 'Arroz meloso de mariscos',
    description: 'Arroz cremoso con camarón, calamar, almejas, fondo de pescado tostado y sofrito caribeño.',
    price: 64000,
    image: 'assets/images/plato-arroz-cremoso-mariscos.jpg',
    category: 'fuertes',
    filters: ['fuertes'],
    tag: 'Arroces',
    available: true,
    featured: true
  },
  {
    id: 'prod-costillas-caribe',
    name: 'Costillas caribeñas',
    description: 'Costillas glaseadas con panela, ron añejo y naranja agria, servidas con papas criollas y encurtidos.',
    price: 59000,
    image: 'assets/images/plato-costillas-caribenas.jpg',
    category: 'brasa',
    filters: ['brasa', 'fuertes'],
    tag: 'Fuego lento',
    available: true,
    featured: true
  },
  {
    id: 'prod-parrillada-marina',
    name: 'Parrillada marina para dos',
    description: 'Langostinos, vieiras, pesca del día y vegetales de temporada con mantequilla de ajo y limón.',
    price: 118000,
    image: 'assets/images/galeria-04.jpg',
    category: 'fuertes',
    filters: ['fuertes', 'brasa'],
    tag: 'Compartir',
    available: true,
    featured: false
  },
  {
    id: 'prod-langostinos-coco',
    name: 'Langostinos en curry de coco',
    description: 'Langostinos salteados, curry suave de coco, arroz jazmín, chips de ajo y cilantro cimarrón.',
    price: 69000,
    image: 'assets/images/galeria-04.jpg',
    category: 'fuertes',
    filters: ['fuertes'],
    tag: 'Mar',
    available: true,
    featured: false
  },
  {
    id: 'prod-burger-marina',
    name: 'Burger Marina de pesca blanca',
    description: 'Filete de pescado apanado, pan brioche, ensalada de repollo, tártara de limón y papas rústicas.',
    price: 42000,
    image: 'assets/images/plato-pescado-brasa-coco.jpg',
    category: 'hamburguesas',
    filters: ['hamburguesas', 'fuertes'],
    tag: 'Casa',
    available: true,
    featured: false
  },
  {
    id: 'prod-burger-costena',
    name: 'Burger costeña de res ahumada',
    description: 'Carne de res, queso costeño, cebolla caramelizada, mayo de ají dulce y papas criollas.',
    price: 44000,
    image: 'assets/images/plato-costillas-caribenas.jpg',
    category: 'hamburguesas',
    filters: ['hamburguesas', 'fuertes'],
    tag: 'Ahumada',
    available: true,
    featured: false
  },
  {
    id: 'prod-coctel-corozo',
    name: 'Cóctel de corozo',
    description: 'Ron añejo, cordial de corozo, limón mandarino, jengibre y perfume de naranja quemada.',
    price: 34000,
    image: 'assets/images/coctel-corozo.jpg',
    category: 'bebidas',
    filters: ['bebidas'],
    tag: 'Coctelería',
    available: true,
    featured: true
  },
  {
    id: 'prod-limonada-coco',
    name: 'Limonada de coco tostado',
    description: 'Limón criollo, crema de coco, panela clara y ralladura de coco tostado. Cremosa, fría y balanceada.',
    price: 16000,
    image: 'assets/images/menu-limonada-coco.jpg',
    category: 'bebidas',
    filters: ['bebidas'],
    tag: 'Sin alcohol',
    available: true,
    featured: false
  },
  {
    id: 'prod-agua-panela',
    name: 'Soda de panela y limón',
    description: 'Panela clara, soda fría, limón mandarino y sal marina. Refrescante para acompañar platos a la brasa.',
    price: 14000,
    image: 'assets/images/menu-limonada-coco.jpg',
    category: 'bebidas',
    filters: ['bebidas'],
    tag: 'Casa',
    available: true,
    featured: false
  },
  {
    id: 'prod-tarta-maracuya',
    name: 'Tarta de maracuyá y merengue',
    description: 'Base quebrada, crema de maracuyá, merengue tostado y sal marina para cerrar con frescura.',
    price: 24000,
    image: 'assets/images/menu-tarta-maracuya.jpg',
    category: 'postres',
    filters: ['postres'],
    tag: 'Postre cítrico',
    available: true,
    featured: false
  },
  {
    id: 'prod-cocadas-ron',
    name: 'Cocadas tibias con ron de caña',
    description: 'Cocadas suaves, crema de vainilla, coco rallado y reducción ligera de ron cartagenero.',
    price: 22000,
    image: 'assets/images/menu-cocadas.jpg',
    category: 'postres',
    filters: ['postres'],
    tag: 'Dulce costeño',
    available: true,
    featured: false
  },
  {
    id: 'prod-flan-coco',
    name: 'Flan de coco y panela',
    description: 'Flan cremoso de coco, caramelo de panela, crumble de maíz tostado y ralladura de limón.',
    price: 26000,
    image: 'assets/images/menu-tarta-maracuya.jpg',
    category: 'postres',
    filters: ['postres'],
    tag: 'Cierre dulce',
    available: false,
    featured: false
  }
];

export function createDemoTables(count = DEFAULT_SETTINGS.tableCount) {
  return Array.from({ length: count }, (_, index) => ({
    id: `table-${index + 1}`,
    number: index + 1,
    status: index < 4 ? 'occupied' : 'free'
  }));
}

export function createDemoOrders() {
  const now = new Date();
  const at = (minutesAgo) => new Date(now.getTime() - minutesAgo * 60000).toISOString();

  const base = (order) => {
    const subtotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);
    const deliveryFee = order.deliveryFee || 0;
    const flow = ORDER_FLOWS[order.orderType];
    const reached = flow.slice(0, flow.indexOf(order.status) + 1);

    return {
      customerPhone: '',
      delivery: null,
      notes: '',
      payment: null,
      tableNumber: null,
      ...order,
      deliveryFee,
      subtotal,
      total: subtotal + deliveryFee,
      statusHistory: reached.map((status, index) => ({
        status,
        at: new Date(new Date(order.createdAt).getTime() + index * 6 * 60000).toISOString()
      }))
    };
  };

  return [
    base({
      id: 'order-1042',
      number: 1042,
      customerName: 'Camila R.',
      tableNumber: 8,
      orderType: 'table',
      notes: 'Sin cebolla en el ceviche.',
      status: 'preparing',
      createdAt: at(16),
      items: [
        { productId: 'prod-ceviche-camaron', name: 'Ceviche de camarón y mango biche', quantity: 1, unitPrice: 38000, subtotal: 38000 },
        { productId: 'prod-pescado-brasa', name: 'Pescado entero a la brasa', quantity: 1, unitPrice: 74000, subtotal: 74000 }
      ]
    }),
    base({
      id: 'order-1043',
      number: 1043,
      customerName: 'Mesa 3',
      tableNumber: 3,
      orderType: 'table',
      status: 'ready',
      createdAt: at(31),
      items: [
        { productId: 'prod-arroz-mariscos', name: 'Arroz meloso de mariscos', quantity: 1, unitPrice: 64000, subtotal: 64000 },
        { productId: 'prod-coctel-corozo', name: 'Cóctel de corozo', quantity: 2, unitPrice: 34000, subtotal: 68000 }
      ]
    }),
    base({
      id: 'order-1044',
      number: 1044,
      customerName: 'Daniel M.',
      customerPhone: '300 555 2180',
      orderType: 'takeaway',
      notes: 'Recoge en 25 minutos.',
      status: 'completed',
      createdAt: at(65),
      items: [
        { productId: 'prod-burger-marina', name: 'Burger Marina de pesca blanca', quantity: 1, unitPrice: 42000, subtotal: 42000 },
        { productId: 'prod-cocadas-ron', name: 'Cocadas tibias con ron de caña', quantity: 1, unitPrice: 22000, subtotal: 22000 }
      ]
    }),
    base({
      id: 'order-1045',
      number: 1045,
      customerName: 'Valentina S.',
      tableNumber: 12,
      orderType: 'table',
      notes: 'Agregar salsa picante aparte.',
      status: 'pending',
      createdAt: at(7),
      items: [
        { productId: 'prod-parrillada-marina', name: 'Parrillada marina para dos', quantity: 1, unitPrice: 118000, subtotal: 118000 },
        { productId: 'prod-costillas-caribe', name: 'Costillas caribeñas', quantity: 1, unitPrice: 59000, subtotal: 59000 }
      ]
    }),
    base({
      id: 'order-1046',
      number: 1046,
      customerName: 'Laura P.',
      customerPhone: '301 222 4401',
      orderType: 'takeaway',
      notes: 'Sin cubiertos.',
      status: 'pending',
      createdAt: at(3),
      items: [
        { productId: 'prod-empanadas-jaiba', name: 'Empanadas de jaiba y ají de coco', quantity: 2, unitPrice: 29000, subtotal: 58000 }
      ]
    }),
    base({
      id: 'order-1047',
      number: 1047,
      customerName: 'Andrés G.',
      customerPhone: '302 118 7745',
      orderType: 'delivery',
      notes: 'Timbre dañado, llamar al llegar.',
      status: 'on_the_way',
      createdAt: at(38),
      deliveryFee: 12000,
      delivery: {
        address: 'Carrera 2 #8-45, Edificio Mar Azul, Apto 704',
        zoneId: 'bocagrande',
        zoneName: 'Bocagrande',
        reference: 'Portería con vigilante, frente al parque.',
        etaMinutes: 45
      },
      payment: { method: 'cash', changeFor: 150000 },
      items: [
        { productId: 'prod-pescado-brasa', name: 'Pescado entero a la brasa', quantity: 1, unitPrice: 74000, subtotal: 74000 },
        { productId: 'prod-limonada-coco', name: 'Limonada de coco tostado', quantity: 2, unitPrice: 16000, subtotal: 32000 }
      ]
    }),
    base({
      id: 'order-1048',
      number: 1048,
      customerName: 'Mariana T.',
      customerPhone: '311 604 9023',
      orderType: 'delivery',
      notes: 'Sin ají, por favor.',
      status: 'pending',
      createdAt: at(5),
      deliveryFee: 6000,
      delivery: {
        address: 'Calle del Espíritu Santo #29-118',
        zoneId: 'getsemani',
        zoneName: 'Getsemaní',
        reference: 'Casa azul de dos pisos.',
        etaMinutes: 25
      },
      payment: { method: 'transfer', changeFor: null },
      items: [
        { productId: 'prod-arroz-mariscos', name: 'Arroz meloso de mariscos', quantity: 1, unitPrice: 64000, subtotal: 64000 },
        { productId: 'prod-tarta-maracuya', name: 'Tarta de maracuyá y merengue', quantity: 1, unitPrice: 24000, subtotal: 24000 }
      ]
    })
  ];
}
