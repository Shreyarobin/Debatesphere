const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createDebate,
  getDebates,
  getDebateByRoom,
  joinDebate,
  getArguments,
  closeDebate,
} = require('../controllers/debateController');

router.post('/', protect, createDebate);
router.get('/', protect, getDebates);
router.get('/:roomCode', protect, getDebateByRoom);
router.post('/:roomCode/join', protect, joinDebate);
router.get('/:roomCode/arguments', protect, getArguments);
router.post('/:roomCode/close', protect, closeDebate);

module.exports = router;