const mongoose = require('mongoose');

const debateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Debate title is required'],
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'closed'],
    default: 'waiting',
  },
  roomCode: {
    type: String,
    unique: true,
    uppercase: true,
  },
  participants: {
    for: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    against: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  aiSummary: {
    type: String,
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null },
});

debateSchema.pre('save', function () {
  if (!this.roomCode) {
    this.roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
});

module.exports = mongoose.model('Debate', debateSchema);