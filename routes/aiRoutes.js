const express = require('express');
const router = express.Router();
const aiChatController = require('../controllers/AiChatController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/ai/chat
 * @desc    Get AI assistant response
 * @access  Private (Authenticated Travelers/Providers)
 */
router.post('/chat', authenticate, aiChatController.handleAiChat);

module.exports = router;
