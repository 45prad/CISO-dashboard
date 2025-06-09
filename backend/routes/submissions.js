import express from 'express';
import Submission from '../models/Submission.js';
import Quiz from '../models/Quiz.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();


// routes/submissions.js
// Add this new route
router.get('/summary/:quizId', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Assuming the quiz has only one question for this feature
    const questionId = quiz.questions[0]._id;
    
    const submissions = await Submission.find({ quiz: req.params.quizId });
    
    // Count selections for each option
    const optionCounts = {};
    quiz.questions[0].options.forEach(option => {
      optionCounts[option._id] = {
        optionText: option.text,
        count: 0
      };
    });
    
    submissions.forEach(submission => {
      const answer = submission.answers.find(a => a.questionId.equals(questionId));
      if (answer && optionCounts[answer.selectedOption]) {
        optionCounts[answer.selectedOption].count += 1;
      }
    });
    
    res.json(Object.values(optionCounts));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/submissions
// @desc    Create a new submission
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    
    // Check if user has already submitted this quiz
    const existingSubmission = await Submission.findOne({
      quiz: quizId,
      user: req.user._id,
      completed: true
    });
    
    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this quiz' });
    }
    
    // Get quiz to calculate score
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Calculate score
    let score = 0;
    
    answers.forEach(answer => {
      const question = quiz.questions.id(answer.questionId);
      if (question) {
        const selectedOption = question.options.id(answer.selectedOption);
        if (selectedOption) {
          score += selectedOption.score || 0; // Add score of the selected option
        }
      }
    });
    
    // Create submission
    const submission = await Submission.create({
      quiz: quizId,
      user: req.user._id,
      answers,
      completed: true,
      score
    });
    
    res.status(201).json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all submissions for a specific quiz with user details and answers
router.get('/quiz/:quizId/stats', protect, admin, async (req, res) => {
  try {
    const { quizId } = req.params;

    // Get quiz with questions and options
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Get all submissions for the quiz
    const submissions = await Submission.find({ quiz: quizId }).populate({
      path: 'user',
      select: 'name email'
    });

    // Build a map: optionId -> [users]
    const optionUserMap = {};

    submissions.forEach(sub => {
      sub.answers.forEach(ans => {
        const key = ans.selectedOption.toString();
        if (!optionUserMap[key]) optionUserMap[key] = [];
        optionUserMap[key].push({
          userId: sub.user._id,
          name: sub.user.name,
          email: sub.user.email,
          timestamp: sub.submittedAt
        });
      });
    });

    // Build response
    const stats = quiz.questions.map(question => ({
      questionId: question._id,
      questionText: question.text,
      options: question.options.map(option => {
        const selectedUsers = optionUserMap[option._id.toString()] || [];
        return {
          optionId: option._id,
          optionText: option.text,
          selectedCount: selectedUsers.length,
          users: selectedUsers
        };
      })
    }));

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/submissions/quiz/:quizId
// @desc    Get all submissions for a quiz
// @access  Private/Admin
router.get('/quiz/:quizId', protect, admin, async (req, res) => {
  try {
    const submissions = await Submission.find({ quiz: req.params.quizId })
      .populate('user', 'name email')
      .sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/submissions/user
// @desc    Get all submissions for the current user
// @access  Private
router.get('/user', protect, async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.user._id })
      .populate('quiz', 'title description')
      .sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/submissions/:id
// @desc    Get submission by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('quiz')
      .populate('user', 'name email');
    
    if (submission) {
      // If user is not admin, check if submission belongs to them
      if (req.user.role !== 'admin' && submission.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to access this submission' });
      }
      
      res.json(submission);
    } else {
      res.status(404).json({ message: 'Submission not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;