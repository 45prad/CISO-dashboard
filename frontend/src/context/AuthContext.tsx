import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const userFromStorage = localStorage.getItem('user');
    
    if (userFromStorage) {
      const parsedUser = JSON.parse(userFromStorage);
      setUser(parsedUser);
      
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
      fetchUser();
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await axios.post(`${backendUrl}/api/auth/login`, { email, password });
      
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await axios.post('/api/auth/register', { name, email, password });
      
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    
    // Remove auth header
    delete axios.defaults.headers.common['Authorization'];
  };

  const fetchUser = async () => {
  try {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('user') 
      ? JSON.parse(localStorage.getItem('user')!).token 
      : null;

    const { data } = await axios.get(`${backendUrl}/api/auth/user`);

    if (token) {
      setUser({
        ...data,
        token, // manually attach the token
      });
      localStorage.setItem('user', JSON.stringify({ ...data, token }));
    }

    setLoading(false);
  } catch (err: any) {
    console.error('Failed to fetch user', err);
    logout(); // token may be invalid
    setLoading(false);
  }
};



  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;