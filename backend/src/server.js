require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const authRoutes = require('./routes/authRoutes');
const debateRoutes = require('./routes/debateRoutes');
const aiRoutes = require('./routes/aiRoutes');
const matchRoutes = require('./routes/matchRoutes');
const profileRoutes = require('./routes/profileRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const soloRoutes = require('./routes/soloRoutes');
const debateSocket = require('./sockets/debateSocket');
const matchSocket = require('./sockets/matchSocket');
const { initializeRAG } = require('./services/ragService');

const app = express();
const httpServer = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/debates', debateRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/solo', soloRoutes);

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] },
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    await initializeRAG();

    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    console.log('Redis connected');

    io.adapter(createAdapter(pubClient, subClient));

    debateSocket(io);
    matchSocket(io);

    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();