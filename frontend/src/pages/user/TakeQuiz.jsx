import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import UserHeader from '../../components/UserHeader';
import AuthContext from '../../context/AuthContext';

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
          <div className="bg-red-100 text-red-700 p-4 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
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
  
  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="bg-red-100 text-red-700 p-4 rounded-md">
            Scenario not found
          </div>
        </div>
      </div>
    );
  }
  
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          <p className="text-gray-600 mt-1">{quiz.description}</p>
        </div>
        
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
            <span className="text-sm font-medium text-teal-600">{progress}% Complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-teal-600 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{currentQuestion.text}</h2>
          
          <div className="space-y-3">
            {currentQuestion.options.map(option => (
              <div
                key={option._id}
                className={`border rounded-md p-4 cursor-pointer transition-colors ${
                  selectedOptions[currentQuestion._id] === option._id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50'
                }`}
                onClick={() => handleOptionSelect(currentQuestion._id, option._id)}
              >
                <div className="flex items-start">
                  <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center border ${
                    selectedOptions[currentQuestion._id] === option._id
                      ? 'border-teal-500 bg-teal-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedOptions[currentQuestion._id] === option._id && (
                      <CheckCircle size={16} className="text-white" />
                    )}
                  </div>
                  <span className="ml-3 text-gray-800">{option.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center py-2 px-4 rounded-md ${
              currentQuestionIndex === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            } transition-colors`}
          >
            <ArrowLeft size={18} className="mr-2" />
            Previous
          </button>
          
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <button
              onClick={goToNextQuestion}
              className="flex items-center py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
            >
              Next
              <ArrowRight size={18} className="ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center py-2 px-6 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Scenario
                  <CheckCircle size={18} className="ml-2" />
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default TakeQuiz;