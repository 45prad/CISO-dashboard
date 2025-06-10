import React from 'react';
import AdminHeader from '../AdminHeader';

const LoadingScreen = ({ message = 'Loading Scenario...' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">{message}</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoadingScreen;
