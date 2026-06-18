const Debate = require('../models/Debate');
const Argument = require('../models/Argument');
const Vote = require('../models/Vote');
const { generateDebateSummary } = require('../services/openaiService');

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

    // Generate AI summary in the background (don't block the response)
    const forArguments = await Argument.find({ debate: debate._id, side: 'for' });
    const againstArguments = await Argument.find({ debate: debate._id, side: 'against' });

    if (forArguments.length > 0 || againstArguments.length > 0) {
      generateDebateSummary(debate.title, forArguments, againstArguments)
        .then(async (summary) => {
          debate.aiSummary = summary;
          await debate.save();
        })
        .catch((err) => console.log('Summary generation failed:', err.message));
    }

    res.json({ message: 'Debate closed.', debate });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

const getDebateStats = async (req, res) => {
  try {
    const debate = await Debate.findOne({ roomCode: req.params.roomCode.toUpperCase() })
      .populate('participants.for', 'username')
      .populate('participants.against', 'username');
    if (!debate) return res.status(404).json({ message: 'Debate not found.' });

    const forArgs = await Argument.find({ debate: debate._id, side: 'for' }).populate('author', 'username');
    const againstArgs = await Argument.find({ debate: debate._id, side: 'against' }).populate('author', 'username');

    const avgScore = (args) => {
      const scored = args.filter((a) => a.aiScore !== null && a.aiScore !== undefined);
      if (scored.length === 0) return null;
      const sum = scored.reduce((acc, a) => acc + a.aiScore, 0);
      return Math.round((sum / scored.length) * 10) / 10;
    };

    const allArgs = [...forArgs, ...againstArgs];
    const argIds = allArgs.map((a) => a._id);
    const voteCounts = await Vote.aggregate([
      { $match: { argument: { $in: argIds } } },
      { $group: { _id: '$argument', count: { $sum: 1 } } },
    ]);

    const voteMap = {};
    voteCounts.forEach((v) => { voteMap[v._id.toString()] = v.count; });

    let mostUpvoted = null;
    let maxVotes = 0;
    allArgs.forEach((a) => {
      const count = voteMap[a._id.toString()] || 0;
      if (count > maxVotes) {
        maxVotes = count;
        mostUpvoted = { content: a.content, side: a.side, author: a.author?.username, voteCount: count };
      }
    });

    res.json({
      debate,
      stats: {
        forCount: forArgs.length,
        againstCount: againstArgs.length,
        forAvgScore: avgScore(forArgs),
        againstAvgScore: avgScore(againstArgs),
        mostUpvoted,
      },
      aiSummary: debate.aiSummary,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

module.exports = { createDebate, getDebates, getDebateByRoom, joinDebate, getArguments, closeDebate, getDebateStats };