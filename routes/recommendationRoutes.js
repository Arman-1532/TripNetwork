const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/RecommendationController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/recommendations
 * @desc    Get personalized travel recommendations
 * @access  Private (Traveler)
 */
router.get('/', authenticate, recommendationController.getPersonalizedRecommendations);

module.exports = router;
