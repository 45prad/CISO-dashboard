import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorAlert = ({ error, title = 'Error' }) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
      <div className="flex">
        <AlertCircle className="text-red-400 mr-3 mt-0.5" size={20} />
        <div>
          <p className="text-red-800 font-medium">{title}</p>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;
