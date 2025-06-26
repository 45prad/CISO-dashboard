import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import SocketContext from '../../context/SocketContext';
import AuthContext from '../../context/AuthContext';

const QuizTimerHeader = ({ quizId }) => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { socket, joinQuizRoom, leaveQuizRoom } = useContext(SocketContext);

  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Join socket room
  useEffect(() => {
    if (socket && user) joinQuizRoom(id);
    return () => { if (socket && user) leaveQuizRoom(id); };
  }, [id, socket]);

  // Listen to quiz updates
  useEffect(() => {
    if (!socket) return;
    socket.on('quizUpdated', handleRefreshQuiz);
    return () => socket.off('quizUpdated', handleRefreshQuiz);
  }, [socket]);

  const handleRefreshQuiz = async (data) => {
    if (data.quiz._id === quizId) await fetchTimeLeft();
  };

  // Fetch initial timer
  const fetchTimeLeft = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/quizTimer/timeleft/${quizId}`);
      console.log('Fetched time:', res.data);
      setTimeLeft(res.data?.timeLeft);
      setIsPaused(res.data?.isPaused);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching time left:', error);
      setLoading(false);
    }
  };

  // Countdown (if not paused)
  useEffect(() => {
    if (!quizId) return;
    fetchTimeLeft();

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (isPaused || prev <= 0) return prev;
        return Math.max(0, prev - 1000);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quizId, isPaused]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return hours > 0
      ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 60000) return 'text-red-500';
    if (timeLeft <= 300000) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (timeLeft <= 0 && !isPaused) return null;

  return (
    <div className="px-6 py-4">
      <div className="flex justify-end items-center">
        <div className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
          {isPaused ? `⏸️ Paused - ${formatTime(timeLeft)}` : `⏱️ Time Left - ${formatTime(timeLeft)}`}
        </div>
      </div>
    </div>
  );
};

export default QuizTimerHeader;
