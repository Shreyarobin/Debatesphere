const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createMatch,
  getMatches,
  getMatchByRoom,
  joinMatch,
  getMatchMessages,
} = require('../controllers/matchController');

router.post('/', protect, createMatch);
router.get('/', protect, getMatches);
router.get('/:roomCode', protect, getMatchByRoom);
router.post('/:roomCode/join', protect, joinMatch);
router.get('/:roomCode/messages', protect, getMatchMessages);

module.exports = router;