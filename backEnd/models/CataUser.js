const crypto = require('crypto');
const mongoose = require('mongoose');

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return { salt, hash };
};

const verifyPassword = (password, salt, expectedHash) => {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
};

const cataUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      trim: true,
      default: '',
    },
    passwordHash: {
      type: String,
      required: true,
    },
    passwordSalt: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

cataUserSchema.methods.setPassword = function setPassword(password) {
  const { salt, hash } = hashPassword(password);
  this.passwordSalt = salt;
  this.passwordHash = hash;
};

cataUserSchema.methods.checkPassword = function checkPassword(password) {
  return verifyPassword(password, this.passwordSalt, this.passwordHash);
};

cataUserSchema.statics.hashPassword = hashPassword;

module.exports = mongoose.model('CataUser', cataUserSchema);
