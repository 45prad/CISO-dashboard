import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle, Clock, Shield, Target, Users, Eye, EyeOff, ChevronRight, Award, Brain, Zap, BarChart3, TrendingUp } from 'lucide-react';
import axios from 'axios';
import UserHeader from '../../components/UserHeader';
import SocketContext from '../../context/SocketContext';
import AuthContext from '../../context/AuthContext';
import MediaPreview from '../../components/MediaPreview';

const TakeQuiz = () => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useContext(AuthContext);
  const { socket, joinQuizRoom, leaveQuizRoom } = useContext(SocketContext);

  useEffect(() => {
    // Join socket room
    if (socket && user) {
      joinQuizRoom(id);
    }

    return () => {
      if (socket && user) {
        leaveQuizRoom(id);
      }
    };
  }, [id, socket, joinQuizRoom]);

  useEffect(() => {
    if (!socket) return;

    const handleShowOptions = (data) => {
      if (data.quizId === id) {
        setQuiz(prev => prev ? { ...prev, showOptions: true } : prev);
      }
    };

    socket.on('showOptions', handleShowOptions);

    return () => {
      socket.off('showOptions', handleShowOptions);
    };
  }, [socket]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/quizzes/${id}`);

        // Check if quiz is active
        if (!data.isActive) {
          setError('This quiz is not currently active');
          setLoading(false);
          return;
        }

        // Check if user has already submitted this quiz
        const submissionsRes = await axios.get(`${backendUrl}/api/submissions/user`);
        const hasSubmitted = submissionsRes.data.some(sub => sub.quiz === id || sub.quiz._id === id);

        if (hasSubmitted) {
          navigate(`/quiz/${id}/result`);
          return;
        }

        setQuiz(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch quiz');
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id, navigate]);

  const handleOptionSelect = (questionId, optionId) => {
    setSelectedOptions({
      ...selectedOptions,
      [questionId]: optionId
    });
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions have been answered
    const allQuestionsAnswered = quiz.questions.every(question =>
      selectedOptions[question._id] !== undefined
    );

    if (!allQuestionsAnswered) {
      setError('Please answer all questions before submitting');
      return;
    }

    try {
      setSubmitting(true);

      // Format answers for submission
      const answers = Object.keys(selectedOptions).map(questionId => ({
        questionId,
        selectedOption: selectedOptions[questionId]
      }));

      await axios.post(`${backendUrl}/api/submissions`, {
        quizId: id,
        answers
      });

      setSubmitting(false);
      navigate(`/quiz/${id}/waiting`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <UserHeader />
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
              <div className="absolute inset-2 animate-pulse rounded-full bg-blue-100"></div>
            </div>
            <div className="text-gray-800 text-lg font-semibold">Loading Executive Assessment</div>
            <div className="text-gray-600 text-sm">Preparing your strategic scenario...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <UserHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-md">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Assessment Unavailable</h3>
                  <p className="text-red-700 mb-4">{error}</p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-100">
        <UserHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Scenario Not Found</h3>
              <p className="text-gray-600">The requested assessment scenario could not be located.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const answeredQuestions = Object.keys(selectedOptions).length;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <UserHeader />

      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Scenario Header Card */}
            <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <div className="flex items-center space-x-3 mb-3">
                  <Award className="h-6 w-6" />
                  <span className="text-blue-100 text-sm font-medium uppercase tracking-wider">Strategic Scenario</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-3">{quiz.title}</h1>
                <p className="text-blue-100 leading-relaxed">{quiz.description}</p>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">

                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight mb-6">
                  {currentQuestion.text}
                </h2>

                <MediaPreview filepath={currentQuestion.imageUrl} />

                {quiz.showOptions ? (
                  <div className="space-y-4">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedOptions[currentQuestion._id] === option._id;
                      const optionLetter = String.fromCharCode(65 + index);

                      return (
                        <div
                          key={option._id}
                          className={`group relative border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                            }`}
                          onClick={() => handleOptionSelect(currentQuestion._id, option._id)}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg border-2 flex items-center justify-center font-semibold transition-all duration-200 ${isSelected
                              ? 'border-blue-500 bg-blue-500 text-white'
                              : 'border-gray-300 bg-white text-gray-600 group-hover:border-blue-400'
                              }`}>
                              {isSelected ? <CheckCircle size={18} /> : optionLetter}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                  Option {optionLetter}
                                </span>
                                {isSelected && (
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-xs text-blue-600 font-medium">Selected</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-gray-800 leading-relaxed font-medium">
                                {option.text}
                              </p>
                              {option.imageUrl && (
                                <div className="md:col-span-2 mt-4 flex gap-4">
                                  {option.imageUrl && (
                                    <div className="w-32 h-32 border rounded overflow-hidden">
                                      <MediaPreview filepath={option.imageUrl} />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className={`flex-shrink-0 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                              }`}>
                              <ChevronRight className="h-5 w-5 text-blue-500" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <EyeOff className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-yellow-800">
                          <span className="font-medium">Facilitator Note:</span> Response options will be revealed after the discussion period.
                          Allow participants time to review the scenario and discuss initial thoughts before proceeding to response options.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800 mb-1">Assessment Issue</h4>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${currentQuestionIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md'
                  }`}
              >
                <ArrowLeft size={18} className="mr-2" />
                Previous Question
              </button>

              <div className="flex items-center space-x-4">
                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <button
                    onClick={goToNextQuestion}
                    disabled={!selectedOptions[currentQuestion._id]}
                    className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${selectedOptions[currentQuestion._id]
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    Next Question
                    <ArrowRight size={18} className="ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Assessment
                        <CheckCircle size={18} className="ml-2" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Assessment Overview */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Assessment Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Situations</span>
                    <span className="font-semibold text-gray-900">{quiz.questions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-semibold text-green-600">{answeredQuestions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Remaining</span>
                    <span className="font-semibold text-orange-600">{quiz.questions.length - answeredQuestions}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="font-semibold text-blue-600">{Math.round(progress)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Assessment Tips
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    Consider long-term strategic implications
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    Evaluate stakeholder impact
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    Think about resource allocation
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    Consider risk mitigation strategies
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;