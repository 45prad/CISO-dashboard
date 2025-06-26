
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertTriangle, ShieldAlert, ShieldCheck, Info, Shield, Check, Flame } from 'lucide-react';
import axios from 'axios';
import UserHeader from '../../components/UserHeader';
import AuthContext from '../../context/AuthContext';
import SocketContext from '../../context/SocketContext';
import QuizTimerHeader from '../../components/Quiz/QuizTimerHeader';

const QuizResult = () => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentJustification, setCurrentJustification] = useState('');

  const { user } = useContext(AuthContext);
  const { socket, joinQuizRoom, leaveQuizRoom } = useContext(SocketContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();

    // Join socket room
    if (socket && user) {
      joinQuizRoom(id);
    }

    // Cleanup on unmount
    return () => {
      if (socket && user) {
        leaveQuizRoom(id);
      }
    };
  }, [id, user, socket, navigate, joinQuizRoom, leaveQuizRoom]);

  const fetchData = async () => {
      try {
        // Fetch quiz and user submission
        const [quizRes, submissionsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/quizzes/${id}`),
          axios.get(`${backendUrl}/api/submissions/user`)
        ]);

        setQuiz(quizRes.data);

        // Find user's submission for this quiz
        const userSubmission = submissionsRes.data.find(sub =>
          sub.quiz === id || (sub.quiz && sub.quiz._id === id)
        );

        if (!userSubmission) {
          // If no submission found, redirect to take quiz
          navigate(`/quiz/${id}`);
          return;
        }

        setSubmission(userSubmission);

        // Initialize expanded state for all questions
        const initialExpandedState = {};
        quizRes.data.questions.forEach((q, index) => {
          initialExpandedState[q._id] = index === 0; // Expand only the first question
        });
        setExpandedQuestions(initialExpandedState);

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
        setLoading(false);
      }
    };


  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // Listen for impact reveal
    const handleShowImpact = (data) => {
      if (data.quizId === id) {
        // Update quiz state
        setQuiz(prev => prev ? { ...prev, showImpact: true } : prev);
      }
    };

    // Listen for mitigation reveal
    const handleShowMitigation = async (data) => {
      if (data.quizId === id) {
        await fetchData();
        setQuiz(prev => prev ? { ...prev, showMitigation: true } : prev);
      }
    };

    socket.on('showImpact', handleShowImpact);
    socket.on('showMitigation', handleShowMitigation);

    return () => {
      socket.off('showImpact', handleShowImpact);
      socket.off('showMitigation', handleShowMitigation);
    };
  }, [socket, id]);

  // If no impact is shown yet, redirect to waiting room
  useEffect(() => {
    if (quiz && !quiz.showImpact) {
      navigate(`/quiz/${id}/waiting`);
    }
  }, [quiz, id, navigate]);

  const toggleQuestion = (questionId) => {
    setExpandedQuestions({
      ...expandedQuestions,
      [questionId]: !expandedQuestions[questionId]
    });
  };

  // Check if the user selected an option for a question
  const getUserSelection = (questionId) => {
    if (!submission || !submission.answers) return null;

    const answer = submission.answers.find(a => a.questionId === questionId);
    return answer ? answer.selectedOption : null;
  };

  // Find the option object by ID
  const findOptionById = (question, optionId) => {
    return question.options.find(opt => opt._id === optionId);
  };

  // Open justification modal
  const openJustificationModal = (justification) => {
    setCurrentJustification(justification);
    setModalOpen(true);
  };

  const getSeverityIcon = (severity) => {
  switch (severity) {
    case 'low':
      return <Check size={16} className="text-green-700" />;
    case 'medium':
      return <AlertTriangle size={16} className="text-yellow-700" />;
    case 'high':
      return <Shield size={16} className="text-orange-700" />;
    case 'critical':
      return <Flame size={16} className="text-red-700" />;
    default:
      return null;
  }
};


  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityInfo = (options, selectedOptionId) => {
  const fallback = { severity: 'unknown', color: 'bg-gray-100 text-gray-800' };

  if (!options || !selectedOptionId) return fallback;

  const selected = options.find(
    opt => opt._id === selectedOptionId || opt._id?.toString() === selectedOptionId?.toString()
  );
  if (!selected) return fallback;

  const scores = options.map(opt => opt.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min;

  if (range === 0) return { severity: 'unknown', color: 'bg-gray-100 text-gray-800' };

  const normalizedScore = (selected.score - min) / range;

  if (normalizedScore >= 0.75) {
    return { severity: 'low', color: 'bg-green-100 text-green-800' };
  } else if (normalizedScore >= 0.5) {
    return { severity: 'medium', color: 'bg-yellow-100 text-yellow-800' };
  } else if (normalizedScore >= 0.25) {
    return { severity: 'high', color: 'bg-orange-100 text-orange-800' };
  } else {
    return { severity: 'critical', color: 'bg-red-100 text-red-800' };
  }
};


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="bg-red-100 text-red-700 p-4 rounded-md">
            {error}
          </div>

          <div className="mt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft size={20} className="mr-1" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      <QuizTimerHeader quizId={quiz._id} />

      {/* Justification Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Justification</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-medium"
              >
                &times;
              </button>
            </div>
            <div className="text-gray-700 text-sm leading-relaxed">
              {currentJustification || 'No justification provided for this scenario.'}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Risk Analysis & Actions</h1>
          <p className="text-gray-600 mt-2">{quiz.title}</p>
        </div>

        {/* Question results */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            {quiz.questions.map((question, index) => {
              const userSelection = getUserSelection(question._id);
              const selectedOption = userSelection ? findOptionById(question, userSelection) : null;
              const correctOption = question.options.find(opt => opt.isCorrect);
              const isCorrect = selectedOption && selectedOption.isCorrect;

              return (
                <div key={question._id} className="border rounded-md overflow-hidden">
                  <div
                    className="flex justify-between items-start p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleQuestion(question._id)}
                  >
                    <div className="flex items-start">
                      <div className={`mt-0.5 mr-3 flex-shrink-0 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base leading-tight">
                          {index + 1}. {question.text}
                        </h3>
                        <p className="text-sm mt-2 text-gray-700">
                          {selectedOption ? (
                            <>
                              Your Decision: <span className="font-medium text-gray-900">{selectedOption.text}</span>
                            </>
                          ) : (
                            <span className="text-red-600 font-medium">No Decision provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {expandedQuestions[question._id] ? (
                        <ChevronUp size={20} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-500" />
                      )}
                    </div>
                  </div>

                  {expandedQuestions[question._id] && (
                    <div className="flex flex-col">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-8 py-4 items-start">
                        {question.options.map((option) => {
                          return (
                            <div
                              key={option._id}
                              className="border rounded-lg overflow-hidden h-full flex flex-col"
                            >
                              <div className={`${getSeverityColor(option.isCorrect ? "low" : (userSelection === option._id ? 'high' : 'mediumm'))} border-b flex flex-row items-start p-4 min-h-[120px]`}>
                                <div className="flex-shrink-0 mr-3 mt-1">
                                  {option.isCorrect ? (
                                    <CheckCircle className="w-5 h-5" />
                                  ) : (userSelection === option._id ? (
                                    <XCircle className="w-5 h-5" />
                                  ) : (
                                    <div className="w-5 h-5"></div>
                                  ))}
                                </div>
                                <h4 className="font-medium text-gray-800 text-sm leading-relaxed flex-1 min-w-0">
                                  {option.text}
                                </h4>
                                {option.isCorrect && option.justification && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openJustificationModal(option.justification);
                                    }}
                                    className="ml-3 text-blue-500 hover:text-blue-700 flex-shrink-0"
                                  >
                                    <Info size={16} />
                                  </button>
                                )}
                              </div>
                              <div className="p-4 flex-1">
                                {quiz.showImpact && (
                                  <div>
                                    <div className="flex items-center mb-2">
                                      <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getSeverityInfo(question.options, option._id).color}`}>
                                        {getSeverityIcon(getSeverityInfo(question.options, option._id).severity)}
                                        <span className="ml-1 capitalize">{getSeverityInfo(question.options, option._id).severity} Risk</span>
                                      </div>
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed">{option.impact}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {quiz.showMitigation && (
                        <div className="px-8 py-4 bg-gray-50 border-t">
                          <h5 className="text-base font-semibold text-blue-800 mb-3">
                            Kinematic Actions:
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                            {question?.kinematicActions.map((ka, index) => (
                              <div
                                key={index}
                                className="group relative bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 p-3 rounded-lg transition-all duration-200 hover:shadow-md"
                              >
                                <div className="flex flex-col gap-2">
                                  <div className="font-semibold text-gray-900 text-sm">
                                    {ka.action}
                                  </div>
                                  <div className="text-gray-700 text-sm leading-relaxed">
                                    {ka.description}
                                  </div>
                                </div>
                                {/* Subtle accent border */}
                                <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-blue-300 transition-colors duration-200 pointer-events-none"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-start">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center py-2 px-4 bg-[#00174D] text-white rounded-md hover:bg-[#00174D] transition-colors text-sm font-medium"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
};

export default QuizResult;
