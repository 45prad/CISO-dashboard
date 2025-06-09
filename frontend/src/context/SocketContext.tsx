import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthContext } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  joinQuizRoom: (quizId: string) => void;
  leaveQuizRoom: (quizId: string) => void;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  joinQuizRoom: () => {},
  leaveQuizRoom: () => {},
});

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const newSocket = io(window.location.hostname === '13.235.75.80' 
      ? `${backendUrl}` 
      : window.location.origin
    );
    
    setSocket(newSocket);

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

  return (
    <SocketContext.Provider value={{
      socket,
      joinQuizRoom,
      leaveQuizRoom
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;