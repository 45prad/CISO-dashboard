import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import axios from 'axios';
import UserHeader from '../../components/UserHeader';
import QuizCard from '../../components/QuizCard';
import AuthContext from '../../context/AuthContext';

const Dashboard = () => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const [quizzes, setQuizzes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useContext(AuthContext);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch assigned quizzes and user submissions in parallel
        const [quizzesRes, submissionsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/quizzes/assigned`),
          axios.get(`${backendUrl}/api/submissions/user`)
        ]);
        
        setQuizzes(quizzesRes.data);
        setSubmissions(submissionsRes.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Check if user has attempted a quiz
  const hasAttemptedQuiz = (quizId) => {
    return submissions.some(submission => submission.quiz._id === quizId);
  };
  
  // Filter quizzes based on search term
  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Scenarios</h1>
            <p className="text-gray-600 mt-1">View and take your assigned Scenarios</p>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search Scenarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <p className="text-gray-600 mb-4">No Scenarios have been assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map(quiz => (
              <QuizCard 
                key={quiz._id} 
                quiz={quiz} 
                hasAttempted={hasAttemptedQuiz(quiz._id)}
                userView={true}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;