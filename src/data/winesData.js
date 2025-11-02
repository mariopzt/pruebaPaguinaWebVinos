// Mock data de vinos para la bodega
export const winesData = [
  {
    id: 1,
    name: 'Casal de Armán',
    type: 'Tinto',
    image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg',
    region: 'Ribeiro',
    year: 2022,
    grapeVariety: [
      { name: 'Mencía', percentage: 60 },
      { name: 'Brancellao', percentage: 25 },
      { name: 'Caiño', percentage: 15 }
    ],
    alcoholContent: '13.5%',
    location: 'Estante #3 Arriba',
    description: 'Un vino tinto elegante con notas de frutas rojas y un toque de roble.',
    stock: 45,
    price: 12.50,
    awards: ['Medalla de Oro 2023', 'Premio Mejor Tinto'],
    updatedAt: new Date(Date.now() - 86400000), // yesterday
  },
  {
    id: 2,
    name: 'Albariño Premium',
    type: 'Blanco',
    image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
    region: 'Rías Baixas',
    year: 2023,
    grapeVariety: [
      { name: 'Albariño', percentage: 100 }
    ],
    alcoholContent: '12.5%',
    location: 'Estante #1 Centro',
    description: 'Blanco fresco y aromático con notas de frutas tropicales y cítricos.',
    stock: 62,
    price: 15.00,
    awards: ['Mejor Albariño 2023'],
    updatedAt: new Date(Date.now() - 172800000), // 2 days ago
  },
  {
    id: 3,
    name: 'Dulce Tradición',
    type: 'Dulce',
    image: 'https://images.pexels.com/photos/708777/pexels-photo-708777.jpeg',
    region: 'Ribeiro',
    year: 2021,
    grapeVariety: [
      { name: 'Treixadura', percentage: 50 },
      { name: 'Godello', percentage: 30 },
      { name: 'Loureiro', percentage: 20 }
    ],
    alcoholContent: '11%',
    location: 'Estante #5 Abajo',
    description: 'Vino dulce con intensos aromas a miel y frutas maduras.',
    stock: 28,
    price: 18.50,
    awards: ['Premio Especial Dulces'],
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 4,
    name: 'Revelde Reserva',
    type: 'Tinto',
    image: 'https://images.pexels.com/photos/1407855/pexels-photo-1407855.jpeg',
    region: 'Ribera del Duero',
    year: 2020,
    grapeVariety: [
      { name: 'Tempranillo', percentage: 100 }
    ],
    alcoholContent: '14%',
    location: 'Estante #2 Centro',
    description: 'Reserva con crianza en barrica, notas de vainilla y frutos del bosque.',
    stock: 35,
    price: 22.00,
    awards: ['Gran Reserva 2020'],
    updatedAt: new Date(),
  },
  {
    id: 5,
    name: 'Valdecontina Blanco',
    type: 'Blanco',
    image: 'https://images.pexels.com/photos/1053914/pexels-photo-1053914.jpeg',
    region: 'Rueda',
    year: 2023,
    grapeVariety: [
      { name: 'Verdejo', percentage: 100 }
    ],
    alcoholContent: '12%',
    location: 'Estante #1 Abajo',
    description: 'Blanco joven y afrutado, perfecto para mariscos.',
    stock: 51,
    price: 10.50,
    awards: [],
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 6,
    name: 'Almanova Crianza',
    type: 'Tinto',
    image: 'https://images.pexels.com/photos/1407855/pexels-photo-1407855.jpeg',
    region: 'Rioja',
    year: 2021,
    grapeVariety: [
      { name: 'Tempranillo', percentage: 75 },
      { name: 'Garnacha', percentage: 25 }
    ],
    alcoholContent: '13.5%',
    location: 'Estante #3 Centro',
    description: 'Crianza equilibrado con buen cuerpo y taninos suaves.',
    stock: 40,
    price: 16.50,
    awards: ['Medalla de Plata 2022'],
    updatedAt: new Date(Date.now() - 172800000),
  },
  {
    id: 7,
    name: 'Komakabras Rosado',
    type: 'Blanco',
    image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg',
    region: 'Navarra',
    year: 2023,
    grapeVariety: [
      { name: 'Garnacha', percentage: 100 }
    ],
    alcoholContent: '12.5%',
    location: 'Estante #4 Arriba',
    description: 'Rosado fresco con notas de fresa y flores.',
    stock: 55,
    price: 9.50,
    awards: [],
    updatedAt: new Date(),
  },
  {
    id: 8,
    name: 'Attis Godello',
    type: 'Blanco',
    image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
    region: 'Valdeorras',
    year: 2022,
    grapeVariety: [
      { name: 'Godello', percentage: 70 },
      { name: 'Treixadura', percentage: 30 }
    ],
    alcoholContent: '13%',
    location: 'Estante #1 Arriba',
    description: 'Blanco con estructura, notas minerales y frutas blancas.',
    stock: 38,
    price: 14.00,
    awards: ['Mejor Godello 2022'],
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 9,
    name: 'Moscatel de Luna',
    type: 'Dulce',
    image: 'https://images.pexels.com/photos/708777/pexels-photo-708777.jpeg',
    region: 'Valencia',
    year: 2022,
    grapeVariety: [
      { name: 'Moscatel', percentage: 100 }
    ],
    alcoholContent: '11.5%',
    location: 'Estante #5 Centro',
    description: 'Dulce aromático con notas florales y cítricos.',
    stock: 25,
    price: 20.00,
    awards: ['Premio Especial'],
    updatedAt: new Date(Date.now() - 172800000),
  },
  {
    id: 10,
    name: 'Mencía Barrica',
    type: 'Tinto',
    image: 'https://images.pexels.com/photos/1407855/pexels-photo-1407855.jpeg',
    region: 'Bierzo',
    year: 2021,
    grapeVariety: [
      { name: 'Mencía', percentage: 80 },
      { name: 'Garnacha', percentage: 20 }
    ],
    alcoholContent: '14%',
    location: 'Estante #2 Abajo',
    description: 'Tinto potente con paso por barrica de roble francés.',
    stock: 32,
    price: 19.50,
    awards: ['Medalla de Oro'],
    updatedAt: new Date(),
  },
  {
    id: 11,
    name: 'Treixadura Classic',
    type: 'Blanco',
    image: 'https://images.pexels.com/photos/1053914/pexels-photo-1053914.jpeg',
    region: 'Ribeiro',
    year: 2023,
    grapeVariety: [
      { name: 'Treixadura', percentage: 50 },
      { name: 'Albariño', percentage: 30 },
      { name: 'Loureiro', percentage: 20 }
    ],
    alcoholContent: '12%',
    location: 'Estante #1 Centro',
    description: 'Blanco clásico con notas de manzana verde y hierbas.',
    stock: 48,
    price: 11.00,
    awards: [],
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 12,
    name: 'Garnacha Vieja',
    type: 'Tinto',
    image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg',
    region: 'Priorat',
    year: 2020,
    grapeVariety: [
      { name: 'Garnacha', percentage: 100 }
    ],
    alcoholContent: '15%',
    location: 'Estante #6 Arriba',
    description: 'De viñas centenarias, complejo y con gran potencial.',
    stock: 20,
    price: 35.00,
    awards: ['Gran Vino del Año', 'Medalla de Oro'],
    updatedAt: new Date(Date.now() - 172800000),
  },
  {
    id: 13,
    name: 'Loureiro Aromático',
    type: 'Blanco',
    image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
    region: 'Rías Baixas',
    year: 2023,
    grapeVariety: [
      { name: 'Loureiro', percentage: 100 }
    ],
    alcoholContent: '11.5%',
    location: 'Estante #4 Centro',
    description: 'Blanco aromático y ligero, muy refrescante.',
    stock: 42,
    price: 13.50,
    awards: [],
    updatedAt: new Date(),
  },
  {
    id: 14,
    name: 'Caiño Tinto',
    type: 'Tinto',
    image: 'https://images.pexels.com/photos/1407855/pexels-photo-1407855.jpeg',
    region: 'Rías Baixas',
    year: 2022,
    grapeVariety: [
      { name: 'Caiño Tinto', percentage: 60 },
      { name: 'Espadeiro', percentage: 25 },
      { name: 'Sousón', percentage: 15 }
    ],
    alcoholContent: '13%',
    location: 'Estante #2 Arriba',
    description: 'Tinto atlántico, fresco y con carácter.',
    stock: 30,
    price: 17.00,
    awards: ['Revelación del Año'],
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 15,
    name: 'Brancellao Único',
    type: 'Tinto',
    image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg',
    region: 'Ribeiro',
    year: 2021,
    grapeVariety: [
      { name: 'Brancellao', percentage: 55 },
      { name: 'Mencía', percentage: 30 },
      { name: 'Tempranillo', percentage: 15 }
    ],
    alcoholContent: '13.5%',
    location: 'Estante #3 Abajo',
    description: 'Variedad autóctona con notas especiadas.',
    stock: 27,
    price: 21.00,
    awards: ['Premio Autóctonos'],
    updatedAt: new Date(Date.now() - 172800000),
  },
  {
    id: 16,
    name: 'Espadeiro Rosado',
    type: 'Blanco',
    image: 'https://images.pexels.com/photos/1053914/pexels-photo-1053914.jpeg',
    region: 'Rías Baixas',
    year: 2023,
    grapeVariety: [
      { name: 'Espadeiro', percentage: 70 },
      { name: 'Caiño', percentage: 30 }
    ],
    alcoholContent: '12%',
    location: 'Estante #4 Abajo',
    description: 'Rosado elegante con notas florales.',
    stock: 36,
    price: 12.00,
    awards: [],
    updatedAt: new Date(),
  },
  {
    id: 17,
    name: 'Sousón Atlántico',
    type: 'Tinto',
    image: 'https://images.pexels.com/photos/1407855/pexels-photo-1407855.jpeg',
    region: 'Rías Baixas',
    year: 2022,
    grapeVariety: [
      { name: 'Sousón', percentage: 100 }
    ],
    alcoholContent: '12.5%',
    location: 'Estante #6 Centro',
    description: 'Tinto ligero y aromático del atlántico.',
    stock: 33,
    price: 15.50,
    awards: [],
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 18,
    name: 'Tempranillo Gran Reserva',
    type: 'Tinto',
    image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg',
    region: 'Ribera del Duero',
    year: 2018,
    grapeVariety: [
      { name: 'Tempranillo', percentage: 70 },
      { name: 'Cabernet Sauvignon', percentage: 20 },
      { name: 'Merlot', percentage: 10 }
    ],
    alcoholContent: '14.5%',
    location: 'Estante #7 Arriba',
    description: 'Gran Reserva excepcional con larga crianza.',
    stock: 15,
    price: 45.00,
    awards: ['Gran Reserva del Año', 'Medalla de Oro', 'Premio Especial'],
    updatedAt: new Date(Date.now() - 172800000),
  },
  {
    id: 19,
    name: 'Godello Premium',
    type: 'Blanco',
    image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
    region: 'Valdeorras',
    year: 2023,
    grapeVariety: [
      { name: 'Godello', percentage: 100 }
    ],
    alcoholContent: '13.5%',
    location: 'Estante #1 Arriba',
    description: 'Blanco de alta gama con fermentación en barrica.',
    stock: 24,
    price: 28.00,
    awards: ['Mejor Blanco Premium'],
    updatedAt: new Date(),
  },
  {
    id: 20,
    name: 'Monastrell Reserva',
    type: 'Tinto',
    image: 'https://images.pexels.com/photos/1407855/pexels-photo-1407855.jpeg',
    region: 'Jumilla',
    year: 2020,
    grapeVariety: [
      { name: 'Monastrell', percentage: 60 },
      { name: 'Syrah', percentage: 25 },
      { name: 'Garnacha', percentage: 15 }
    ],
    alcoholContent: '14%',
    location: 'Estante #6 Abajo',
    description: 'Reserva potente con aromas a frutas maduras.',
    stock: 29,
    price: 18.00,
    awards: ['Medalla de Plata'],
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 21,
    name: 'Vino de Hielo',
    type: 'Dulce',
    image: 'https://images.pexels.com/photos/708777/pexels-photo-708777.jpeg',
    region: 'Somontano',
    year: 2022,
    grapeVariety: [
      { name: 'Gewürztraminer', percentage: 100 }
    ],
    alcoholContent: '10.5%',
    location: 'Estante #5 Arriba',
    description: 'Dulce excepcional elaborado con uvas heladas.',
    stock: 12,
    price: 55.00,
    awards: ['Premio Especial Dulces', 'Medalla de Oro'],
    updatedAt: new Date(Date.now() - 172800000),
  },
  {
    id: 22,
    name: 'Viura Clásico',
    type: 'Blanco',
    image: 'https://images.pexels.com/photos/1053914/pexels-photo-1053914.jpeg',
    region: 'Rioja',
    year: 2023,
    grapeVariety: [
      { name: 'Viura', percentage: 100 }
    ],
    alcoholContent: '12%',
    location: 'Estante #4 Centro',
    description: 'Blanco tradicional riojano, fresco y versátil.',
    stock: 58,
    price: 9.00,
    awards: [],
    updatedAt: new Date(),
  },
  {
    id: 23,
    name: 'Prieto Picudo',
    type: 'Tinto',
    image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg',
    region: 'Tierra de León',
    year: 2022,
    grapeVariety: [
      { name: 'Prieto Picudo', percentage: 80 },
      { name: 'Mencía', percentage: 20 }
    ],
    alcoholContent: '13%',
    location: 'Estante #7 Centro',
    description: 'Tinto autóctono leonés con carácter único.',
    stock: 34,
    price: 16.00,
    awards: ['Revelación Autóctona'],
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 24,
    name: 'Garnacha Reserva Agotada',
    type: 'Tinto',
    image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg',
    region: 'Priorat',
    year: 2020,
    grapeVariety: [
      { name: 'Garnacha', percentage: 100 }
    ],
    alcoholContent: '15%',
    location: 'Estante #6 Arriba',
    description: 'De viñas centenarias, complejo y con gran potencial.',
    stock: 0,
    price: 35.00,
    awards: ['Gran Vino del Año', 'Medalla de Oro'],
    updatedAt: new Date(Date.now() - 172800000),
  },
  {
    id: 25,
    name: 'Tempranillo Premium Agotado',
    type: 'Tinto',
    image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg',
    region: 'Ribera del Duero',
    year: 2018,
    grapeVariety: [
      { name: 'Tempranillo', percentage: 100 }
    ],
    alcoholContent: '14.5%',
    location: 'Estante #7 Arriba',
    description: 'Gran Reserva excepcional con larga crianza.',
    stock: 0,
    price: 45.00,
    awards: ['Gran Reserva del Año', 'Medalla de Oro'],
    updatedAt: new Date(Date.now() - 172800000),
  },
  {
    id: 26,
    name: 'Albariño Limitado Agotado',
    type: 'Blanco',
    image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
    region: 'Rías Baixas',
    year: 2023,
    grapeVariety: [
      { name: 'Albariño', percentage: 100 }
    ],
    alcoholContent: '12.5%',
    location: 'Estante #1 Centro',
    description: 'Blanco fresco y aromático, edición limitada.',
    stock: 0,
    price: 25.00,
    awards: ['Mejor Albariño 2023'],
    updatedAt: new Date(Date.now() - 172800000),
  },
  {
    id: 27,
    name: 'Dulce Especial Agotado',
    type: 'Dulce',
    image: 'https://images.pexels.com/photos/708777/pexels-photo-708777.jpeg',
    region: 'Valencia',
    year: 2022,
    grapeVariety: [
      { name: 'Moscatel', percentage: 100 }
    ],
    alcoholContent: '11.5%',
    location: 'Estante #5 Centro',
    description: 'Dulce aromático con notas florales y cítricos.',
    stock: 0,
    price: 20.00,
    awards: ['Premio Especial'],
    updatedAt: new Date(Date.now() - 172800000),
  },
  {
    id: 28,
    name: 'Mencía Barrica Agotada',
    type: 'Tinto',
    image: 'https://images.pexels.com/photos/1407855/pexels-photo-1407855.jpeg',
    region: 'Bierzo',
    year: 2021,
    grapeVariety: [
      { name: 'Mencía', percentage: 80 },
      { name: 'Garnacha', percentage: 20 }
    ],
    alcoholContent: '14%',
    location: 'Estante #2 Abajo',
    description: 'Tinto potente con paso por barrica de roble francés.',
    stock: 0,
    price: 19.50,
    awards: ['Medalla de Oro'],
    updatedAt: new Date(),
  }
];

// Función para formatear la fecha de actualización
export const getTimeAgo = (date) => {
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Updated today';
  } else if (diffDays === 1) {
    return 'Updated yesterday';
  } else {
    return `Updated ${diffDays} days ago`;
  }
};

// Función para verificar si un vino está agotado
export const isWineOutOfStock = (wine) => {
  return wine.stock === 0;
};

// Función para obtener vinos en stock
export const getWinesInStock = () => {
  return winesData.filter(wine => wine.stock > 0);
};

// Función para obtener vinos agotados
export const getWinesOutOfStock = () => {
  return winesData.filter(wine => wine.stock === 0);
};
