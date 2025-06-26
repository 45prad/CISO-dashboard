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
      // Reset timer
      timer.duration = duration;
      timer.startTime = new Date();
      timer.isPaused = false;
      timer.pausedAt = null;
      timer.elapsedBeforePause = 0;

      await timer.save();
      return res.json({ message: 'Timer restarted', timer });
    }

    // New timer creation
    timer = new QuizTimer({
      quiz: quizId,
      startTime: new Date(),
      duration,
      isPaused: false
    });

    await timer.save();
    res.json({ message: 'Timer started', timer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



// GET /quizTimer/timeleft/:quizId
router.get('/timeleft/:quizId', async (req, res) => {
  const { quizId } = req.params;

  try {
    const timer = await QuizTimer.findOne({ quiz: quizId });
    if (!timer) return res.status(404).json({ error: 'Timer not found' });

    let elapsed;
    if (timer.isPaused) {
      // Timer is paused; use elapsedBeforePause
      elapsed = timer.elapsedBeforePause || 0;
    } else {
      // Timer is running; add time since last start to previous elapsed
      elapsed = new Date() - timer.startTime + (timer.elapsedBeforePause || 0);
    }

    const timeLeft = Math.max(0, timer.duration - elapsed);
    res.json({ timeLeft, isPaused: timer.isPaused });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pause timer
router.post('/pause/:quizId', protect, async (req, res) => {
  try {
    const { quizId } = req.params;
    const timer = await QuizTimer.findOne({ quiz: quizId });

    if (!timer || timer.isPaused) return res.status(400).json({ error: 'Timer not running or already paused' });

    const now = new Date();
    const elapsed = now - timer.startTime + (timer.elapsedBeforePause || 0);

    timer.isPaused = true;
    timer.pausedAt = now;
    timer.elapsedBeforePause = elapsed;

    await timer.save();
    res.json({ message: 'Timer paused', timer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resume timer
router.post('/resume/:quizId', protect, async (req, res) => {
  try {
    const { quizId } = req.params;
    const timer = await QuizTimer.findOne({ quiz: quizId });

    if (!timer || !timer.isPaused) return res.status(400).json({ error: 'Timer is not paused' });

    timer.isPaused = false;
    timer.startTime = new Date(); // reset start time from now
    timer.pausedAt = null;

    await timer.save();
    res.json({ message: 'Timer resumed', timer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
