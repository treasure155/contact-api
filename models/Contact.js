const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  type: { type: String, enum: ['general', 'seller'], required: true },
  product_id: String,
  product_name: String,
  name: String,
  email: String,
  phone: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contact', contactSchema);