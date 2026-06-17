const mongoose = require('mongoose');

const argumentSchema = new mongoose.Schema({
  debate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debate',
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  side: {
    type: String,
    enum: ['for', 'against'],
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Argument content is required'],
    trim: true,
    maxlength: 2000,
  },
  aiScore: {
    type: Number,
    min: 0,
    max: 10,
    default: null,
  },
  fallacyDetected: {
    type: String,
    default: null,
  },
  scoringExplanation: {
    type: String,
    default: null,
  },
  stanceMismatch: {
    type: Boolean,
    default: false,
  },
  round: {
    type: Number,
    default: 1,
  },
  createdAt: { type: Date, default: Date.now },
});

argumentSchema.index({ debate: 1, author: 1, content: 1 }, { unique: true });

module.exports = mongoose.model('Argument', argumentSchema);