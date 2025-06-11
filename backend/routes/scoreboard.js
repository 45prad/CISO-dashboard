import express from 'express';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/scoreboard
// @desc    Get scoreboard of all users with their total correct answers
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('name email role');

    // Aggregate total score and latest submission date
    const submissions = await Submission.aggregate([
      {
        $group: {
          _id: "$user",
          totalCorrect: { $sum: "$score" },
          totalAttempts: { $sum: 1 },
          totalQuestions: { $sum: { $size: "$answers" } },
          latestSubmission: { $max: "$submittedAt" }
        }
      }
    ]);

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
        accuracy: userSubmissions?.totalQuestions
          ? Math.round((userSubmissions.totalCorrect / userSubmissions.totalQuestions) * 100)
          : 0,
        latestSubmission: userSubmissions?.latestSubmission || null
      };
    });

    // Sort by score descending, then by latest submission ascending
    scoreboard.sort((a, b) => {
      if (b.totalCorrect !== a.totalCorrect) {
        return b.totalCorrect - a.totalCorrect;
      } else {
        return new Date(a.latestSubmission) - new Date(b.latestSubmission);
      }
    });

    res.json(scoreboard);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});



export default router;