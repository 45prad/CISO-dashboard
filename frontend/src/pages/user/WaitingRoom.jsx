// WaitingRoom.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, MessageSquare, Users, BarChart2 } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import UserHeader from '../../components/UserHeader';
import AuthContext from '../../context/AuthContext';
import SocketContext from '../../context/SocketContext';
import ScenarioSummary from '../../components/ScenarioSummary';

const WaitingRoom = () => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState([]);

  const { user } = useContext(AuthContext);
  const { socket, joinQuizRoom, leaveQuizRoom } = useContext(SocketContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, submissionsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/quizzes/${id}`),
          axios.get(`${backendUrl}/api/submissions/user`)
        ]);

        setQuiz(quizRes.data);

        const userSubmission = submissionsRes.data.find(sub =>
          sub.quiz === id || (sub.quiz && sub.quiz._id === id)
        );

        if (!userSubmission) {
          navigate(`/quiz/${id}`);
          return;
        }

        setSubmission(userSubmission);
        setLoading(false);

        if (quizRes.data.showImpact && quizRes.data.showMitigation) {
          navigate(`/quiz/${id}/result`);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();

    if (socket && user) {
      joinQuizRoom(id);
    }

    return () => {
      if (socket && user) {
        leaveQuizRoom(id);
      }
    };
  }, [id, user, socket, navigate, joinQuizRoom, leaveQuizRoom]);

  // Fetch summary data when quiz.showSummary changes
  useEffect(() => {
    if (quiz?.showSummary) {
      const fetchSummaryData = async () => {
        try {
          const { data } = await axios.get(`${backendUrl}/api/submissions/summary/${id}`);
          setSummaryData(data);
        } catch (err) {
          console.error('Failed to fetch summary data:', err);
        }
      };
      fetchSummaryData();
    }
  }, [quiz?.showSummary, id]);

  useEffect(() => {
    if (!socket) return;
    
    const handleShowImpact = (data) => {
      if (data.quizId === id) {
        setQuiz(prev => prev ? { ...prev, showImpact: true } : prev);
      }
    };

    const handleShowMitigation = (data) => {
      if (data.quizId === id) {
        setQuiz(prev => prev ? { ...prev, showMitigation: true } : prev);
        navigate(`/quiz/${id}/result`);
      }
    };

    const handleShowSummary = (data) => {
      if (data.quizId === id) {
        setQuiz(prev => prev ? { ...prev, showSummary: true } : prev);
      }
    };

    const handleRoomUpdate = (data) => {
      setUserCount(data.userCount);
    };

    socket.on('showImpact', handleShowImpact);
    socket.on('showMitigation', handleShowMitigation);
    socket.on('showSummary', handleShowSummary);
    socket.on('roomUpdate', handleRoomUpdate);

    return () => {
      socket.off('showImpact', handleShowImpact);
      socket.off('showMitigation', handleShowMitigation);
      socket.off('showSummary', handleShowSummary);
      socket.off('roomUpdate', handleRoomUpdate);
    };
  }, [socket, id, navigate]);

  useEffect(() => {
    if (quiz && quiz.showImpact && quiz.showMitigation) {
      navigate(`/quiz/${id}/result`);
    }
  }, [quiz, id, navigate]);

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

  const labeledSummaryData = summaryData.map((item, index) => ({
    ...item,
    shortLabel: String.fromCharCode(65 + index), // A, B, C, ...
  }));


  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Waiting Room</h1>
          <p className="text-gray-600 mt-1">{quiz.title}</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
              <Clock size={32} />
            </div>

            <h2 className="text-xl font-semibold mb-2">Your Scenario Has Been Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Please wait while the instructor reveals the results. The page will update automatically.
            </p>

            {/* <div className="flex items-center justify-center mb-4">
              <Users size={20} className="text-teal-600 mr-2" />
              <span className="text-gray-700">{userCount} {userCount === 1 ? 'participant' : 'participants'} in waiting room</span>
            </div> */}

            {quiz.showImpact ? (
              <div className="bg-blue-100 text-blue-800 p-4 rounded-md mb-4">
                Impact explanations are now available! Waiting for Kinematic Actions ...
              </div>
            ) : (
              <div className="flex items-center justify-center mt-2 mb-4">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
                  <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                  <div className="h-3 w-3 bg-blue-600 rounded-full"></div>
                </div>
              </div>
            )}
          </div>

          {/* Summary Section - Only visible when showSummary is true */}
          {/* {quiz.showSummary && summaryData.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <BarChart2 className="mr-2" /> Quiz Summary
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summaryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="optionText" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Selected Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-gray-500 text-sm mt-2">
                Distribution of answers selected by all participants
              </p>
            </div>
          )} */}

          {quiz.showSummary && summaryData.length > 0 && (
            <ScenarioSummary
              summaryData={summaryData}
              labeledSummaryData={labeledSummaryData}
            />
          )}


          <div className="flex justify-between items-center mt-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Dashboard
            </button>

            <div className="flex space-x-2">
              {quiz.showImpact && (
                <button
                  onClick={() => navigate(`/quiz/${id}/result`)}
                  className="flex items-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Impact
                  <MessageSquare size={18} className="ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WaitingRoom;