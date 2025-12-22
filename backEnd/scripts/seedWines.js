const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const sampleWines = require('../data/sampleWines');
const Wine = require('../models/Wine');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedWines = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado');

    await Wine.deleteMany({});
    await Wine.insertMany(sampleWines.map((w) => ({ ...w, updatedAtClient: new Date() })));

    console.log(`Importados ${sampleWines.length} vinos`);
    process.exit(0);
  } catch (error) {
    console.error('Error al importar vinos:', error.message);
    process.exit(1);
  }
};

seedWines();
