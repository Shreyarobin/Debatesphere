const Argument = require('../models/Argument');

// Builds a summary of a user's debate history for use in AI prompts
const getUserMemory = async (userId) => {
  const pastArguments = await Argument.find({ author: userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('debate', 'title');

  if (pastArguments.length === 0) {
    return {
      hasHistory: false,
      summary: 'This is the user\'s first time debating. No prior history available.',
    };
  }

  const scoredArguments = pastArguments.filter((a) => a.aiScore !== null && a.aiScore !== undefined);
  const avgScore = scoredArguments.length > 0
    ? (scoredArguments.reduce((sum, a) => sum + a.aiScore, 0) / scoredArguments.length).toFixed(1)
    : null;

  const fallacyCounts = {};
  scoredArguments.forEach((a) => {
    if (a.fallacyDetected) {
      fallacyCounts[a.fallacyDetected] = (fallacyCounts[a.fallacyDetected] || 0) + 1;
    }
  });

  const topFallacies = Object.entries(fallacyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([fallacy]) => fallacy);

  const stanceMismatchCount = scoredArguments.filter((a) => a.stanceMismatch).length;

  const topics = [...new Set(pastArguments.map((a) => a.debate?.title).filter(Boolean))].slice(0, 3);

  let summary = `User has submitted ${pastArguments.length} arguments across past debates.`;
  if (avgScore) summary += ` Their average AI argument score is ${avgScore}/10.`;
  if (topFallacies.length > 0) summary += ` They tend to commit these fallacies: ${topFallacies.join(', ')}.`;
  if (stanceMismatchCount > 0) summary += ` They have posted ${stanceMismatchCount} argument(s) on the wrong side in the past — pay attention to stance clarity.`;
  if (topics.length > 0) summary += ` Recent topics debated: ${topics.join('; ')}.`;

  return {
    hasHistory: true,
    summary,
    avgScore,
    topFallacies,
  };
};

module.exports = { getUserMemory };