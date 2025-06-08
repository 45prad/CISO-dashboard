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
    required: function() { return this.isCorrect; } // Only required if isCorrect is true
  },
  imageUrl: {
    type: String // Optional field for image
  },
  videoUrl: {
    type: String // Optional field for video
  }
});

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String // Optional field for question image
  },
  videoUrl: {
    type: String // Optional field for question video
  },
  options: [OptionSchema]
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
  showImpact: {
    type: Boolean,
    default: false
  },
  showSummary: {
    type: Boolean,
    default: false
  },
  showOptions: {
    type: Boolean,
    default: false
  },
  showMitigation: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Quiz = mongoose.model('Quiz', QuizSchema);

export default Quiz;