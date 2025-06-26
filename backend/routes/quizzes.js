import express from 'express';
import mongoose from 'mongoose';
import Quiz from '../models/Quiz.js';
import User from '../models/User.js';
import { protect, admin } from '../middleware/auth.js';
import createUploadMiddleware from '../utils/uploadUtils.js';
import Submission from '../models/Submission.js';

const router = express.Router();

const upload = createUploadMiddleware('uploads/quiz', true);

// @route   POST /api/quizzes
// @desc    Create a new quiz
// @access  Private/Admin
router.post('/', protect, admin, upload.fields([
  { name: 'questionMedia', maxCount: 20 },
  { name: 'optionMedia', maxCount: 100 }
]), async (req, res) => {
  try {
    const { title, description, questions: rawQuestions } = req.body;

    const parsedQuestions = JSON.parse(rawQuestions); // since this is coming via multipart/form-data
    console.log(parsedQuestions);

    const questionMedia = req.files['questionMedia'] || [];
    const optionMedia = req.files['optionMedia'] || [];

    // Helper to get file URL by originalname (for matching)
    const getFileUrlByOriginalName = (files, originalName) => {
      const match = files.find(f => f.originalname === originalName);
      return match ? `/uploads/quiz/${match.filename}` : null;
    };

    const questions = parsedQuestions.map((q, qIndex) => {
      // Attach image/video if filenames are provided
      const imageUrl = getFileUrlByOriginalName(questionMedia, q?.imageName);
      const videoUrl = getFileUrlByOriginalName(questionMedia, q?.videoName);

      const options = q.options.map((opt) => ({
        ...opt,
        imageUrl: opt.imageName ? getFileUrlByOriginalName(optionMedia, opt.imageName) : null,
        videoUrl: opt.videoName ? getFileUrlByOriginalName(optionMedia, opt.videoName) : null,
      }));

      const kinematicActions = q.kinematicActions.map((action) => ({
        action: action.action,
        description: action.description,
      }));

      return {
        text: q.text,
        imageUrl,
        videoUrl,
        options,
        kinematicActions,
      };
    });

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

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform quizzes to exclude questions but include length
    const quizzes = user.assignedQuizzes.map((quiz) => ({
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      isActive: quiz.isActive,
      createdAt: quiz.createdAt,
      questionCount: quiz.questions?.length || 0,
    }));

    res.json(quizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/quiz/:quizId/assigned-status',protect, async (req, res) => {
  try {
    const { quizId } = req.params;

    // Validate quiz existence
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Get all users assigned to this quiz
    const assignedUsers = await User.find({ assignedQuizzes: quizId });

    // Get all submissions for this quiz
    const submissions = await Submission.find({ quiz: quizId });

    // Create a lookup map from userId to submission info
    const submissionMap = new Map();
    submissions.forEach(sub => {
      submissionMap.set(sub.user.toString(), {
        submitted: true,
        score: sub.score || 0,
        submittedAt: sub.submittedAt
      });
    });

    // Build result list
    const results = assignedUsers.map(user => {
      const userSub = submissionMap.get(user._id.toString());
      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        submitted: !!userSub,
        score: userSub?.score || 0,
        submittedAt: userSub?.submittedAt || null
      };
    });

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// @route   GET /api/quizzes/:id
// @desc    Get quiz by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Admin: Return full quiz
    if (req.user.role === 'admin') {
      return res.json(quiz);
    }

    // User: Check if quiz is assigned to them
    const user = await User.findById(req.user._id);
    const isAssigned = user.assignedQuizzes.includes(quiz._id);

    if (!isAssigned) {
      return res.status(403).json({ message: 'Not authorized to access this quiz' });
    }

    // Construct filtered quiz object based on visibility flags
    const filteredQuiz = {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      isActive: quiz.isActive,
      createdAt: quiz.createdAt,
      showOptions: quiz.showOptions,
      showImpact: quiz.showImpact,
      showMitigation: quiz.showMitigation,
      showSummary: quiz.showSummary,
      questions: quiz.questions.map(q => {
        const base = {
          _id: q._id,
          text: q.text,
          imageUrl: q.imageUrl,
          videoUrl: q.videoUrl,
        };

        if (!quiz.showOptions) return base;

        const withOptions = {
          ...base,
          options: q.options.map(opt => ({
            _id: opt._id,
            text: opt.text,
            imageUrl: opt.imageUrl,
            videoUrl: opt.videoUrl,
          }))
        };

        if (!quiz.showImpact) return withOptions;

        const withImpact = {
          ...base,
          options: q.options // full options with impact details
        };

        if (!quiz.showMitigation) return withImpact;

        return {
          ...withImpact,
          kinematicActions: q.kinematicActions
        };
      })
    };

    return res.json(filteredQuiz);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// @route   PUT /api/quizzes/:id
// @desc    Update quiz
// @access  Private/Admin
router.put('/:id', protect, admin, upload.fields([
  { name: 'questionMedia', maxCount: 20 },
  { name: 'optionMedia', maxCount: 100 }
]), async (req, res) => {
  try {
    const { title, description, questions: rawQuestions, assignedUsers, isActive } = req.body;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const questionMedia = req.files['questionMedia'] || [];
    const optionMedia = req.files['optionMedia'] || [];

    const getFileUrlByOriginalName = (files, originalName) => {
      const match = files.find(f => f.originalname === originalName);
      return match ? `/uploads/quiz/${match.filename}` : null;
    };

    let updatedQuestions = quiz.questions;

    if (rawQuestions) {
      const parsedQuestions = JSON.parse(rawQuestions);

      updatedQuestions = parsedQuestions.map((q) => {
        const oldQuestion = quiz.questions.find(qOld => qOld._id?.toString() === q._id) || {};

        const imageUrl = q.imageName
          ? getFileUrlByOriginalName(questionMedia, q.imageName) || oldQuestion.imageUrl
          : oldQuestion.imageUrl;

        const videoUrl = q.videoName
          ? getFileUrlByOriginalName(questionMedia, q.videoName) || oldQuestion.videoUrl
          : oldQuestion.videoUrl;

        const options = q.options.map((opt) => {
          const oldOption = oldQuestion.options?.find(o => o._id?.toString() === opt._id) || {};

          return {
            _id: oldOption._id || new mongoose.Types.ObjectId(),
            text: opt.text,
            isCorrect: opt.isCorrect,
            impact: opt.impact,
            justification: opt.justification,
            score: opt.score || 0,
            imageUrl: opt.imageName
              ? getFileUrlByOriginalName(optionMedia, opt.imageName) || oldOption.imageUrl
              : oldOption.imageUrl,
            videoUrl: opt.videoName
              ? getFileUrlByOriginalName(optionMedia, opt.videoName) || oldOption.videoUrl
              : oldOption.videoUrl,
          };
        });

        const kinematicActions = (q.kinematicActions || []).map((action) => {
          const oldAction = oldQuestion.kinematicActions?.find(a => a._id?.toString() === action._id) || {};
          return {
            _id: oldAction._id || new mongoose.Types.ObjectId(),
            action: action.action,
            description: action.description,
          };
        });

        return {
          _id: oldQuestion._id || new mongoose.Types.ObjectId(),
          text: q.text,
          imageUrl,
          videoUrl,
          options,
          kinematicActions,
        };
      });
    }

    // Update fields
    quiz.title = title || quiz.title;
    quiz.description = description || quiz.description;
    quiz.questions = updatedQuestions;
    quiz.assignedUsers = assignedUsers || quiz.assignedUsers;

    if (typeof isActive !== 'undefined') {
      quiz.isActive = isActive;
    }

    const updatedQuiz = await quiz.save();

    // Update assignedUsers
    if (assignedUsers) {
      await User.updateMany({ assignedQuizzes: quiz._id }, { $pull: { assignedQuizzes: quiz._id } });
      await User.updateMany({ _id: { $in: assignedUsers } }, { $addToSet: { assignedQuizzes: quiz._id } });
    }

    res.json(updatedQuiz);
  } catch (err) {
    console.error('Update Quiz Error:', err);
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


// routes/quizzes.js
// Add this new route
router.put('/:id/options', protect, admin, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (quiz) {
      quiz.showOptions = !quiz.showOptions;
      await quiz.save();

      res.json({ showOptions: quiz.showOptions });
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