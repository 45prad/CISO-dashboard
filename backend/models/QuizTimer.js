import mongoose from 'mongoose';

const QuizTimerSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
    unique: true // One timer per quiz
  },
  startTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in milliseconds
    required: true
  },
  isPaused: {
    type: Boolean,
    default: false
  },
  pausedAt: {
    type: Date
  },
  elapsedBeforePause: {
    type: Number, // in milliseconds
    default: 0
  }
});

const QuizTimer = mongoose.model('QuizTimer', QuizTimerSchema);

export default QuizTimer;
