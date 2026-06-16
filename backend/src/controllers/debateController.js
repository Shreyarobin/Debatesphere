const Debate = require('../models/Debate');
const Argument = require('../models/Argument');
const Vote = require('../models/Vote');

const createDebate = async (req, res) => {
  try {
    const { title, description } = req.body;
    console.log('Creating debate for user:', req.user._id);
    console.log('Title:', title);
    const debate = await Debate.create({
      title,
      description,
      creator: req.user._id,
      participants: { for: req.user._id, against: null },
    });
    res.status(201).json(debate);
  } catch (error) {
    console.error('Create debate error:', error);
    res.status(500).json({ message: 'Could not create debate.', error: error.message });
  }
};

const getDebates = async (req, res) => {
  try {
    const debates = await Debate.find({ status: { $in: ['waiting', 'active'] } })
      .populate('creator', 'username')
      .populate('participants.for', 'username')
      .populate('participants.against', 'username')
      .sort({ createdAt: -1 });
    res.json(debates);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch debates.', error: error.message });
  }
};

const getDebateByRoom = async (req, res) => {
  try {
    const debate = await Debate.findOne({ roomCode: req.params.roomCode.toUpperCase() })
      .populate('creator', 'username')
      .populate('participants.for', 'username')
      .populate('participants.against', 'username');

    if (!debate) return res.status(404).json({ message: 'Debate room not found.' });
    res.json(debate);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

const joinDebate = async (req, res) => {
  try {
    const debate = await Debate.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!debate) return res.status(404).json({ message: 'Debate not found.' });
    if (debate.status !== 'waiting') return res.status(400).json({ message: 'Debate already started.' });
    if (debate.participants.against) return res.status(400).json({ message: 'AGAINST side already taken.' });
    if (debate.participants.for?.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You are already in this debate as FOR.' });
    }

    debate.participants.against = req.user._id;
    debate.status = 'active';
    await debate.save();

    res.json({ message: 'Joined debate as AGAINST!', debate });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

const getArguments = async (req, res) => {
  try {
    const debate = await Debate.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!debate) return res.status(404).json({ message: 'Debate not found.' });

    const args = await Argument.find({ debate: debate._id })
      .populate('author', 'username')
      .sort({ createdAt: 1 });

    res.json(args);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

const closeDebate = async (req, res) => {
  try {
    const debate = await Debate.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!debate) return res.status(404).json({ message: 'Debate not found.' });
    if (debate.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the debate creator can close it.' });
    }

    debate.status = 'closed';
    debate.closedAt = new Date();
    await debate.save();

    res.json({ message: 'Debate closed.', debate });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

module.exports = { createDebate, getDebates, getDebateByRoom, joinDebate, getArguments, closeDebate };