const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { streamDebatePrepChat, scoreArgument, generateDebateSummary } = require('../services/openaiService');
const Debate = require('../models/Debate');
const Argument = require('../models/Argument');

router.post('/prep-chat', protect, async (req, res) => {
  const { topic, side, message } = req.body;
  await streamDebatePrepChat(topic, side, message, res, req.user._id);
});

router.post('/score/:argumentId', protect, async (req, res) => {
  try {
    const argument = await Argument.findById(req.params.argumentId).populate({
      path: 'debate',
      select: 'title',
    });

    if (!argument) return res.status(404).json({ message: 'Argument not found.' });

    const result = await scoreArgument(argument.content, argument.debate.title, argument.side);

    argument.aiScore = result.score;
    argument.fallacyDetected = result.fallacy;
    argument.scoringExplanation = result.explanation;
    argument.stanceMismatch = result.stanceMismatch || false;
    await argument.save();

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Scoring failed.', error: error.message });
  }
});

router.post('/summary/:roomCode', protect, async (req, res) => {
  try {
    const debate = await Debate.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!debate) return res.status(404).json({ message: 'Debate not found.' });

    const allArgs = await Argument.find({ debate: debate._id }).sort({ createdAt: 1 });
    const forArgs = allArgs.filter((a) => a.side === 'for');
    const againstArgs = allArgs.filter((a) => a.side === 'against');

    const summary = await generateDebateSummary(debate.title, forArgs, againstArgs);

    debate.aiSummary = summary;
    await debate.save();

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: 'Summary generation failed.', error: error.message });
  }
});

module.exports = router;