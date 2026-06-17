const mongoose = require('mongoose');

const competitiveMatchSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: [true, 'Match topic is required'],
    trim: true,
    maxlength: 200,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  roomCode: {
    type: String,
    unique: true,
    uppercase: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'judging', 'completed'],
    default: 'waiting',
  },
  participants: {
    for: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    against: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },

  // Round structure
  rounds: [
    {
      type: { type: String, enum: ['opening', 'rebuttal', 'closing'], required: true },
      roundNumber: { type: Number, required: true },
      durationSeconds: { type: Number, default: 90 },
    },
  ],
  currentRoundIndex: {
    type: Number,
    default: -1, // -1 means match hasn't started yet
  },
  roundStartedAt: {
    type: Date,
    default: null,
  },

  // Final results (filled in after judging)
  result: {
    winner: { type: String, enum: ['for', 'against', 'tie', null], default: null },
    forScore: { type: Number, default: null },
    againstScore: { type: Number, default: null },
    reasoning: { type: String, default: null },
  },

  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
});

competitiveMatchSchema.pre('save', function () {
  if (!this.roomCode) {
    this.roomCode = 'C' + Math.random().toString(36).substring(2, 7).toUpperCase();
  }
});

module.exports = mongoose.model('CompetitiveMatch', competitiveMatchSchema);