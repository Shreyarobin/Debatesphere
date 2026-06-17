const mongoose = require('mongoose');

const matchMessageSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompetitiveMatch',
    required: true,
  },
  senderType: {
    type: String,
    enum: ['for', 'against', 'moderator'],
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null when senderType is 'moderator'
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: 2000,
  },
  roundIndex: {
    type: Number,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MatchMessage', matchMessageSchema);