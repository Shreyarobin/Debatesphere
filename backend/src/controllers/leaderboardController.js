const User = require('../models/User');
const Argument = require('../models/Argument');
const CompetitiveMatch = require('../models/CompetitiveMatch');

const MIN_ARGUMENTS_FOR_PRACTICE_RANKING = 3;
const MIN_MATCHES_FOR_COMPETITIVE_RANKING = 1;

const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find().select('username createdAt');

    const practiceRankings = [];
    const competitiveRankings = [];

    for (const user of users) {
      // Practice Mode stats
      const userArguments = await Argument.find({ author: user._id });
      const scoredArgs = userArguments.filter((a) => a.aiScore !== null && a.aiScore !== undefined);

      if (scoredArgs.length >= MIN_ARGUMENTS_FOR_PRACTICE_RANKING) {
        const avgScore = Math.round((scoredArgs.reduce((sum, a) => sum + a.aiScore, 0) / scoredArgs.length) * 10) / 10;
        practiceRankings.push({
          username: user.username,
          avgScore,
          totalArguments: userArguments.length,
        });
      }

      // Competitive Mode stats
      const matches = await CompetitiveMatch.find({
        $or: [{ 'participants.for': user._id }, { 'participants.against': user._id }],
        status: 'completed',
      });

      if (matches.length >= MIN_MATCHES_FOR_COMPETITIVE_RANKING) {
        let wins = 0, losses = 0, ties = 0;
        matches.forEach((match) => {
          const wasFor = match.participants.for?.toString() === user._id.toString();
          const userSide = wasFor ? 'for' : 'against';
          if (match.result.winner === 'tie') ties++;
          else if (match.result.winner === userSide) wins++;
          else losses++;
        });

        competitiveRankings.push({
          username: user.username,
          wins,
          losses,
          ties,
          totalMatches: matches.length,
          winRate: Math.round((wins / matches.length) * 100),
        });
      }
    }

    // Sort practice by avg score descending
    practiceRankings.sort((a, b) => b.avgScore - a.avgScore);

    // Sort competitive by wins descending, then win rate as tiebreaker
    competitiveRankings.sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);

    res.json({
      practiceLeaderboard: practiceRankings.slice(0, 50),
      competitiveLeaderboard: competitiveRankings.slice(0, 50),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

module.exports = { getLeaderboard };