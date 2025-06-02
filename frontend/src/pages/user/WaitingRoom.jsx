import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, AlertTriangle, ShieldCheck, BarChart2 } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import UserHeader from '../../components/UserHeader';
import AuthContext from '../../context/AuthContext';
import SocketContext from '../../context/SocketContext';

const WaitingRoom = () => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  const { user } = useContext(AuthContext);
  const { socket, joinQuizRoom } = useContext(SocketContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/quizzes/${id}`);
        setQuiz(data);
        setCurrentQuestion(data.questions[data.currentQuestionIndex]);
        
        // Check if quiz is completed
        if (data.currentQuestionIndex === data.questions.length - 1 && 
            data.questions[data.currentQuestionIndex].showMitigation) {
          setQuizCompleted(true);
        }
        
        if (data.questions[data.currentQuestionIndex].showSummary) {
          const summaryRes = await axios.get(`${backendUrl}/api/submissions/summary/${id}`);
          setSummaryData(summaryRes.data);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
        setLoading(false);
      }
    };
    
    fetchData();
    
    if (socket) {
      joinQuizRoom(id);
      
      socket.on('questionSummaryShown', async ({ quizId, questionIndex }) => {
        try {
          const summaryRes = await axios.get(`${backendUrl}/api/submissions/summary/${quizId}`);
          setSummaryData(summaryRes.data);
          setQuiz(prev => {
            const updatedQuiz = {
              ...prev,
              questions: prev.questions.map((q, i) => ({
                ...q,
                showSummary: i === questionIndex ? true : q.showSummary
              }))
            };
            setCurrentQuestion(updatedQuiz.questions[questionIndex]);
            return updatedQuiz;
          });
        } catch (error) {
          console.error('Failed to fetch summary data:', error);
        }
      });
      
      socket.on('questionImpactShown', ({ quizId, questionIndex }) => {
        setQuiz(prev => {
          const updatedQuiz = {
            ...prev,
            questions: prev.questions.map((q, i) => ({
              ...q,
              showImpact: i === questionIndex ? true : q.showImpact
            }))
          };
          setCurrentQuestion(updatedQuiz.questions[questionIndex]);
          return updatedQuiz;
        });
      });
      
      socket.on('questionMitigationShown', ({ quizId, questionIndex }) => {
        setQuiz(prev => {
          const updatedQuiz = {
            ...prev,
            questions: prev.questions.map((q, i) => ({
              ...q,
              showMitigation: i === questionIndex ? true : q.showMitigation
            }))
          };
          setCurrentQuestion(updatedQuiz.questions[questionIndex]);
          
          // Check if this is the last question and mitigation is shown
          if (questionIndex === prev.questions.length - 1) {
            setQuizCompleted(true);
          }
          
          return updatedQuiz;
        });
      });
      
      socket.on('movedToNextQuestion', ({ quizId, questionIndex }) => {
        if (!quizCompleted) {
          navigate(`/quiz/${quizId}`);
        }
      });
    }
    
    return () => {
      if (socket) {
        socket.off('questionSummaryShown');
        socket.off('questionImpactShown');
        socket.off('questionMitigationShown');
        socket.off('movedToNextQuestion');
      }
    };
  }, [id, socket]);
  
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
        </div>
      </div>
    );
  }
  
  const labeledSummaryData = summaryData.map((item, index) => ({
    ...item,
    shortLabel: String.fromCharCode(65 + index)
  }));
  
  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserHeader />
        <main className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Quiz Results</h1>
            <p className="text-gray-600 mt-1">{quiz.title}</p>
          </div>
          
          <div className="space-y-8">
            {quiz.questions.map((question, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Question {index + 1}: {question.text}
                </h2>
                
                {question.showSummary && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Response Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={labeledSummaryData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="shortLabel" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#6366F1" name="Selected Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                
                {question.showImpact && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Impact Analysis</h3>
                    {question.options.map((option) => (
                      <div key={option._id} className="mb-4 p-4 bg-orange-50 rounded-md">
                        <p className="font-medium mb-2">{option.text}</p>
                        <p className="text-orange-700">{option.impact}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {question.showMitigation && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Kinematic Actions</h3>
                    {question.options.map((option) => (
                      <div key={option._id} className="mb-4 p-4 bg-green-50 rounded-md">
                        <p className="font-medium mb-2">{option.text}</p>
                        <p className="text-green-700">{option.mitigation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Question Results</h1>
          <p className="text-gray-600 mt-1">
            Question {quiz.currentQuestionIndex + 1} of {quiz.questions.length}
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">{currentQuestion.text}</h2>
            
            {!currentQuestion.showSummary && (
              <div className="text-center py-8">
                <Clock size={40} className="mx-auto mb-4 text-teal-600" />
                <p className="text-gray-600">Waiting for results...</p>
              </div>
            )}
            
            {currentQuestion.showSummary && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BarChart2 className="mr-2" /> Response Distribution
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={labeledSummaryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="shortLabel" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#6366F1" name="Selected Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {labeledSummaryData.map((item) => (
                    <div key={item.shortLabel} className="flex items-start">
                      <span className="font-semibold mr-2">{item.shortLabel}:</span>
                      <span>{item.optionText}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {currentQuestion.showImpact && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <AlertTriangle className="mr-2" /> Impact Analysis
                </h3>
                {currentQuestion.options.map((option) => (
                  <div key={option._id} className="mb-4 p-4 bg-orange-50 rounded-md">
                    <p className="font-medium mb-2">{option.text}</p>
                    <p className="text-orange-700">{option.impact}</p>
                  </div>
                ))}
              </div>
            )}
            
            {currentQuestion.showMitigation && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <ShieldCheck className="mr-2" /> Kinematic Actions
                </h3>
                {currentQuestion.options.map((option) => (
                  <div key={option._id} className="mb-4 p-4 bg-green-50 rounded-md">
                    <p className="font-medium mb-2">{option.text}</p>
                    <p className="text-green-700">{option.mitigation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WaitingRoom;