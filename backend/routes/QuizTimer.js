// routes/quizTimer.js
import express from 'express';
import Quiz from '../models/Quiz.js';
import QuizTimer from '../models/QuizTimer.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Start timer
router.post('/start/:quizId', protect, async (req, res) => {
  const { quizId } = req.params;
  const { duration } = req.body;

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    let timer = await QuizTimer.findOne({ quiz: quizId });

    if (timer) {
      // If timer exists, update duration and restart time
      timer.duration = duration;
      timer.startTime = new Date();
      await timer.save();
      return res.json({ message: 'Timer updated', timer });
    }

    // If no timer exists, create a new one
    timer = new QuizTimer({
      quiz: quizId,
      startTime: new Date(),
      duration
    });

    await timer.save();
    res.json({ message: 'Timer started', timer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /quizTimer/timeleft/:quizId
router.get('/timeleft/:quizId', async (req, res) => {
  const { quizId } = req.params;

  try {
    const timer = await QuizTimer.findOne({ quiz: quizId });
    if (!timer) return res.status(404).json({ error: 'Timer not found' });

    const now = new Date();
    const endTime = new Date(timer.startTime.getTime() + timer.duration);
    const timeLeft = Math.max(0, endTime - now); // ms

    res.json({ timeLeft });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



export default router;
