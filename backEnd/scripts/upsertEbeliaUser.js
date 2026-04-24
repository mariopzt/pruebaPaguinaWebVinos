const dotenv = require('dotenv');
const mongoose = require('mongoose');
const CataUser = require('../models/CataUser');

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB || 'catas',
  });

  const username = 'ebelia';
  const password = '123123123';
  const { salt, hash } = CataUser.hashPassword(password);

  const user = await CataUser.findOneAndUpdate(
    { username },
    {
      username,
      displayName: 'Ebelia',
      passwordSalt: salt,
      passwordHash: hash,
    },
    { upsert: true, new: true, runValidators: true }
  );

  console.log(`Usuario listo: ${user.username}`);
  console.log(`Base de datos: ${mongoose.connection.name}`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
