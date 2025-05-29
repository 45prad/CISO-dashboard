import express from 'express';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/scoreboard
// @desc    Get scoreboard of all users with their total correct answers
// @access  Private/Admin
router.get('/',  async (req, res) => {
  try {
    // Get all users
    const users = await User.find().select('name email role');
    
    // Get all submissions grouped by user
    const submissions = await Submission.aggregate([
      {
        $group: {
          _id: "$user",
          totalCorrect: { $sum: "$score" },
          totalAttempts: { $sum: 1 },
          totalQuestions: { $sum: { $size: "$answers" } }
        }
      }
    ]);
    
    // Map scores to users
    const scoreboard = users.map(user => {
      const userSubmissions = submissions.find(sub => sub._id.equals(user._id));
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalCorrect: userSubmissions?.totalCorrect || 0,
        totalAttempts: userSubmissions?.totalAttempts || 0,
        totalQuestions: userSubmissions?.totalQuestions || 0,
        accuracy: userSubmissions ? 
          Math.round((userSubmissions.totalCorrect / userSubmissions.totalQuestions) * 100) : 0
      };
    }).sort((a, b) => b.totalCorrect - a.totalCorrect);
    
    res.json(scoreboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;