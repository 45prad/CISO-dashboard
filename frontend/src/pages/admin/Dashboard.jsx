import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search } from 'lucide-react';
import axios from 'axios';
import AdminHeader from '../../components/AdminHeader';
import QuizCard from '../../components/QuizCard';
import AuthContext from '../../context/AuthContext';

const Dashboard = () => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useContext(AuthContext);
  
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/quizzes`);
        setQuizzes(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch quizzes');
        setLoading(false);
      }
    };
    
    fetchQuizzes();
  }, []);
  
  // Filter quizzes based on search term
  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and monitor your Scenarios</p>
          </div>
          
          <Link
            to="/admin/quiz/create"
            className="mt-4 md:mt-0 flex items-center justify-center py-2 px-4 text-white rounded-md hover:bg-blue-700 transition-colors" style={{ backgroundColor: '#00174D' }}
          >
            <PlusCircle size={20} className="mr-2" />
            Create New Scenario
          </Link>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search Scenario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-md">
            {error}
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <p className="text-gray-600 mb-4">No Scenario found.</p>
            <Link
              to="/admin/quiz/create"
              className="inline-flex items-center justify-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusCircle size={20} className="mr-2" />
              Create your first Scenario
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map(quiz => (
              <QuizCard key={quiz._id} quiz={quiz} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;