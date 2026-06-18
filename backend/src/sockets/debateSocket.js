const Argument = require('../models/Argument');
const Vote = require('../models/Vote');
const Debate = require('../models/Debate');
const { scoreArgument } = require('../services/openaiService');

const debateSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_room', ({ roomCode, username, isSpectator }) => {
      socket.join(roomCode);
      console.log(`${username} joined room ${roomCode}${isSpectator ? ' as spectator' : ''}`);

      if (isSpectator) {
        socket.to(roomCode).emit('user_joined', {
          message: `${username} is now watching this debate`,
          timestamp: new Date(),
        });
      } else {
        socket.to(roomCode).emit('user_joined', {
          message: `${username} has joined the debate`,
          timestamp: new Date(),
        });
      }

      // Broadcast updated population count to everyone in the room
      const room = io.sockets.adapter.rooms.get(roomCode);
      const roomSize = room ? room.size : 0;
      io.to(roomCode).emit('room_population', { count: roomSize });
    });

    socket.on('submit_argument', async ({ roomCode, content, side, userId, debateId, username }) => {
      try {
        const argument = await Argument.create({
          debate: debateId,
          author: userId,
          side,
          content,
        });

        io.to(roomCode).emit('new_argument', {
          _id: argument._id,
          content,
          side,
          author: { _id: userId, username },
          aiScore: null,
          createdAt: argument.createdAt,
        });

        const debate = await Debate.findById(debateId);
        if (process.env.GROQ_API_KEY) {
          scoreArgument(content, debate.title, side).then(async (result) => {
            argument.aiScore = result.score;
            argument.fallacyDetected = result.fallacy;
            argument.scoringExplanation = result.explanation;
            argument.stanceMismatch = result.stanceMismatch || false;
            await argument.save();

            io.to(roomCode).emit('argument_scored', {
              argumentId: argument._id,
              score: result.score,
              fallacy: result.fallacy,
              explanation: result.explanation,
              stanceMismatch: result.stanceMismatch || false,
            });
          }).catch((err) => {
            console.log('AI scoring failed:', err.message);
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to submit argument: ' + error.message });
      }
    });

    socket.on('vote', async ({ roomCode, argumentId, userId }) => {
      try {
        const argument = await Argument.findById(argumentId);
        if (!argument) return socket.emit('error', { message: 'Argument not found.' });

        await Vote.create({ debate: argument.debate, voter: userId, argument: argumentId });

        const voteCount = await Vote.countDocuments({ argument: argumentId });
        io.to(roomCode).emit('vote_updated', { argumentId, voteCount });
      } catch (error) {
        if (error.code === 11000) {
          socket.emit('error', { message: 'You have already voted on this argument.' });
        } else {
          socket.emit('error', { message: 'Vote failed: ' + error.message });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

module.exports = debateSocket;