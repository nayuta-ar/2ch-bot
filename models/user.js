const mongoose = require('mongoose')

module.exports = mongoose.model(
  'user',
  new mongoose.Schema({
    id: { type: String, required: true },
    nick: { type: String, default: '名無しさん' },
  })
)
