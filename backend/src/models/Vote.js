const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  debate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Debate',
    required: true,
  },
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  argument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Argument',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

voteSchema.index({ voter: 1, argument: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);