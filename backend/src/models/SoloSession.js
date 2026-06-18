const mongoose = require('mongoose');

const soloMessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  createdAt: { type: Date, default: Date.now },
});

const soloSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
    maxlength: 200,
  },
  userSide: {
    type: String,
    enum: ['for', 'against'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },
  durationSeconds: {
    type: Number,
    default: 180, // 3 minutes
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  messages: [soloMessageSchema],
  report: {
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    overallFeedback: { type: String, default: null },
  },
  completedAt: { type: Date, default: null },
});

module.exports = mongoose.model('SoloSession', soloSessionSchema);