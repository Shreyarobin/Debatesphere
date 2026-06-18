const User = require('../models/User');
const Debate = require('../models/Debate');
const Argument = require('../models/Argument');
const CompetitiveMatch = require('../models/CompetitiveMatch');

const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Practice Mode stats: all arguments this user has ever submitted
    const userArguments = await Argument.find({ author: user._id });
    const scoredArgs = userArguments.filter((a) => a.aiScore !== null && a.aiScore !== undefined);
    const avgScore = scoredArgs.length > 0
      ? Math.round((scoredArgs.reduce((sum, a) => sum + a.aiScore, 0) / scoredArgs.length) * 10) / 10
      : null;

    // Count distinct debates this user has participated in (as for or against)
    const practiceDebates = await Debate.find({
      $or: [{ 'participants.for': user._id }, { 'participants.against': user._id }],
      status: 'closed',
    }).sort({ closedAt: -1 });

    // Competitive Mode stats
    const competitiveMatches = await CompetitiveMatch.find({
      $or: [{ 'participants.for': user._id }, { 'participants.against': user._id }],
      status: 'completed',
    }).sort({ completedAt: -1 });

    let wins = 0, losses = 0, ties = 0;
    competitiveMatches.forEach((match) => {
      const wasFor = match.participants.for?.toString() === user._id.toString();
      const userSide = wasFor ? 'for' : 'against';
      if (match.result.winner === 'tie') ties++;
      else if (match.result.winner === userSide) wins++;
      else losses++;
    });

    res.json({
      user: { username: user.username, createdAt: user.createdAt },
      practiceStats: {
        totalArguments: userArguments.length,
        avgScore,
        totalDebates: practiceDebates.length,
      },
      competitiveStats: {
        totalMatches: competitiveMatches.length,
        wins,
        losses,
        ties,
      },
      debateHistory: practiceDebates.map((d) => ({
        roomCode: d.roomCode,
        title: d.title,
        closedAt: d.closedAt,
      })),
      matchHistory: competitiveMatches.map((m) => ({
        roomCode: m.roomCode,
        topic: m.topic,
        winner: m.result.winner,
        userSide: m.participants.for?.toString() === user._id.toString() ? 'for' : 'against',
        completedAt: m.completedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

module.exports = { getProfile };