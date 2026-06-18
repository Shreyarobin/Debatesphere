const SoloSession = require('../models/SoloSession');
const { getAIOpponentReply, generateSoloReport } = require('../services/openaiService');

// POST /api/solo — Create a new solo session
const createSoloSession = async (req, res) => {
  try {
    const { topic, userSide } = req.body;
    const session = await SoloSession.create({
      user: req.user._id,
      topic,
      userSide,
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Could not create solo session.', error: error.message });
  }
};

// GET /api/solo/:id — Get a solo session
const getSoloSession = async (req, res) => {
  try {
    const session = await SoloSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this session.' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// POST /api/solo/:id/message — User sends a message, AI replies
const sendSoloMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const session = await SoloSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.status !== 'active') return res.status(400).json({ message: 'Session is no longer active.' });

    session.messages.push({ sender: 'user', content });

    const aiSide = session.userSide === 'for' ? 'against' : 'for';
    const aiReply = await getAIOpponentReply(session.topic, aiSide, session.messages);
    session.messages.push({ sender: 'ai', content: aiReply });

    await session.save();

    res.json({ aiReply, messages: session.messages });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get AI reply: ' + error.message });
  }
};

// POST /api/solo/:id/end — End the session and generate the report
const endSoloSession = async (req, res) => {
  try {
    const session = await SoloSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.status === 'completed') {
      return res.json(session); // already completed, just return it
    }

    const userMessages = session.messages.filter((m) => m.sender === 'user');

    if (userMessages.length === 0) {
      session.status = 'completed';
      session.completedAt = new Date();
      session.report = {
        strengths: [],
        weaknesses: [],
        overallFeedback: 'No arguments were submitted during this session.',
      };
      await session.save();
      return res.json(session);
    }

    const report = await generateSoloReport(session.topic, session.userSide, session.messages);

    session.status = 'completed';
    session.completedAt = new Date();
    session.report = report;
    await session.save();

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate report: ' + error.message });
  }
};

module.exports = { createSoloSession, getSoloSession, sendSoloMessage, endSoloSession };