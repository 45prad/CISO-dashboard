import express from 'express';
import Quiz from '../models/Quiz.js';
import User from '../models/User.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/quizzes
// @desc    Create a new quiz
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    
    const quiz = await Quiz.create({
      title,
      description,
      questions,
      createdBy: req.user._id
    });
    
    res.status(201).json(quiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/quizzes
// @desc    Get all quizzes
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const quizzes = await Quiz.find({}).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/quizzes/assigned
// @desc    Get assigned quizzes for a user
// @access  Private
router.get('/assigned', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('assignedQuizzes');
    
    if (user) {
      res.json(user.assignedQuizzes);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/quizzes/:id
// @desc    Get quiz by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (quiz) {
      // If user is not admin, check if quiz is assigned to them
      if (req.user.role !== 'admin') {
        const user = await User.findById(req.user._id);
        if (!user.assignedQuizzes.includes(quiz._id)) {
          return res.status(403).json({ message: 'Not authorized to access this quiz' });
        }
      }
      
      res.json(quiz);
    } else {
      res.status(404).json({ message: 'Quiz not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/quizzes/:id
// @desc    Update quiz
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { title, description, questions, assignedUsers, isActive } = req.body;
    
    const quiz = await Quiz.findById(req.params.id);
    
    if (quiz) {
      quiz.title = title || quiz.title;
      quiz.description = description || quiz.description;
      quiz.questions = questions || quiz.questions;
      quiz.assignedUsers = assignedUsers || quiz.assignedUsers;
      
      if (isActive !== undefined) {
        quiz.isActive = isActive;
      }
      
      const updatedQuiz = await quiz.save();
      
      // If assignedUsers is provided, update users' assignedQuizzes
      if (assignedUsers) {
        // First remove this quiz from all users who have it assigned
        await User.updateMany(
          { assignedQuizzes: quiz._id }, 
          { $pull: { assignedQuizzes: quiz._id } }
        );
        
        // Then add it to the specified users
        await User.updateMany(
          { _id: { $in: assignedUsers } },
          { $addToSet: { assignedQuizzes: quiz._id } }
        );
      }
      
      res.json(updatedQuiz);
    } else {
      res.status(404).json({ message: 'Quiz not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/quizzes/:id
// @desc    Delete quiz
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (quiz) {
      await quiz.deleteOne();
      
      // Remove quiz from users' assignedQuizzes
      await User.updateMany(
        { assignedQuizzes: quiz._id }, 
        { $pull: { assignedQuizzes: quiz._id } }
      );
      
      res.json({ message: 'Quiz removed' });
    } else {
      res.status(404).json({ message: 'Quiz not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/quizzes/:id/activate
// @desc    Activate quiz
// @access  Private/Admin
router.put('/:id/activate', protect, admin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (quiz) {
      quiz.isActive = true;
      await quiz.save();
      
      res.json({ message: 'Quiz activated' });
    } else {
      res.status(404).json({ message: 'Quiz not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/quizzes/:id/deactivate
// @desc    Deactivate quiz
// @access  Private/Admin
router.put('/:id/deactivate', protect, admin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (quiz) {
      quiz.isActive = false;
      await quiz.save();
      
      res.json({ message: 'Quiz deactivated' });
    } else {
      res.status(404).json({ message: 'Quiz not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/summary', protect, admin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (quiz) {
      quiz.showSummary = !quiz.showSummary;
      await quiz.save();
      
      res.json({ showSummary: quiz.showSummary });
    } else {
      res.status(404).json({ message: 'Quiz not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/quizzes/:id/impact
// @desc    Toggle impact visibility
// @access  Private/Admin
router.put('/:id/impact', protect, admin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (quiz) {
      quiz.showImpact = !quiz.showImpact;
      await quiz.save();
      
      res.json({ showImpact: quiz.showImpact });
    } else {
      res.status(404).json({ message: 'Quiz not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/quizzes/:id/mitigation
// @desc    Toggle mitigation visibility
// @access  Private/Admin
router.put('/:id/mitigation', protect, admin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (quiz) {
      quiz.showMitigation = !quiz.showMitigation;
      await quiz.save();
      
      res.json({ showMitigation: quiz.showMitigation });
    } else {
      res.status(404).json({ message: 'Quiz not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new routes for question control
router.put('/:id/question/:questionIndex/show', protect, admin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const questionIndex = parseInt(req.params.questionIndex);
    if (questionIndex >= 0 && questionIndex < quiz.questions.length) {
      quiz.questions[questionIndex].isVisible = true;
      quiz.currentQuestionIndex = questionIndex;
      await quiz.save();
      res.json({ message: 'Question shown' });
    } else {
      res.status(400).json({ message: 'Invalid question index' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/question/:questionIndex/options', protect, admin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const questionIndex = parseInt(req.params.questionIndex);
    if (questionIndex >= 0 && questionIndex < quiz.questions.length) {
      quiz.questions[questionIndex].optionsVisible = true;
      await quiz.save();
      res.json({ message: 'Options shown' });
    } else {
      res.status(400).json({ message: 'Invalid question index' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/question/:questionIndex/summary', protect, admin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const questionIndex = parseInt(req.params.questionIndex);
    if (questionIndex >= 0 && questionIndex < quiz.questions.length) {
      quiz.questions[questionIndex].showSummary = true;
      await quiz.save();
      res.json({ message: 'Summary shown' });
    } else {
      res.status(400).json({ message: 'Invalid question index' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/question/:questionIndex/impact', protect, admin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const questionIndex = parseInt(req.params.questionIndex);
    if (questionIndex >= 0 && questionIndex < quiz.questions.length) {
      quiz.questions[questionIndex].showImpact = true;
      await quiz.save();
      res.json({ message: 'Impact shown' });
    } else {
      res.status(400).json({ message: 'Invalid question index' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/question/:questionIndex/mitigation', protect, admin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const questionIndex = parseInt(req.params.questionIndex);
    if (questionIndex >= 0 && questionIndex < quiz.questions.length) {
      quiz.questions[questionIndex].showMitigation = true;
      await quiz.save();
      res.json({ message: 'Mitigation shown' });
    } else {
      res.status(400).json({ message: 'Invalid question index' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/nextQuestion', protect, admin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const nextIndex = quiz.currentQuestionIndex + 1;
    if (nextIndex < quiz.questions.length) {
      quiz.currentQuestionIndex = nextIndex;
      await quiz.save();
      res.json({ message: 'Moved to next question', currentQuestionIndex: nextIndex });
    } else {
      res.status(400).json({ message: 'No more questions' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;