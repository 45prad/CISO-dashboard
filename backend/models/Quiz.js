import mongoose from 'mongoose';

const OptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  impact: {
    type: String,
    required: true
  },
  mitigation: {
    type: String,
    required: true
  },
  justification: {
    type: String,
    required: function() { return this.isCorrect; }
  }
});

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  options: [OptionSchema],
  isVisible: {
    type: Boolean,
    default: false
  },
  optionsVisible: {
    type: Boolean,
    default: false
  },
  showSummary: {
    type: Boolean,
    default: false
  },
  showImpact: {
    type: Boolean,
    default: false
  },
  showMitigation: {
    type: Boolean,
    default: false
  }
});

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  questions: [QuestionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: false
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Quiz = mongoose.model('Quiz', QuizSchema);

export default Quiz;