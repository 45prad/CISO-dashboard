import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, AlertTriangle, Play, Pause, EyeOff, Eye, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminHeader from '../../components/AdminHeader';
import AuthContext from '../../context/AuthContext';
import SocketContext from '../../context/SocketContext';

const QuizMonitor = () => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    totalSubmitted: 0,
    waitingUsers: 0
  });
  
  const { user } = useContext(AuthContext);
  const { socket, joinQuizRoom } = useContext(SocketContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, submissionsRes, usersRes] = await Promise.all([
          axios.get(`${backendUrl}/api/quizzes/${id}`),
          axios.get(`${backendUrl}/api/submissions/quiz/${id}`),
          axios.get(`${backendUrl}/api/users`)
        ]);
        
        setQuiz(quizRes.data);
        setSubmissions(submissionsRes.data);
        setUsers(usersRes.data);
        
        const assignedUsers = quizRes.data.assignedUsers ? quizRes.data.assignedUsers.length : 0;
        const submittedCount = submissionsRes.data.length;
        
        setStats({
          totalAssigned: assignedUsers,
          totalSubmitted: submittedCount,
          waitingUsers: submittedCount
        });
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
        setLoading(false);
      }
    };
    
    fetchData();
    
    if (socket) {
      joinQuizRoom(id);
    }
  }, [id, socket, joinQuizRoom]);

  const toggleQuizActive = async () => {
    try {
      if (quiz.isActive) {
        await axios.put(`${backendUrl}/api/quizzes/${id}/deactivate`);
      } else {
        await axios.put(`${backendUrl}/api/quizzes/${id}/activate`);
      }
      
      setQuiz({
        ...quiz,
        isActive: !quiz.isActive
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quiz status');
    }
  };

  const showQuestion = async () => {
    try {
      await axios.put(`${backendUrl}/api/quizzes/${id}/question/${quiz.currentQuestionIndex}/show`);
      socket.emit('showQuestion', { quizId: id, questionIndex: quiz.currentQuestionIndex });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to show question');
    }
  };

  const showOptions = async () => {
    try {
      await axios.put(`${backendUrl}/api/quizzes/${id}/question/${quiz.currentQuestionIndex}/options`);
      socket.emit('showOptions', { quizId: id, questionIndex: quiz.currentQuestionIndex });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to show options');
    }
  };

  const showQuestionSummary = async () => {
    try {
      await axios.put(`${backendUrl}/api/quizzes/${id}/question/${quiz.currentQuestionIndex}/summary`);
      socket.emit('showQuestionSummary', { quizId: id, questionIndex: quiz.currentQuestionIndex });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to show summary');
    }
  };

  const showQuestionImpact = async () => {
    try {
      await axios.put(`${backendUrl}/api/quizzes/${id}/question/${quiz.currentQuestionIndex}/impact`);
      socket.emit('showQuestionImpact', { quizId: id, questionIndex: quiz.currentQuestionIndex });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to show impact');
    }
  };

  const showQuestionMitigation = async () => {
    try {
      await axios.put(`${backendUrl}/api/quizzes/${id}/question/${quiz.currentQuestionIndex}/mitigation`);
      socket.emit('showQuestionMitigation', { quizId: id, questionIndex: quiz.currentQuestionIndex });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to show mitigation');
    }
  };

  const nextQuestion = async () => {
    try {
      await axios.put(`${backendUrl}/api/quizzes/${id}/nextQuestion`);
      socket.emit('nextQuestion', { quizId: id });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to move to next question');
    }
  };

  const getCurrentQuestion = () => {
    return quiz?.questions[quiz.currentQuestionIndex];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate('/admin')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scenario Monitor</h1>
            <p className="text-gray-600 mt-1">{quiz.title}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Users size={24} className="text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold">Participation</h2>
            </div>
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Assigned Users:</span>
                <span className="font-semibold">{stats.totalAssigned}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Question:</span>
                <span className="font-semibold">{quiz.currentQuestionIndex + 1} of {quiz.questions.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Waiting Room:</span>
                <span className="font-semibold">{stats.waitingUsers}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle size={24} className="text-orange-500 mr-2" />
              <h2 className="text-lg font-semibold">Question Controls</h2>
            </div>
            <div className="flex flex-col space-y-3">
              <button
                onClick={toggleQuizActive}
                className={`flex items-center justify-center w-full py-2 px-4 rounded-md ${
                  quiz.isActive 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } transition-colors`}
              >
                {quiz.isActive ? (
                  <>
                    <Pause size={18} className="mr-2" />
                    End Scenario
                  </>
                ) : (
                  <>
                    <Play size={18} className="mr-2" />
                    Start Scenario
                  </>
                )}
              </button>

              {quiz.isActive && currentQuestion && (
                <>
                  <button
                    onClick={showQuestion}
                    disabled={currentQuestion.isVisible}
                    className={`w-full py-2 px-4 rounded-md ${
                      currentQuestion.isVisible
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    Show Question
                  </button>

                  <button
                    onClick={showOptions}
                    disabled={!currentQuestion.isVisible || currentQuestion.optionsVisible}
                    className={`w-full py-2 px-4 rounded-md ${
                      !currentQuestion.isVisible || currentQuestion.optionsVisible
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    Show Options
                  </button>

                  <button
                    onClick={showQuestionSummary}
                    disabled={!currentQuestion.optionsVisible || currentQuestion.showSummary}
                    className={`w-full py-2 px-4 rounded-md ${
                      !currentQuestion.optionsVisible || currentQuestion.showSummary
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    }`}
                  >
                    Show Summary
                  </button>

                  <button
                    onClick={showQuestionImpact}
                    disabled={!currentQuestion.showSummary || currentQuestion.showImpact}
                    className={`w-full py-2 px-4 rounded-md ${
                      !currentQuestion.showSummary || currentQuestion.showImpact
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    Show Impact
                  </button>

                  <button
                    onClick={showQuestionMitigation}
                    disabled={!currentQuestion.showImpact || currentQuestion.showMitigation}
                    className={`w-full py-2 px-4 rounded-md ${
                      !currentQuestion.showImpact || currentQuestion.showMitigation
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    Show Mitigation
                  </button>

                  {quiz.currentQuestionIndex < quiz.questions.length - 1 && (
                    <button
                      onClick={nextQuestion}
                      disabled={!currentQuestion.showMitigation}
                      className={`w-full py-2 px-4 rounded-md ${
                        !currentQuestion.showMitigation
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      Next Question
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {currentQuestion && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Current Question</h2>
            <div className="mb-4">
              <p className="text-lg font-medium">{currentQuestion.text}</p>
            </div>

            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="border rounded-md p-4">
                  <p className="font-medium">{option.text}</p>
                  {currentQuestion.showImpact && (
                    <p className="mt-2 text-orange-700">Impact: {option.impact}</p>
                  )}
                  {currentQuestion.showMitigation && (
                    <p className="mt-2 text-green-700">Mitigation: {option.mitigation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default QuizMonitor;