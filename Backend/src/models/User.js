const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  googleId: { type: String },
  avatar: { type: String },
  password: { type: String }, // Optional for Google Auth users
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
