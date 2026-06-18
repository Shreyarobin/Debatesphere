const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createSoloSession,
  getSoloSession,
  sendSoloMessage,
  endSoloSession,
} = require('../controllers/soloController');

router.post('/', protect, createSoloSession);
router.get('/:id', protect, getSoloSession);
router.post('/:id/message', protect, sendSoloMessage);
router.post('/:id/end', protect, endSoloSession);

module.exports = router;