
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, AlertTriangle, Play, Pause, EyeOff, Eye, ListChecks, BarChart } from 'lucide-react';
import axios from 'axios';
import AdminHeader from '../../components/AdminHeader';
import SocketContext from '../../context/SocketContext';
import ScenarioSummary from '../../components/ScenarioSummary';
import ResponseStats from '../../components/ResponseStats';
import TimerSetter from '../../components/Quiz/TimerSetter';

const QuizMonitor = () => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const [summaryData, setSummaryData] = useState([]);
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizStats, setQuizStats] = useState([]);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    totalSubmitted: 0,
    waitingUsers: 0
  });

  const {
    socket,
    joinQuizRoom,
    adminActivateQuiz,
    adminDeactivateQuiz,
    adminShowImpact,
    adminShowMitigation,
    adminShowSummary,
    adminShowOptions,
    refreshQuiz
  } = useContext(SocketContext);

  const navigate = useNavigate();


  // Add this function to fetch summary data
  const fetchSummaryData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/submissions/summary/${id}`);
      setSummaryData(data);
    } catch (err) {
      console.error('Failed to fetch summary data:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/submissions/quiz/${id}/stats`);

      setQuizStats(data);
    } catch (err) {
      console.error('Failed to load quiz stats:', err);
    }
  };

  // Add this toggle function
  const toggleSummary = async () => {
    try {
      const { data } = await axios.put(`${backendUrl}/api/quizzes/${id}/summary`);

      setQuiz({
        ...quiz,
        showSummary: data.showSummary
      });

      if (data.showSummary) {
        await fetchSummaryData();
        await fetchStats();
        adminShowSummary(id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle summary visibility');
    }
  };

  const toggleOptions = async () => {
    try {
      const { data } = await axios.put(`${backendUrl}/api/quizzes/${id}/options`);

      setQuiz({
        ...quiz,
        showOptions: data.showOptions
      });

      if (data.showOptions) {
        adminShowOptions(id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle summary visibility');
    }
  };

  useEffect(() => {
    fetchData();

    // Join socket room
    if (socket) {
      joinQuizRoom(id);
    }

    // Cleanup on unmount
    return () => {
      // Nothing to cleanup yet
    };
  }, [id, socket, joinQuizRoom]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [quizRes, submissionsRes, usersRes] = await Promise.all([
        axios.get(`${backendUrl}/api/quizzes/${id}`),
        axios.get(`${backendUrl}/api/submissions/quiz/${id}`),
        axios.get(`${backendUrl}/api/users`)
      ]);

      setQuiz(quizRes.data);
      setSubmissions(submissionsRes.data);
      setUsers(usersRes.data);

      if (quizRes.data.showSummary) {
        await fetchSummaryData(); // Wait for summary data to load
        await fetchStats(); // Also ensure stats are loaded
      }

      const assignedUsers = quizRes.data.assignedUsers?.length || 0;
      const submittedCount = submissionsRes.data.length;

      setStats({
        totalAssigned: assignedUsers,
        totalSubmitted: submittedCount,
        waitingUsers: submittedCount
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
      // setQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // Update room info when users join/leave
    const handleRoomUpdate = (data) => {
      setStats(prev => ({
        ...prev,
        waitingUsers: data.userCount
      }));
    };

    socket.on('roomUpdate', handleRoomUpdate);

    return () => {
      socket.off('roomUpdate', handleRoomUpdate);
    };
  }, [socket]);

  const toggleQuizActive = async () => {
    try {
      if (quiz.isActive) {
        // Deactivate quiz
        await axios.put(`${backendUrl}/api/quizzes/${id}/deactivate`);
        adminDeactivateQuiz(id);
      } else {
        // Activate quiz
        await axios.put(`${backendUrl}/api/quizzes/${id}/activate`);
        adminActivateQuiz(id);
      }

      // Update local state
      setQuiz({
        ...quiz,
        isActive: !quiz.isActive,
        showImpact: false,
        showMitigation: false
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quiz status');
    }
  };

  const toggleImpact = async () => {
    try {
      const { data } = await axios.put(`${backendUrl}/api/quizzes/${id}/impact`);

      // Update local state
      setQuiz({
        ...quiz,
        showImpact: data.showImpact
      });

      // Emit socket event to show impact
      if (data.showImpact) {
        adminShowImpact(id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle impact visibility');
    }
  };

  const toggleMitigation = async () => {
    try {
      const { data } = await axios.put(`${backendUrl}/api/quizzes/${id}/mitigation`);

      // Update local state
      setQuiz({
        ...quiz,
        showMitigation: data.showMitigation
      });

      // Emit socket event to show mitigation
      if (data.showMitigation) {
        adminShowMitigation(id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle mitigation visibility');
    }
  };

  // Get user name by ID
  const getUserName = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? user.name : 'Unknown User';
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

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="bg-red-100 text-red-700 p-4 rounded-md">
            Scenario not found
          </div>
        </div>
      </div>
    );
  }

  const labeledSummaryData = summaryData.map((item, index) => ({
    ...item,
    shortLabel: String.fromCharCode(65 + index), // A, B, C, D, ...
  }));

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                <span className="text-gray-600">Submissions:</span>
                <span className="font-semibold">{stats.totalSubmitted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Waiting Room:</span>
                <span className="font-semibold">{stats.waitingUsers}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full mt-2">
                <div
                  className="h-2 bg-blue-600 rounded-full"
                  style={{ width: `${stats.totalAssigned ? (stats.totalSubmitted / stats.totalAssigned) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle size={24} className="text-orange-500 mr-2" />
              <h2 className="text-lg font-semibold">Scenario Status</h2>
            </div>
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold ${quiz.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {quiz.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Show Risk Ratings:</span>
                <span className={`font-semibold ${quiz.showImpact ? 'text-green-600' : 'text-red-600'}`}>
                  {quiz.showImpact ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Show Kinematic Actions:</span>
                <span className={`font-semibold ${quiz.showMitigation ? 'text-green-600' : 'text-red-600'}`}>
                  {quiz.showMitigation ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </div>
          </div>
          <TimerSetter quizId={quiz._id} onRefresh={refreshQuiz} />

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <CheckCircle size={24} className="text-green-600 mr-2" />
              <h2 className="text-lg font-semibold">Controls</h2>
            </div>
            <div className="flex flex-col space-y-3">
              <button
                onClick={toggleQuizActive}
                className={`flex items-center justify-center w-full py-2 px-4 rounded-md ${quiz.isActive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
                  } transition-colors`}
              >
                {quiz.isActive ? (
                  <>
                    <Pause size={18} className="mr-2" />
                    Deactivate Scenario
                  </>
                ) : (
                  <>
                    <Play size={18} className="mr-2" />
                    Activate Scenario
                  </>
                )}
              </button>

              <button
                onClick={toggleOptions}
                disabled={!quiz.isActive}
                className={`flex items-center justify-center w-full py-2 px-4 rounded-md ${quiz.showOptions
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
                  } transition-colors`}
              >
                <ListChecks size={20} className="mr-2" /> {quiz.showOptions ? "Hide Options" : "Show Options"}
              </button>

              <button
                onClick={toggleSummary}
                disabled={!quiz.isActive}
                className={`flex items-center justify-center w-full py-2 px-4 rounded-md ${!quiz.isActive
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : quiz.showSummary
                    ? 'bg-indigo-200 text-indigo-800 hover:bg-indigo-300'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  } transition-colors`}
              >
                <BarChart size={20} className="mr-2" />{quiz.showSummary ? "Hide Summary" : "Show Summary"}
              </button>


              <button
                onClick={toggleImpact}
                disabled={!quiz.isActive}
                className={`flex items-center justify-center w-full py-2 px-4 rounded-md ${!quiz.isActive
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : quiz.showImpact
                    ? 'bg-orange-200 text-orange-800 hover:bg-orange-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } transition-colors`}
              >
                {quiz.showImpact ? (
                  <>
                    <EyeOff size={18} className="mr-2" />
                    Hide Risk Ratings
                  </>
                ) : (
                  <>
                    <Eye size={18} className="mr-2" />
                    Show Risk Ratings
                  </>
                )}
              </button>

              <button
                onClick={toggleMitigation}
                disabled={!quiz.isActive || !quiz.showImpact}
                className={`flex items-center justify-center w-full py-2 px-4 rounded-md ${!quiz.isActive || !quiz.showImpact
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : quiz.showMitigation
                    ? 'bg-purple-200 text-purple-800 hover:bg-purple-300'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                  } transition-colors`}
              >
                {quiz.showMitigation ? (
                  <>
                    <EyeOff size={18} className="mr-2" />
                    Hide Kinematic Actions
                  </>
                ) : (
                  <>
                    <Eye size={18} className="mr-2" />
                    Show Kinematic Actions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {quiz.showSummary && summaryData.length > 0 && (
          <ScenarioSummary
            summaryData={summaryData}
            labeledSummaryData={labeledSummaryData}
          />
        )}

        {quiz.showSummary && quizStats && quizStats.length > 0 && (
          quizStats.map(stat => (
            <ResponseStats
              key={stat.questionId}
              questionText={stat.questionText}
              options={stat.options}
            />
          ))
        )}
      </main>
    </div>
  );
};

export default QuizMonitor;
