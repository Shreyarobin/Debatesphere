const CompetitiveMatch = require('../models/CompetitiveMatch');
const MatchMessage = require('../models/MatchMessage');
const { judgeMatch } = require('../services/openaiService');

// Keep track of active timers per match so we can clear them properly
const activeTimers = {};

const ROUND_LABELS = {
  opening: 'Opening Statements',
  rebuttal: 'Rebuttal Round',
  closing: 'Closing Statements',
};

const matchSocket = (io) => {
  io.on('connection', (socket) => {

    socket.on('join_match', ({ roomCode, username }) => {
      socket.join(roomCode);
      console.log(`${username} joined match ${roomCode}`);
      socket.to(roomCode).emit('match_user_joined', {
        message: `${username} has joined the match`,
        timestamp: new Date(),
      });
    });

    // Host starts the match — triggers round 1
    socket.on('start_match', async ({ roomCode, matchId }) => {
      try {
        const match = await CompetitiveMatch.findById(matchId);
        if (!match) return socket.emit('match_error', { message: 'Match not found.' });
        if (!match.participants.for || !match.participants.against) {
          return socket.emit('match_error', { message: 'Both sides must join before starting.' });
        }

        match.status = 'active';
        match.currentRoundIndex = 0;
        match.roundStartedAt = new Date();
        await match.save();

        await postModeratorMessage(io, match, 0,
          `Welcome to this debate on "${match.topic}". We begin with ${ROUND_LABELS[match.rounds[0].type]}. You have ${match.rounds[0].durationSeconds} seconds. Begin when ready.`
        );

        io.to(roomCode).emit('round_started', {
          roundIndex: 0,
          round: match.rounds[0],
          startedAt: match.roundStartedAt,
        });

        startRoundTimer(io, roomCode, matchId, match.rounds[0].durationSeconds);
      } catch (error) {
        socket.emit('match_error', { message: 'Failed to start match: ' + error.message });
      }
    });

    // A debater sends a message during their round
    socket.on('send_match_message', async ({ roomCode, matchId, content, userId, username, side }) => {
      try {
        const match = await CompetitiveMatch.findById(matchId);
        if (!match || match.status !== 'active') {
          return socket.emit('match_error', { message: 'Match is not currently active.' });
        }

        const message = await MatchMessage.create({
          match: matchId,
          senderType: side,
          author: userId,
          content,
          roundIndex: match.currentRoundIndex,
        });

        io.to(roomCode).emit('new_match_message', {
          _id: message._id,
          senderType: side,
          author: { _id: userId, username },
          content,
          roundIndex: match.currentRoundIndex,
          createdAt: message.createdAt,
        });
      } catch (error) {
        socket.emit('match_error', { message: 'Failed to send message: ' + error.message });
      }
    });

    socket.on('disconnect', () => {});
  });
};

// Posts a message from the AI moderator into the match
const postModeratorMessage = async (io, match, roundIndex, content) => {
  const message = await MatchMessage.create({
    match: match._id,
    senderType: 'moderator',
    author: null,
    content,
    roundIndex,
  });

  io.to(match.roomCode).emit('new_match_message', {
    _id: message._id,
    senderType: 'moderator',
    author: null,
    content,
    roundIndex,
    createdAt: message.createdAt,
  });
};

// Starts a countdown timer for the current round, advances automatically when it hits 0
const startRoundTimer = (io, roomCode, matchId, durationSeconds) => {
  if (activeTimers[matchId]) {
    clearInterval(activeTimers[matchId]);
  }

  let remaining = durationSeconds;
  io.to(roomCode).emit('timer_tick', { remaining });

  activeTimers[matchId] = setInterval(async () => {
    remaining -= 1;
    io.to(roomCode).emit('timer_tick', { remaining });

    if (remaining <= 0) {
      clearInterval(activeTimers[matchId]);
      delete activeTimers[matchId];
      await advanceRound(io, roomCode, matchId);
    }
  }, 1000);
};

// Moves the match to the next round, or to judging if it was the last round
const advanceRound = async (io, roomCode, matchId) => {
  const match = await CompetitiveMatch.findById(matchId);
  if (!match) return;

  const nextIndex = match.currentRoundIndex + 1;

  if (nextIndex >= match.rounds.length) {
    match.status = 'judging';
    await match.save();

    await postModeratorMessage(io, match, match.currentRoundIndex,
      `Time's up. All rounds are complete. The judging is now underway — please wait for the verdict.`
    );

    io.to(roomCode).emit('match_judging_started', {});

    runJudging(io, roomCode, matchId);
    return;
  }

  match.currentRoundIndex = nextIndex;
  match.roundStartedAt = new Date();
  await match.save();

  const nextRound = match.rounds[nextIndex];
  await postModeratorMessage(io, match, nextIndex,
    `Time's up. We now move to ${ROUND_LABELS[nextRound.type]}. You have ${nextRound.durationSeconds} seconds. Begin when ready.`
  );

  io.to(roomCode).emit('round_started', {
    roundIndex: nextIndex,
    round: nextRound,
    startedAt: match.roundStartedAt,
  });

  startRoundTimer(io, roomCode, matchId, nextRound.durationSeconds);
};

// Runs the AI judge on the full transcript and saves the verdict
const runJudging = async (io, roomCode, matchId) => {
  try {
    const match = await CompetitiveMatch.findById(matchId);
    if (!match) return;

    const transcript = await MatchMessage.find({ match: matchId })
      .populate('author', 'username')
      .sort({ createdAt: 1 });

    const verdict = await judgeMatch(match.topic, transcript);

    match.status = 'completed';
    match.completedAt = new Date();
    match.result = {
      winner: verdict.winner,
      forScore: verdict.forScore,
      againstScore: verdict.againstScore,
      reasoning: verdict.reasoning,
    };
    await match.save();

    io.to(roomCode).emit('match_completed', { result: match.result });
  } catch (error) {
    console.log('Judging failed:', error.message);
    io.to(roomCode).emit('match_error', { message: 'Judging failed. Please try again.' });
  }
};

module.exports = matchSocket;