import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthContext } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  joinQuizRoom: (quizId: string) => void;
  leaveQuizRoom: (quizId: string) => void;
  adminShowImpact: (quizId: string) => void;
  adminShowMitigation: (quizId: string) => void;
  adminActivateQuiz: (quizId: string) => void;
  adminDeactivateQuiz: (quizId: string) => void;
  adminShowSummary: (quizId: string) => void;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  joinQuizRoom: () => {},
  leaveQuizRoom: () => {},
  adminShowImpact: () => {},
  adminShowMitigation: () => {},
  adminActivateQuiz: () => {},
  adminDeactivateQuiz: () => {},
  adminShowSummary:()=>{},
});

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(window.location.hostname === '13.235.75.80' 
      ? `${backendUrl}` 
      : window.location.origin
    );
    
    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinQuizRoom = (quizId: string) => {
    if (socket && user) {
      socket.emit('joinQuizRoom', {
        quizId,
        userId: user._id,
        role: user.role,
      });
    }
  };

  const leaveQuizRoom = (quizId: string) => {
    if (socket && user) {
      socket.emit('leaveQuizRoom', {
        quizId,
        userId: user._id,
        role: user.role,
      });
    }
  };

  const adminShowSummary = (quizId: string) => {
  if (socket && user && user.role === 'admin') {
    socket.emit('adminShowSummary', { quizId });
  }
};

  const adminShowImpact = (quizId: string) => {
    if (socket && user && user.role === 'admin') {
      socket.emit('adminShowImpact', { quizId });
    }
  };

  const adminShowMitigation = (quizId: string) => {
    if (socket && user && user.role === 'admin') {
      socket.emit('adminShowMitigation', { quizId });
    }
  };

  const adminActivateQuiz = (quizId: string) => {
    if (socket && user && user.role === 'admin') {
      socket.emit('adminActivateQuiz', { quizId });
    }
  };

  const adminDeactivateQuiz = (quizId: string) => {
    if (socket && user && user.role === 'admin') {
      socket.emit('adminDeactivateQuiz', { quizId });
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      joinQuizRoom,
      leaveQuizRoom,
      adminShowImpact,
      adminShowMitigation,
      adminActivateQuiz,
      adminDeactivateQuiz,
      adminShowSummary
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;