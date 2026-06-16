const Argument = require('../models/Argument');
const Vote = require('../models/Vote');
const Debate = require('../models/Debate');

const debateSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_room', ({ roomCode, username }) => {
      socket.join(roomCode);
      console.log(`${username} joined room ${roomCode}`);
      socket.to(roomCode).emit('user_joined', {
        message: `${username} has joined the debate`,
        timestamp: new Date(),
      });
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