import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import UserHeader from '../../components/UserHeader';
import AuthContext from '../../context/AuthContext';
import SocketContext from '../../context/SocketContext';

const TakeQuiz = () => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const { user } = useContext(AuthContext);
  const { socket, joinQuizRoom } = useContext(SocketContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/quizzes/${id}`);
        
        if (!data.isActive) {
          setError('This scenario is not currently active');
          setLoading(false);
          return;
        }
        
        setQuiz(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch scenario');
        setLoading(false);
      }
    };
    
    fetchQuiz();
    
    if (socket) {
      joinQuizRoom(id);
      
      socket.on('questionShown', ({ questionIndex }) => {
        setQuiz(prev => ({
          ...prev,
          currentQuestionIndex: questionIndex,
          questions: prev.questions.map((q, i) => ({
            ...q,
            isVisible: i === questionIndex
          }))
        }));
      });
      
      socket.on('optionsShown', ({ questionIndex }) => {
        setQuiz(prev => ({
          ...prev,
          questions: prev.questions.map((q, i) => ({
            ...q,
            optionsVisible: i === questionIndex ? true : q.optionsVisible
          }))
        }));
      });
    }
    
    return () => {
      if (socket) {
        socket.off('questionShown');
        socket.off('optionsShown');
      }
    };
  }, [id, socket]);
  
  const handleOptionSelect = async (optionId) => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      
      await axios.post(`${backendUrl}/api/submissions`, {
        quizId: id,
        answers: [{
          questionId: quiz.questions[quiz.currentQuestionIndex]._id,
          selectedOption: optionId
        }]
      });
      
      setSelectedOption(optionId);
      setSubmitting(false);
      navigate(`/quiz/${id}/waiting`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit answer');
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
  
  const currentQuestion = quiz.questions[quiz.currentQuestionIndex];
  
  if (!currentQuestion?.isVisible) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Waiting for the scenario to begin...</h2>
            <div className="animate-pulse flex space-x-2 justify-center">
              <div className="h-3 w-3 bg-teal-400 rounded-full"></div>
              <div className="h-3 w-3 bg-teal-500 rounded-full"></div>
              <div className="h-3 w-3 bg-teal-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          <p className="text-gray-600 mt-1">Question {quiz.currentQuestionIndex + 1} of {quiz.questions.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{currentQuestion.text}</h2>
          
          {currentQuestion.optionsVisible ? (
            <div className="space-y-3">
              {currentQuestion.options.map(option => (
                <button
                  key={option._id}
                  onClick={() => handleOptionSelect(option._id)}
                  disabled={selectedOption !== null}
                  className={`w-full border rounded-md p-4 text-left transition-colors ${
                    selectedOption === option._id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center border ${
                      selectedOption === option._id
                        ? 'border-teal-500 bg-teal-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedOption === option._id && (
                        <CheckCircle size={16} className="text-white" />
                      )}
                    </div>
                    <span className="ml-3 text-gray-800">{option.text}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Waiting for options to be revealed...</p>
              <div className="animate-pulse flex space-x-2 justify-center mt-4">
                <div className="h-3 w-3 bg-teal-400 rounded-full"></div>
                <div className="h-3 w-3 bg-teal-500 rounded-full"></div>
                <div className="h-3 w-3 bg-teal-600 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TakeQuiz;