import { useState, useEffect } from 'react';
import { Clock, Play, Loader2, Timer, Plus, Minus, Pause, RotateCcw } from 'lucide-react';
import axios from 'axios';

const TimerSetter = ({ quizId, onRefresh }) => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [timerStatus, setTimerStatus] = useState(null); // null, 'active', 'expired'
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCheckingTimer, setIsCheckingTimer] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  
  const presetDurations = [5, 10, 15, 30, 45, 60];

  // Check if timer is already running
  useEffect(() => {
  let countdownInterval;
  let syncInterval;

  if (timerStatus === 'active' && timeLeft > 0) {
    countdownInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(countdownInterval);
          setTimerStatus('expired');
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    // Sync with server every 60 seconds
    syncInterval = setInterval(() => {
      checkExistingTimer();
    }, 60000);
  }

  return () => {
    clearInterval(countdownInterval);
    clearInterval(syncInterval);
  };
}, [quizId, timerStatus, timeLeft]);

useEffect(() => {
    checkExistingTimer();
  }, [quizId]);


  const checkExistingTimer = async () => {
    try {
      setIsCheckingTimer(true);
      const response = await axios.get(`${backendUrl}/api/quizTimer/timeleft/${quizId}`);
      const { timeLeft } = response.data;
      
      if (timeLeft > 0) {
        setTimerStatus('active');
        setTimeLeft(timeLeft);
        onRefresh(quizId);
      } else {
        setTimerStatus('expired');
        setTimeLeft(0);
      }
    } catch (err) {
      // Timer doesn't exist or error occurred
      setTimerStatus(null);
      setTimeLeft(0);
    } finally {
      setIsCheckingTimer(false);
    }
  };

  const handleStartTimer = async () => {
    try {
      setIsLoading(true);
      const duration = durationMinutes * 60 * 1000;
      
      await axios.post(`${backendUrl}/api/quizTimer/start/${quizId}`, { duration });
      
      alert('Timer started successfully!');
      setShowSetup(false); // Hide setup after starting
      checkExistingTimer(); // Refresh timer status
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start timer');
    } finally {
      setIsLoading(false);
    }
  };

  const adjustDuration = (increment) => {
    const newValue = Math.max(1, durationMinutes + increment);
    setDurationMinutes(newValue);
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min${mins !== 1 ? 's' : ''}`;
  };

  const formatTimeLeft = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timerStatus === 'expired') return 'text-red-600';
    if (timeLeft < 300000) return 'text-orange-600'; // Less than 5 minutes
    if (timeLeft < 600000) return 'text-yellow-600'; // Less than 10 minutes
    return 'text-green-600';
  };

  const getTimerBgColor = () => {
    if (timerStatus === 'expired') return 'from-red-50 to-red-100 border-red-200';
    if (timeLeft < 300000) return 'from-orange-50 to-orange-100 border-orange-200';
    if (timeLeft < 600000) return 'from-yellow-50 to-yellow-100 border-yellow-200';
    return 'from-green-50 to-green-100 border-green-200';
  };

  if (isCheckingTimer && timerStatus === null) {
    return (
      <div className="relative">
        <div className="p-6 rounded-lg shadow-lg bg-gray-50">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-gray-600">Checking timer status...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show active timer display
  if ((timerStatus === 'active' || timerStatus === 'expired') && !showSetup) {
    return (
      <div className="relative">
        <div className={`p-6 rounded-lg shadow-lg bg-gradient-to-br border ${getTimerBgColor()}`}>
          {/* Active Timer Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${timerStatus === 'expired' ? 'bg-red-500' : 'bg-green-500'}`}>
              <Timer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {timerStatus === 'expired' ? 'Timer Expired' : 'Timer Active'}
              </h3>
              <p className="text-sm text-gray-600">
                {timerStatus === 'expired' ? 'Quiz time has ended' : 'Quiz is currently timed'}
              </p>
            </div>
          </div>

          {/* Time Display */}
          <div className="text-center mb-6">
            <div className={`text-6xl font-bold ${getTimerColor()} mb-2`}>
              {formatTimeLeft(timeLeft)}
            </div>
            <div className="text-sm text-gray-600">
              {timerStatus === 'expired' ? 'Time Expired' : 'Time Remaining'}
            </div>
            {timerStatus === 'active' && timeLeft < 300000 && (
              <div className="mt-2 text-sm font-medium text-orange-600">
                ⚠️ Less than 5 minutes remaining!
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={checkExistingTimer}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
            </button>
            
            <button
              onClick={() => setShowSetup(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              Start New Timer
            </button>
          </div>

          {/* Status Footer */}
          <div className={`mt-4 p-3 rounded-lg border ${
            timerStatus === 'expired' 
              ? 'bg-red-100 border-red-200' 
              : 'bg-green-100 border-green-200'
          }`}>
            <div className="flex items-start gap-2">
              <div className={`w-4 h-4 mt-0.5 rounded-full flex items-center justify-center ${
                timerStatus === 'expired' ? 'bg-red-500' : 'bg-green-500'
              }`}>
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <div className={`text-xs ${
                timerStatus === 'expired' ? 'text-red-700' : 'text-green-700'
              }`}>
                <p className="font-medium mb-1">
                  {timerStatus === 'expired' 
                    ? 'Quiz time has ended - Delegates can no longer submit responses'
                    : 'Timer is running - Delegates can see the countdown'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show timer setup interface (original)
  return (
    <div className="relative">
      <div className="p-6 rounded-lg shadow-lg">
        {/* Back to Timer Button - only show if timer exists */}
        {(timerStatus === 'active' || timerStatus === 'expired') && (
          <div className="mb-4">
            <button
              onClick={() => setShowSetup(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            >
              <Timer className="w-4 h-4" />
              ← Back to Active Timer
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Timer className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Quiz Timer</h3>
            <p className="text-sm text-gray-600">Set the duration for your quiz session</p>
          </div>
        </div>

        {/* Preset Duration Buttons */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Quick Select:</label>
          <div className="flex flex-wrap gap-2">
            {presetDurations.map((preset) => (
              <button
                key={preset}
                onClick={() => setDurationMinutes(preset)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  durationMinutes === preset
                    ? 'bg-blue-500 text-white shadow-md transform scale-105'
                    : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                {formatTime(preset)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Duration Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Custom Duration:</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjustDuration(-1)}
              disabled={durationMinutes <= 1}
              className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            
            <div className="relative flex-1 max-w-xs">
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value)))}
                className="w-full px-4 py-3 text-center text-lg font-semibold bg-white border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            <button
              onClick={() => adjustDuration(1)}
              className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <div className="mt-2 text-center">
            <span className="text-sm text-gray-500">Duration: </span>
            <span className="text-sm font-semibold text-blue-600">{formatTime(durationMinutes)}</span>
          </div>
        </div>

        {/* Start Timer Button */}
        <button
          onClick={handleStartTimer}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-white transition-all duration-200 transform ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Starting Timer...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Start {formatTime(durationMinutes)} Timer</span>
            </>
          )}
        </button>

        {/* Info Footer */}
        <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 mt-0.5 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Timer will start immediately once activated</p>
              <p>Students will see a countdown and receive notifications as time runs out</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimerSetter;