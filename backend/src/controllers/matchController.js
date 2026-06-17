const CompetitiveMatch = require('../models/CompetitiveMatch');
const MatchMessage = require('../models/MatchMessage');

// Default round structure for every competitive match
const DEFAULT_ROUNDS = [
  { type: 'opening', roundNumber: 1, durationSeconds: 90 },
  { type: 'rebuttal', roundNumber: 2, durationSeconds: 90 },
  { type: 'closing', roundNumber: 3, durationSeconds: 60 },
];

// POST /api/matches — Create a new competitive match
const createMatch = async (req, res) => {
  try {
    const { topic } = req.body;
    const match = await CompetitiveMatch.create({
      topic,
      creator: req.user._id,
      participants: { for: req.user._id, against: null },
      rounds: DEFAULT_ROUNDS,
    });
    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ message: 'Could not create match.', error: error.message });
  }
};

// GET /api/matches — List all open/active matches
const getMatches = async (req, res) => {
  try {
    const matches = await CompetitiveMatch.find({ status: { $in: ['waiting', 'active'] } })
      .populate('creator', 'username')
      .populate('participants.for', 'username')
      .populate('participants.against', 'username')
      .sort({ createdAt: -1 });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch matches.', error: error.message });
  }
};

// GET /api/matches/:roomCode — Get a single match by room code
const getMatchByRoom = async (req, res) => {
  try {
    const match = await CompetitiveMatch.findOne({ roomCode: req.params.roomCode.toUpperCase() })
      .populate('creator', 'username')
      .populate('participants.for', 'username')
      .populate('participants.against', 'username');

    if (!match) return res.status(404).json({ message: 'Match not found.' });
    res.json(match);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// POST /api/matches/:roomCode/join — Join as AGAINST side
const joinMatch = async (req, res) => {
  try {
    const match = await CompetitiveMatch.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!match) return res.status(404).json({ message: 'Match not found.' });
    if (match.status !== 'waiting') return res.status(400).json({ message: 'Match already started.' });
    if (match.participants.against) return res.status(400).json({ message: 'AGAINST side already taken.' });
    if (match.participants.for?.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You are already in this match as FOR.' });
    }

    match.participants.against = req.user._id;
    await match.save();

    res.json({ message: 'Joined match as AGAINST!', match });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// GET /api/matches/:roomCode/messages — Get all messages in a match
const getMatchMessages = async (req, res) => {
  try {
    const match = await CompetitiveMatch.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!match) return res.status(404).json({ message: 'Match not found.' });

    const messages = await MatchMessage.find({ match: match._id })
      .populate('author', 'username')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

module.exports = { createMatch, getMatches, getMatchByRoom, joinMatch, getMatchMessages };