import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertTriangle, ShieldAlert, ShieldCheck, Info } from 'lucide-react';
import axios from 'axios';
import UserHeader from '../../components/UserHeader';
import AuthContext from '../../context/AuthContext';
import SocketContext from '../../context/SocketContext';

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
    const handleShowMitigation = (data) => {
      if (data.quizId === id) {
        // Update quiz state
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
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
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
              className="flex items-center text-teal-600 hover:text-teal-800"
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
      
      {/* Justification Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Answer Justification</h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="text-gray-700">
              {currentJustification || 'No justification provided for this answer.'}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Scenarios Results</h1>
          <p className="text-gray-600 mt-1">{quiz.title}</p>
        </div>
        
        {/* Results summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-xl font-semibold">Your Score</h2>
              <p className="text-gray-600">
                You answered {submission.score} out of {quiz.questions.length} Situation correctly
              </p>
            </div>
            
            <div className="bg-teal-100 text-teal-800 text-xl font-bold rounded-full h-20 w-20 flex items-center justify-center">
              {Math.round((submission.score / quiz.questions.length) * 100)}%
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-md ${quiz.showImpact ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'}`}>
              <div className="flex items-center">
                <AlertTriangle size={20} className="mr-2" />
                <h3 className="font-semibold">Impact Explanations</h3>
              </div>
              <p className="mt-1 text-sm">
                {quiz.showImpact ? 'Available' : 'Not yet available'}
              </p>
            </div>
            
            <div className={`p-4 rounded-md ${quiz.showMitigation ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
              <div className="flex items-center">
                <ShieldCheck size={20} className="mr-2" />
                <h3 className="font-semibold">Kinematic Actions</h3>
              </div>
              <p className="mt-1 text-sm">
                {quiz.showMitigation ? 'Available' : 'Not yet available'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Question results */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Situation Details</h2>
          
          <div className="space-y-4">
            {quiz.questions.map((question, index) => {
              const userSelection = getUserSelection(question._id);
              const selectedOption = userSelection ? findOptionById(question, userSelection) : null;
              const correctOption = question.options.find(opt => opt.isCorrect);
              const isCorrect = selectedOption && selectedOption.isCorrect;
              
              return (
                <div key={question._id} className="border rounded-md overflow-hidden">
                  <div 
                    className={`flex justify-between items-start p-4 cursor-pointer ${
                      isCorrect ? 'bg-green-50' : 'bg-red-50'
                    }`}
                    onClick={() => toggleQuestion(question._id)}
                  >
                    <div className="flex items-start">
                      <div className={`mt-0.5 mr-3 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {index + 1}. {question.text}
                        </h3>
                        <p className="text-sm mt-1">
                          {selectedOption ? (
                            <>Your answer: <span className="font-medium">{selectedOption.text}</span></>
                          ) : (
                            <span className="text-red-600">No answer provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {expandedQuestions[question._id] ? (
                        <ChevronUp size={20} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-500" />
                      )}
                    </div>
                  </div>
                  
                  {expandedQuestions[question._id] && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="space-y-6">
                        {question.options.map(option => (
                          <div key={option._id} className="border rounded-md overflow-hidden">
                            {/* Option header */}
                            <div className={`flex items-center p-3 ${
                              option.isCorrect ? 'bg-green-50' : 
                              (userSelection === option._id ? 'bg-red-50' : 'bg-gray-50')
                            }`}>
                              <div className={`mr-3 ${
                                option.isCorrect ? 'text-green-600' : 
                                (userSelection === option._id ? 'text-red-600' : 'text-gray-500')
                              }`}>
                                {option.isCorrect ? (
                                  <CheckCircle size={18} />
                                ) : (userSelection === option._id ? (
                                  <XCircle size={18} />
                                ) : (
                                  <div className="h-4 w-4 border border-gray-300 rounded-full"></div>
                                ))}
                              </div>
                              <span className={`font-medium ${
                                option.isCorrect ? 'text-green-800' : 
                                (userSelection === option._id ? 'text-red-800' : 'text-gray-700')
                              }`}>
                                {option.text} {option.isCorrect && "(Correct Answer)"}
                              </span>
                              {option.isCorrect && option.justification && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openJustificationModal(option.justification);
                                  }}
                                  className="ml-2 text-blue-500 hover:text-blue-700"
                                  >
                                  <Info size={16} />
                                </button>
                              )}
                            </div>

                            {/* Impact section */}
                            {quiz.showImpact && (
                              <div className="p-3 bg-orange-50 border-t">
                                <div className="flex items-start">
                                  <AlertTriangle size={16} className="text-orange-600 mr-2 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-orange-800 text-sm mb-1">Impact:</p>
                                    <p className="text-orange-700 text-sm">{option.impact}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Mitigation section */}
                            {quiz.showMitigation && (
                              <div className="p-3 bg-green-50 border-t">
                                <div className="flex items-start">
                                  <ShieldAlert size={16} className="text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-green-800 text-sm mb-1">Kinematic Actions:</p>
                                    <p className="text-green-700 text-sm">{option.mitigation}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
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
            className="flex items-center py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
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