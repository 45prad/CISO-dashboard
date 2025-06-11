import { useState, useEffect } from 'react';
import axios from 'axios';
import { useContext } from 'react';
import SocketContext from '../../context/SocketContext';
import AuthContext from '../../context/AuthContext';
import { useParams } from 'react-router-dom';

const QuizTimerHeader = ({ quizId }) => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const { id } = useParams();
    const { user } = useContext(AuthContext);
  const [timeLeft, setTimeLeft] = useState(0);

  const [loading, setLoading] = useState(true);const { socket, joinQuizRoom, leaveQuizRoom } = useContext(SocketContext);
  
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
  
      socket.on('quizUpdated', handleRefreshQuiz);
  
      return () => {
        socket.off('quizUpdated', handleRefreshQuiz);
      };
    }, [socket]);

    const handleRefreshQuiz = async (data) => {
      console.log('Received quiz update:', data);
      
      if (data.quizId === quizId) {
        await fetchTimeLeft();
      }
  };

  const fetchTimeLeft = async () => {
    try {      
      const response = await axios.get(`${backendUrl}/api/quizTimer/timeleft/${quizId}`);
      console.log('Time left data:', response.data?.timeLeft);
      
      setTimeLeft(response?.data?.timeLeft);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching time left:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!quizId) return;
    
    fetchTimeLeft();
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [quizId]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 60000) return 'text-red-500'; // Less than 1 minute
    if (timeLeft <= 300000) return 'text-yellow-500'; // Less than 5 minutes
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

  if (timeLeft <= 0) return null;

  return (
    <div className="px-6 py-4">
      <div className="flex justify-end items-center">
        <div className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
          {timeLeft <= 0 ? 'Time\'s Up!' : 'Time Left - '+formatTime(timeLeft)}
        </div>
      </div>
    </div>
  );
};

export default QuizTimerHeader;