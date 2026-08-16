/**
 * AI Routes - Salifz
 * AI-powered features for personalized learning
 */

const express = require('express');
const AIService = require('../services/aiService');
const SurahProgress = require('../models/SurahProgress');
const Streak = require('../models/Streak');

const router = express.Router();

/**
 * GET /api/v1/ai/plan
 * Get personalized memorization plan
 */
router.get('/plan', async (req, res, next) => {
  try {
    const user = req.user;
    
    // Get user's progress
    const progress = await SurahProgress.find({ userId: req.userId });
    
    const plan = await AIService.getPersonalizedPlan(user, progress);
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/ai/insights
 * Get AI-powered insights
 */
router.get('/insights', async (req, res, next) => {
  try {
    const user = req.user;
    
    // Get progress and streak data
    const [progress, streak] = await Promise.all([
      SurahProgress.find({ userId: req.userId }),
      Streak.findOne({ user: req.userId })
    ]);
    
    const insights = await AIService.getInsights(user, progress, streak);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/ai/motivation
 * Get daily motivation
 */
router.get('/motivation', async (req, res, next) => {
  try {
    const user = req.user;
    
    const motivation = await AIService.getDailyMotivation(user);
    
    res.json({
      success: true,
      data: motivation
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/ai/smart-review
 * Get smart review queue
 */
router.get('/smart-review', async (req, res, next) => {
  try {
    const user = req.user;
    
    // Get all progress
    const progress = await SurahProgress.find({ userId: req.userId });
    
    const review = await AIService.getSmartReview(user, progress);
    
    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/ai/explain/:surah/:ayah
 * Get AI explanation of an ayah
 */
router.get('/explain/:surah/:ayah', async (req, res, next) => {
  try {
    const { surah, ayah } = req.params;
    
    const explanation = await AIService.explainAyah(
      parseInt(surah),
      parseInt(ayah)
    );
    
    res.json({
      success: true,
      data: explanation
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;