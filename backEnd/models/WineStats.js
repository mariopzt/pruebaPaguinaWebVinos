const mongoose = require('mongoose');

const wineStatsSchema = new mongoose.Schema({
  // Ventas por tipo
  sales: {
    total: { type: Number, default: 0 },
    tinto: { type: Number, default: 0 },
    blanco: { type: Number, default: 0 },
    rosado: { type: Number, default: 0 },
    espumoso: { type: Number, default: 0 },
    dulce: { type: Number, default: 0 }
  },
  
  // Pérdidas (rotos, jefe se llevó, etc.)
  losses: {
    total: { type: Number, default: 0 },
    tinto: { type: Number, default: 0 },
    blanco: { type: Number, default: 0 },
    rosado: { type: Number, default: 0 },
    espumoso: { type: Number, default: 0 },
    dulce: { type: Number, default: 0 }
  },

  // Histórico para calcular tendencias
  history: [{
    date: { type: Date, default: Date.now },
    sales: {
      total: Number,
      tinto: Number,
      blanco: Number,
      rosado: Number,
      espumoso: Number,
      dulce: Number
    },
    losses: {
      total: Number,
      tinto: Number,
      blanco: Number,
      rosado: Number,
      espumoso: Number,
      dulce: Number
    }
  }],

  lastUpdate: { type: Date, default: Date.now }
});

// Método para calcular tendencias (comparar con el mes anterior)
wineStatsSchema.methods.calculateTrends = function() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  // Buscar datos del mes anterior en el historial
  const previousMonthData = this.history.find(h => 
    h.date >= lastMonth && h.date < new Date(now.getFullYear(), now.getMonth(), 1)
  );

  if (!previousMonthData) {
    return {
      total: 0,
      tinto: 0,
      blanco: 0,
      rosado: 0,
      espumoso: 0,
      dulce: 0,
      losses: 0
    };
  }

  const calcTrend = (current, previous) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return {
    total: calcTrend(this.sales.total, previousMonthData.sales.total),
    tinto: calcTrend(this.sales.tinto, previousMonthData.sales.tinto),
    blanco: calcTrend(this.sales.blanco, previousMonthData.sales.blanco),
    rosado: calcTrend(this.sales.rosado, previousMonthData.sales.rosado),
    espumoso: calcTrend(this.sales.espumoso, previousMonthData.sales.espumoso),
    dulce: calcTrend(this.sales.dulce, previousMonthData.sales.dulce),
    losses: calcTrend(this.losses.total, previousMonthData.losses.total)
  };
};

module.exports = mongoose.model('WineStats', wineStatsSchema);

