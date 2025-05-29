import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import AdminHeader from '../../components/AdminHeader';

const ScoreBoard = () => {
  const [scoreboard, setScoreboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const backendUrl = import.meta.env.VITE_BACKENDURL;

  
  useEffect(() => {
    const fetchScoreboard = async () => {
      try {
        setLoading(true);
       
        
        const { data } = await axios.get(`${backendUrl}/api/scoreboard`);
        setScoreboard(data);
        setLoading(false);
      } catch (error) {
        setError(
          error.response?.data?.message || 
          error.message || 
          'Error fetching scoreboard'
        );
        setLoading(false);
      }
    };
    
    fetchScoreboard();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center mt-5">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="mt-5 max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
          <AdminHeader />
      <h2 className="text-2xl font-bold mx-auto mb-6 py-6 px-8 text-gray-800">User Scoreboard</h2>
      <div className="container mx-auto px-4 py-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Situations</th>
             
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {scoreboard.map((user, index) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.totalCorrect}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.totalQuestions}</td>
               
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScoreBoard;